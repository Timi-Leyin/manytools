// import Worker from "web-worker";

export const url = new URL("./worker.js", import.meta.url);
// export const worker = new Worker(url, { type: "module" });

export interface WorkerEvent {
  type: "test" | "generate" | "cpu_processing:thread" | "cpu_processing:main";
  payload: any;
}