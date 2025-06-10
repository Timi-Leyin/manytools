// Generic worker that can handle multiple task types
export interface WorkerMessage {
  id: string;
  type: string;
  payload: any;
}

export interface WorkerResponse {
  id: string;
  type: string;
  success: boolean;
  result?: any;
  error?: string;
  progress?: { done: number; total: number };
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = event.data;

  try {
    switch (type) {
      case "randomText":
        await handleRandomText(id, payload);
        break;
      case "randomImage":
        await handleRandomImage(id, payload);
        break;
      case "imageCompression":
        await handleImageCompression(id, payload);
        break;
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    self.postMessage({
      id,
      type,
      success: false,
      error: message,
    } satisfies WorkerResponse);
  }
};

async function handleRandomText(id: string, payload: { size: number }) {
  const { size } = payload;
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ";
  const chunkSize = 1024 * 1024 * 2; // 2MB chunks
  let remaining = size;
  const chunks: Uint8Array[] = [];
  let processed = 0;

  while (remaining > 0) {
    const thisChunk = Math.min(chunkSize, remaining);

    // Generate exactly the number of bytes needed
    const bytes = new Uint8Array(thisChunk);
    for (let i = 0; i < thisChunk; i++) {
      const char = chars.charAt(Math.floor(Math.random() * chars.length));
      bytes[i] = char.charCodeAt(0);
    }

    chunks.push(bytes);
    remaining -= thisChunk;
    processed += thisChunk;

    if (chunks.length % 5 === 0) {
      self.postMessage({
        id,
        type: "randomText",
        success: true,
        progress: { done: processed, total: size },
      } satisfies WorkerResponse);
    }

    // Yield control to prevent blocking
    if (chunks.length % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  const blob = new Blob(chunks, { type: "text/plain" });
  self.postMessage({
    id,
    type: "randomText",
    success: true,
    result: blob,
  } satisfies WorkerResponse);
}

async function handleRandomImage(id: string, payload: { size: number }) {
  const { size } = payload;

  const maxDimension = 8192;
  let dim = Math.min(
    maxDimension,
    Math.max(64, Math.ceil(Math.sqrt(size / 2)))
  );
  let quality = 0.92;
  let blob = null;
  let attempts = 0;

  while (attempts < 8 && !blob) {
    try {
      let canvas, ctx;
      if (typeof OffscreenCanvas !== "undefined") {
        canvas = new OffscreenCanvas(dim, dim);
        ctx = canvas.getContext("2d");
      } else if (typeof (self as any).OffscreenCanvas !== "undefined") {
        canvas = new (self as any).OffscreenCanvas(dim, dim);
        ctx = canvas.getContext("2d");
      } else {
        throw new Error("OffscreenCanvas is not supported in this environment");
      }

      if (!ctx) throw new Error("Could not get canvas context");

      ctx.clearRect(0, 0, dim, dim);

      const grad = ctx.createLinearGradient(0, 0, dim, dim);
      grad.addColorStop(0, `hsl(${Math.random() * 360},80%,70%)`);
      grad.addColorStop(1, `hsl(${Math.random() * 360},80%,60%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, dim, dim);

      const circleCount = Math.min(50, 20 + Math.floor(Math.random() * 20));
      for (let i = 0; i < circleCount; i++) {
        ctx.beginPath();
        ctx.arc(
          Math.random() * dim,
          Math.random() * dim,
          (Math.random() * dim) / 6 + 10,
          0,
          2 * Math.PI
        );
        ctx.globalAlpha = 0.3 + Math.random() * 0.5;
        ctx.fillStyle = `hsl(${Math.random() * 360},80%,${50 + Math.random() * 30}%)`;
        ctx.fill();
      }

      //   GENERATE WITH MAYTOOLS
      ctx.globalAlpha = 1;
      ctx.font = `${Math.max(12, Math.floor(dim / 12))}px sans-serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "rgba(30,0,60,0.5)";
      ctx.fillText("generated with Manytools", dim - 8, dim - 8);

      blob = await canvas.convertToBlob({ type: "image/png", quality });

      if (blob && blob.size > 0) {
        const targetSize = size;
        const sizeDiff = Math.abs(blob.size - targetSize);
        const tolerance = targetSize * 0.1; // 10% tolerance

        if (sizeDiff <= tolerance) {
          break; // Size is acceptable
        } else if (blob.size < targetSize) {
          dim = Math.min(maxDimension, Math.ceil(dim * 1.1));
          quality = Math.min(1, quality + 0.02);
        } else {
          dim = Math.max(64, Math.floor(dim * 0.9));
          quality = Math.max(0.5, quality - 0.02);
        }
      } else {
        throw new Error("Failed to create blob");
      }
    } catch (canvasError) {
      dim = Math.max(64, Math.floor(dim * 0.8));
      quality = Math.max(0.5, quality - 0.05);
    }

    attempts++;
  }

  if (blob && blob.size > 0) {
    self.postMessage({
      id,
      type: "randomImage",
      success: true,
      result: blob,
    } satisfies WorkerResponse);
  } else {
    throw new Error(
      "Failed to generate image of requested size after multiple attempts"
    );
  }
}

async function handleImageCompression(
  id: string,
  payload: { imageData: ImageData; quality: number }
) {
  self.postMessage({
    id,
    type: "imageCompression",
    success: true,
    result: payload.imageData,
  } satisfies WorkerResponse);
}
