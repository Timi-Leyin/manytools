import ContentLayout from "@/components/shared/content-layout";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  useFileGenerator,
  convertToBytes,
  formatFileSize,
  type FileSizeUnit,
} from "@/hooks/use-file-generator";
import { SHOW_LOGS } from "@/constant";

export const Route = createFileRoute("/(tools)/random-file-size")({
  component: RouteComponent,
});

function RouteComponent() {
  const [fileType, setFileType] = useState<"text" | "image">("text");
  const [unit, setUnit] = useState<FileSizeUnit>("KB");
  const [sliderValue, setSliderValue] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  const { 
    generateTextFile, 
    generateImageFile, 
    getActiveWorkerCount,
    getMaxWorkerCount,
    setMaxWorkerCount,
    getQueueSize
  } = useFileGenerator();

  const size = convertToBytes(sliderValue, unit);

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress(null);
    try {
      const filename = `random-${fileType}-${formatFileSize(size).replace(/\s/g, "")}.${fileType === "text" ? "txt" : "jpg"}`;
      if (fileType === "text") {
        await generateTextFile(size, filename, {
          onProgress: size > 1024 * 1024 * 50 ? setProgress : undefined,
        });
      } else {
        await generateImageFile(size, filename, {
          onProgress: setProgress,
        });
      }
    } catch (error) {
      if (SHOW_LOGS) {
        console.error("Generation failed:", error);
      }
      if (
        error instanceof Error &&
        error.message !== "Generation cancelled by user"
      ) {
        alert(`Failed to generate file: ${error.message}`);
      }
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  };

  const sliderConfig = {
    B: { min: 1, max: 1024, step: 1, label: "Bytes" },
    KB: { min: 1, max: 10240, step: 1, label: "KB" },
    MB: { min: 1, max: 100, step: 1, label: "MB" },
    GB: { min: 1, max: 10, step: 1, label: "GB" },
  };
  const { min, max, step, label } = sliderConfig[unit];

  const activeWorkers = getActiveWorkerCount();

  return (
    <ContentLayout title="Random File Size Generator">
      <div className="max-w-xl mx-auto flex flex-col gap-6 bg-background text-foreground border border-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex gap-4 items-center">
          <label className="font-medium text-gray-200">File type:</label>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value as any)}
            className="border border-gray-700 rounded px-2 py-1 bg-gray-900 text-gray-100 focus:outline-none"
          >
            <option value="text">Text</option>
            <option value="image">Image (JPG)</option>
          </select>
        </div>
        <div className="flex gap-4 items-center">
          <label className="font-medium text-gray-200">File size:</label>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="w-40 accent-gray-600"
          />
          <select
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value as FileSizeUnit);
              setSliderValue(1);
            }}
            className="border border-gray-700 rounded px-2 py-1 bg-gray-900 text-gray-100 focus:outline-none"
          >
            <option value="B">Bytes</option>
            <option value="KB">KB</option>
            <option value="MB">MB</option>
            <option value="GB">GB</option>
          </select>
          <span className="ml-2 font-mono text-gray-400">
            {sliderValue} {label} ({formatFileSize(size)})
          </span>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-gray-900 text-white border border-gray-700 hover:bg-gray-800 hover:text-gray-100"
        >
          {generating ? "Generating..." : "Generate & Download"}
        </Button>
        {progress && (
          <div className="text-xs text-gray-200 bg-gray-900 border border-gray-700 rounded p-2">
            <div>
              Progress: {formatFileSize(progress.done)} / {formatFileSize(progress.total)}
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 mt-1">
              <div
                className="bg-gray-400 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round((progress.done / progress.total) * 100)}%`,
                }}
              ></div>
            </div>
            <div className="text-center mt-1 text-gray-400">
              {Math.round((progress.done / progress.total) * 100)}%
            </div>
          </div>
        )}
        <div className="text-xs text-gray-500">
          Generated files will have exact byte sizes. Image file size is approximate due to JPG compression.
        </div>
      </div>
    </ContentLayout>
  );
}
