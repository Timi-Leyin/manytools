import {
  generateJsonFile,
  generateRandomData,
  generateTextFile,
} from "@/utils/random-file-creator/generate-content";
import type { WorkerEvent } from ".";
console.log(">", "Worker Ready!");

addEventListener("message", async (e) => {
  console.log("? Worker Executing task...");
  const response = e.data as WorkerEvent;
  const start = Date.now();

  if (response.type === "cpu_processing:thread") {
    const payload = response.payload;
    const type = payload.fileType;
    const chunkSize = payload.chunkSize;
    const chunkIndex = payload.chunkIndex;
    const startByte = payload.startByte;
    const endByte = payload.endByte;

    try {

      const end = Date.now();
      console.log(
        `Worker ${chunkIndex + 1}/${payload.totalChunks} done in ${((end - start) / 1000).toFixed(2)}s`
      );

  let bytesProcessed = 0;
  
  const readableStream = new ReadableStream({
    start(controller) {},
    pull(controller) {
      // Determine this chunk's size
      const remainingBytes = chunkSize - bytesProcessed;
      const currentChunkSize = Math.min(chunkSize, remainingBytes);
      
      if (currentChunkSize <= 0) {
        controller.close();
        return;
      }
      
      // Generate chunk data
      const chunkData = generateRandomData(currentChunkSize);
      
      // Push the chunk
      controller.enqueue(chunkData);
      
      // Update progress
      bytesProcessed += currentChunkSize;

      console.log((bytesProcessed / chunkSize) * 100);
    }
  });
  
  // Consume the readable stream
  const reader = readableStream.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

      self.postMessage(
        {
          workerId: payload.workerId,
          chunkIndex,
          data:value,
        }
        // []
      ); // Transfer ownership for better performance
  }


    } catch (error: any) {
      self.postMessage({
        workerId: payload.workerId,
        error: error.message || "Unknown error in worker",
      });
    }
  }

  const end = Date.now();
  console.log("done in", (Number(end - start) / 1000).toFixed(2), "s");
});
