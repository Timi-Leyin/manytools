import React, { useRef, useCallback, useContext } from "react";

interface WorkerTask {
  id: string;
  type: string;
  payload: any;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  onProgress?: (progress: { done: number; total: number }) => void;
}

interface LocalWorker {
  id: string;
  worker: Worker;
  isBusy: boolean;
  currentTask?: WorkerTask;
}

interface WorkerContextType {
  executeTask: (
    type: string, 
    payload: any, 
    onProgress?: (progress: { done: number; total: number }) => void
  ) => Promise<any>;
  getActiveWorkerCount: () => number;
  getMaxWorkerCount: () => number;
  setMaxWorkerCount: (count: number) => void;
  getQueueSize: () => number;
  terminateAllWorkers: () => void;
}

const WorkerContext = React.createContext<WorkerContextType | null>(null);

interface WorkerProviderProps {
  children: React.ReactNode;
  maxConcurrentWorkers?: number;
}

export const WorkerProvider = ({ children, maxConcurrentWorkers }: WorkerProviderProps) => {
  const workers = useRef<LocalWorker[]>([]);
  const taskQueue = useRef<WorkerTask[]>([]);
  const maxWorkers = useRef(
    maxConcurrentWorkers || 
    Math.min(4, Math.max(1, (navigator.hardwareConcurrency || 4) - 1))
  );

  const createWorker = useCallback((): LocalWorker => {
    const worker = new Worker(
      new URL("@/workers/worker.ts", import.meta.url),
      {
        type: "module",
      }
    );

    const localWorker: LocalWorker = {
      id: Math.random().toString(36).substring(2, 15),
      worker,
      isBusy: false,
    };

    worker.onmessage = (event) => {
      const { id, type, success, result, error, progress } = event.data;
      
      if (!localWorker.currentTask || localWorker.currentTask.id !== id) {
        return; // Message for different task or no current task
      }

      if (progress && localWorker.currentTask.onProgress) {
        localWorker.currentTask.onProgress(progress);
        return; 
      }

      if (success) {
        localWorker.currentTask.resolve(result);
      } else {
        localWorker.currentTask.reject(new Error(error || 'Worker task failed'));
      }

      localWorker.isBusy = false;
      localWorker.currentTask = undefined;
      processNextTask();
    };

    worker.onerror = (error) => {
      if (localWorker.currentTask) {
        localWorker.currentTask.reject(new Error(`Worker error: ${error.message}`));
        localWorker.currentTask = undefined;
      }
      localWorker.isBusy = false;
      processNextTask();
    };

    return localWorker;
  }, []);

  const processNextTask = useCallback(() => {
    const task = taskQueue.current.shift();
    if (!task) return;

    let availableWorker = workers.current.find(w => !w.isBusy);
    
    if (!availableWorker && workers.current.length < maxWorkers.current) {
      availableWorker = createWorker();
      workers.current.push(availableWorker);
    }

    if (availableWorker) {
      availableWorker.isBusy = true;
      availableWorker.currentTask = task;
      availableWorker.worker.postMessage({
        id: task.id,
        type: task.type,
        payload: task.payload
      });
    } else {
      taskQueue.current.unshift(task);
    }
  }, [createWorker]);

  const executeTask = useCallback((
    type: string, 
    payload: any, 
    onProgress?: (progress: { done: number; total: number }) => void
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id: Math.random().toString(36).substring(2, 15),
        type,
        payload,
        resolve,
        reject,
        onProgress
      };

      taskQueue.current.push(task);
      processNextTask();
    });
  }, [processNextTask]);

  const getActiveWorkerCount = useCallback(() => {
    return workers.current.filter(w => w.isBusy).length;
  }, []);

  const getMaxWorkerCount = useCallback(() => {
    return maxWorkers.current;
  }, []);

  const setMaxWorkerCount = useCallback((count: number) => {
    const newCount = Math.max(1, Math.min(count, navigator.hardwareConcurrency || 4));
    maxWorkers.current = newCount;
    
    // If we're reducing the max workers, terminate excess workers that are not busy
    if (workers.current.length > newCount) {
      const workersToTerminate = workers.current
        .filter(w => !w.isBusy)
        .slice(newCount - workers.current.filter(w => w.isBusy).length);
      
      workersToTerminate.forEach(w => {
        try {
          w.worker.terminate();
        } catch (e) {
          console.error(`Error terminating excess worker ${w.id}:`, e);
        }
      });
      
      workers.current = workers.current.filter(w => !workersToTerminate.includes(w));
    }
  }, []);

  const getQueueSize = useCallback(() => {
    return taskQueue.current.length;
  }, []);

  const terminateAllWorkers = useCallback(() => {
    workers.current.forEach(w => {
      try {
        w.worker.terminate();
      } catch (e) {
        console.error(`Error terminating worker ${w.id}:`, e);
      }
    });
    workers.current = [];
    taskQueue.current = [];
  }, []);

  const contextValue: WorkerContextType = {
    executeTask,
    getActiveWorkerCount,
    getMaxWorkerCount,
    setMaxWorkerCount,
    getQueueSize,
    terminateAllWorkers
  };

  return (
    <WorkerContext.Provider value={contextValue}>
      {children}
    </WorkerContext.Provider>
  );
};

export const useWorker = (): WorkerContextType => {
  const context = useContext(WorkerContext);
  if (!context) {
    throw new Error('useWorker must be used within a WorkerProvider');
  }
  return context;
};
