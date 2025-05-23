import Worker from "web-worker";

const url = new URL("./worker.js", import.meta.url);
export const worker = new Worker(url, { type: "module" });

export interface WorkerEvent {
  type: "test" | "generate";
  payload: any;
}

export const triggerWorker = (
  type: WorkerEvent["type"],
  payload: WorkerEvent["payload"]
) => {
  worker.postMessage({ type, payload });
};

worker.addEventListener("message",(ev)=>{
    console.log("Response")
})