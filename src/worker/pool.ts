import { url, type WorkerEvent } from ".";
import { nanoid } from "nanoid";
import Worker from "web-worker";

interface WorkerPool {
  id: string;
  worker: Worker;
  busy?: boolean;
}

export const workers: WorkerPool[] = [];
const maxWorkers = Math.max(1, (navigator.hardwareConcurrency || 1) - 1);

const WorkerIsAvailable = () => {
  const noOfAvailableWorkers = workers.reduce((prev, curr: WorkerPool) => {
    if (!curr?.busy) {
      prev += 1;
    }
    return prev;
  }, 0);

  if (noOfAvailableWorkers >= maxWorkers) return false;
  if (workers.length >= maxWorkers) {
    return false;
  }

  return true;
};

export const terminateWorker = (workerId: string) => {
  const workerIndex = workers.findIndex((w) => w.id === workerId);
  if (workerIndex !== -1) {
    workers[workerIndex].worker.terminate();
    workers.splice(workerIndex, 1);
  }
};

export const getAvailableWorkers = () => {
  const availableWorkers = workers.filter((w) => !w.busy);
  return maxWorkers - availableWorkers.length;
};

export const createWorker = () => {
  if (!WorkerIsAvailable()) {
    console.warn("No available workers");
    return;
  }

  const worker = new Worker(url, { type: "module" });
  const newWoker: WorkerPool = {
    id: nanoid(),
    worker,
    busy: true,
  };

  workers.push(newWoker);

  worker.addEventListener("message", (ev) => {
    const event = ev.data as WorkerEvent;

    if (event.type == "cpu_processing:main") {
      console.log("CPU processing in main thread", event.payload);
    }
  });

  return newWoker;
};
