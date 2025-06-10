import { useWorker } from "@/context/worker-provider";
import { downloadBlob } from "@/utils/random-file-utils";

export interface FileGenerationOptions {
  onProgress?: (progress: { done: number; total: number }) => void;
  showWarnings?: boolean;
}

export function useFileGenerator() {
  const {
    executeTask,
    getActiveWorkerCount,
    getMaxWorkerCount,
    setMaxWorkerCount,
    getQueueSize,
  } = useWorker();

  const generateTextFile = async (
    size: number,
    filename?: string,
    options: FileGenerationOptions = {}
  ): Promise<Blob> => {
    const { onProgress, showWarnings = true } = options;

    if (showWarnings && size > 1024 * 1024 * 1024 * 2) {
      const confirmed = confirm(
        `This will generate a large file (${(size / (1024 * 1024 * 1024)).toFixed(1)}GB). Continue?`
      );
      if (!confirmed) {
        throw new Error("Generation cancelled by user");
      }
    }

    if (size > 1024 * 1024 * 50 && onProgress) {
      const chunkSize = 1024 * 1024 * 50;
      const totalChunks = Math.ceil(size / chunkSize);
      let completedChunks = 0;
      const chunks: Blob[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const currentChunkSize = Math.min(chunkSize, size - i * chunkSize);

        const chunk = await executeTask(
          "randomText",
          { size: currentChunkSize },
          (progress) => {
            if (onProgress) {
              onProgress({
                done: progress.done + completedChunks * chunkSize,
                total: size,
              });
            }
          }
        );

        chunks.push(chunk);
        completedChunks++;

        // Update progress after chunk completion
        if (onProgress) {
          onProgress({
            done: completedChunks * chunkSize,
            total: size,
          });
        }
      }

      const combinedBlob = new Blob(chunks);
      if (filename) {
        downloadBlob(combinedBlob, filename);
      }
      return combinedBlob;
    } else {
      const blob = await executeTask("randomText", { size }, onProgress);

      if (filename) {
        downloadBlob(blob, filename);
      }

      return blob;
    }
  };

  const generateImageFile = async (
    size: number,
    filename?: string,
    options: FileGenerationOptions = {}
  ): Promise<Blob> => {
    const { showWarnings = true } = options;

    if (showWarnings && size > 1024 * 1024 * 500) {
      const confirmed = confirm(
        `Large image files may take significant time to generate. Continue?`
      );
      if (!confirmed) {
        throw new Error("Generation cancelled by user");
      }
    }

    const blob = await executeTask("randomImage", { size });

    if (filename) {
      downloadBlob(blob, filename);
    }

    return blob;
  };

  const compressImage = async (
    imageData: ImageData,
    quality: number = 0.8
  ): Promise<Blob> => {
    return await executeTask("imageCompression", { imageData, quality });
  };

  return {
    generateTextFile,
    generateImageFile,
    compressImage,
    getActiveWorkerCount,
    getMaxWorkerCount,
    setMaxWorkerCount,
    getQueueSize,
    executeTask,
  };
}

export const FileSizes = {
  KB: (kb: number) => kb * 1024,
  MB: (mb: number) => mb * 1024 * 1024,
  GB: (gb: number) => gb * 1024 * 1024 * 1024,
} as const;

export type FileSizeUnit = "B" | "KB" | "MB" | "GB";

export function convertToBytes(value: number, unit: FileSizeUnit): number {
  switch (unit) {
    case "KB":
      return FileSizes.KB(value);
    case "MB":
      return FileSizes.MB(value);
    case "GB":
      return FileSizes.GB(value);
    default:
      return value;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
