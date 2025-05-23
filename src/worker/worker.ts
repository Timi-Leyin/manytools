import { generateRandomData } from "@/utils/random-file-creator/generate-content";
import type { WorkerEvent } from ".";
console.log(">", "Worker Ready!");

addEventListener("message", async (e) => {
  const response = e.data as WorkerEvent;
  const now = Date.now();
  console.log("working on it...");

  for (let i = 0; i < 999999; i++) {
    // Simulate some work
  }

  //   generateRandomData(1024 * 1024 * 10); // 10MB
  //   const ddata = generateRandomData(1024 * 1024 * 1024 * 1); // 10GB

  async function generateLargeFileWithStreams(
    sizeInBytes: number,
    onProgress?: (percent: number) => void
  ): Promise<Blob> {
    // Create a WritableStream that accumulates chunks into a blob
    const chunks: Blob[] = [];

    // Use a ReadableStream to generate data in chunks
    const chunkSize = 10 * 1024 * 1024; // 10MB chunks
    let bytesProcessed = 0;

    const readableStream = new ReadableStream({
      start(controller) {},
      pull(controller) {
        // Determine this chunk's size
        const remainingBytes = sizeInBytes - bytesProcessed;
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

        if (onProgress) {
          onProgress((bytesProcessed / sizeInBytes) * 100);
        }
      },
    });

    // Consume the readable stream
    const reader = readableStream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(new Blob([value]));
    }

    return new Blob(chunks);
  }

  const ddata = await generateLargeFileWithStreams(
    1024 * 1024 * 1024 * 10,
    (progress) => {
        console.clear()
      console.log(`Progress: ${progress.toFixed(2)}%`);
    }
  );

  const end = Date.now();
  console.log("done in", (Number(end - now) / 1000).toFixed(2), "s");
  //   console.log("Recived evetnt", e);
  console.log(ddata);
});
