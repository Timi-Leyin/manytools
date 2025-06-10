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
      const filename = `random-${fileType}-${formatFileSize(size).replace(/\s/g, "")}.${fileType === "text" ? "txt" : "png"}`;

      if (fileType === "text") {
        await generateTextFile(size, filename, {
          onProgress: size > 1024 * 1024 * 50 ? setProgress : undefined, // Show progress for files >50MB
        });
      } else {
        await generateImageFile(size, filename);
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
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <div className="flex gap-4 items-center">
          <label className="font-medium">File type:</label>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value as any)}
            className="border rounded px-2 py-1"
          >
            <option value="text">Text</option>
            <option value="image">Image (PNG)</option>
          </select>
        </div>
        <div className="flex gap-4 items-center">
          <label className="font-medium">File size:</label>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="w-40"
          />
          <select
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value as FileSizeUnit);
              setSliderValue(1);
            }}
            className="border rounded px-2 py-1"
          >
            <option value="B">Bytes</option>
            <option value="KB">KB</option>
            <option value="MB">MB</option>
            <option value="GB">GB</option>
          </select>
          <span className="ml-2 font-mono">
            {sliderValue} {label} ({formatFileSize(size)})
          </span>
        </div>
        
        {/* Worker Management Section */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium mb-3">Worker Management</h3>
          <div className="space-y-3">
            <div className="flex gap-4 items-center">
              <label className="font-medium">Max Concurrent Workers:</label>
              <input
                type="range"
                min="1"
                max={navigator.hardwareConcurrency || 4}
                value={getMaxWorkerCount()}
                onChange={(e) => setMaxWorkerCount(Number(e.target.value))}
                className="w-32"
              />
              <span className="font-mono">{getMaxWorkerCount()}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col items-center p-2 bg-white rounded border">
                <span className="font-medium">Active Workers</span>
                <span className="text-lg font-mono text-blue-600">{getActiveWorkerCount()}</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-white rounded border">
                <span className="font-medium">Queue Size</span>
                <span className="text-lg font-mono text-orange-600">{getQueueSize()}</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-white rounded border">
                <span className="font-medium">Max Workers</span>
                <span className="text-lg font-mono text-green-600">{getMaxWorkerCount()}</span>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full"
        >
          {generating ? "Generating..." : "Generate & Download"}
        </Button>

        {/* Progress Display */}
        {progress && (
          <div className="text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded p-2">
            <div>
              Progress: {formatFileSize(progress.done)} /{" "}
              {formatFileSize(progress.total)}
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2 mt-1">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round((progress.done / progress.total) * 100)}%`,
                }}
              ></div>
            </div>
            <div className="text-center mt-1">
              {Math.round((progress.done / progress.total) * 100)}%
            </div>
          </div>
        )}

        {/* Worker Status Display */}
        {(generating || getActiveWorkerCount() > 0 || getQueueSize() > 0) && (
          <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-2">
            <div className="font-medium mb-1">Worker Status:</div>
            <div className="grid grid-cols-1 gap-1">
              {getActiveWorkerCount() > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span>{getActiveWorkerCount()} worker(s) active</span>
                </div>
              )}
              {getQueueSize() > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>{getQueueSize()} task(s) in queue</span>
                </div>
              )}
              {!generating && getActiveWorkerCount() === 0 && getQueueSize() === 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>All workers idle</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          Generated files will have exact byte sizes. Image file size is
          approximate due to PNG compression.
        </div>
      </div>
    </ContentLayout>
  );
}
