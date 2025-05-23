import React, { useState, useRef, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { createFileRoute } from "@tanstack/react-router";
import ContentLayout from "@/components/shared/content-layout";
import {
  generateImageFile,
  generateJsonFile,
  generateRandomData,
  generateTextFile,
  generateZipFile,
} from "@/utils/random-file-creator/generate-content";

export const Route = createFileRoute("/tools/random-file-creator")({
  component: RouteComponent,
});

const FILE_TYPES = [
  { value: "application/octet-stream", label: "Binary (BIN)", ext: "bin" },
  { value: "text/plain", label: "Text (TXT)", ext: "txt" },
  { value: "application/json", label: "JSON", ext: "json" },
  { value: "application/zip", label: "ZIP Archive", ext: "zip" },
  { value: "image/jpeg", label: "JPEG Image", ext: "jpg" },
  { value: "image/png", label: "PNG Image", ext: "png" },
];

export default function RouteComponent() {
  const [fileSize, setFileSize] = useState(1024);
  const [fileName, setFileName] = useState("random-file");
  const [fileType, setFileType] = useState("application/octet-stream");
  const [sizeUnit, setSizeUnit] = useState("KB");

  const getSizeInBytes = () => {
    const units = {
      B: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
    };

    type KEY = keyof typeof units;

    return fileSize * units[sizeUnit as KEY];
  };

  const canvasRef = useRef<HTMLCanvasElement>(null!);

  const generateRealisticContent = async (
    sizeInBytes: number
  ): Promise<Blob> => {
    const type = fileType;
    switch (type) {
      case "text/plain":
        return generateTextFile(sizeInBytes);
      case "application/json":
        return generateJsonFile(sizeInBytes);
      case "application/zip":
        return generateZipFile(sizeInBytes);
      case "image/jpeg":
      case "image/png":
        return generateImageFile(sizeInBytes, type, canvasRef.current);
      default:
        return new Blob([generateRandomData(sizeInBytes)], { type });
    }
  };

  const createAndDownloadFile = async () => {
    const sizeInBytes = getSizeInBytes();
    if (sizeInBytes > 100 * 1024 * 1024) {
      if (
        !window.confirm(
          "Creating large files may freeze your browser. Continue?"
        )
      ) {
        return;
      }
    }

    try {
      const blob = await generateRealisticContent(sizeInBytes);

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.${getFileExtension(fileType)}`;
      document.body.appendChild(link);
      link.click();

      URL.revokeObjectURL(link.href);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating file:", error);
      alert("Failed to generate file. Please try again with a smaller size.");
    }
  };

  const getFileExtension = (mimeType: string) => {
    const extensions: { [key: string]: string } = {
      "application/octet-stream": "bin",
      "text/plain": "txt",
      "application/json": "json",
      "application/zip": "zip",
      "image/jpeg": "jpg",
    };

    return extensions[mimeType] || "bin";
  };

  const getSliderMax = (): number => {
    switch (sizeUnit) {
      case "B":
        return 1024 * 8; // 8 KB in bytes
      case "KB":
        return 1024; // 1 MB in KB
      case "MB":
        return 100; // 100 MB
      case "GB":
        return 1; // 1 GB (risky in browser)
      default:
        return 1024;
    }
  };

  useEffect(() => {
  const max = getSliderMax();
    if (fileSize > max) {
      setFileSize(Math.floor(max / 2));
    }
  }, [sizeUnit]);


  const getFileContentDescription = (): string => {
    switch (fileType) {
      case "text/plain":
        return "Lorem ipsum text content";
      case "application/json":
        return "Structured JSON data with random values";
      case "application/zip":
        return "ZIP archive structure with placeholder content";
      case "image/jpeg":
      case "image/png":
        return "Colorful image with random shapes and gradients";
      default:
        return "Random binary data";
    }
  };

  return (
    <ContentLayout title="Random File Creator">
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-sm">
            This tool creates files with actual content specific to each file
            type. Unlike generic random data generators, files will have proper
            structure: images will be viewable, text files will have readable
            content, etc.
          </p>
        </div>

        <div>
          <label className="block mb-2">File Name</label>
          <Input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Enter file name"
          />
        </div>

        <div>
          <label className="block mb-2">
            File Size: {fileSize} {sizeUnit}
          </label>
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1">
              <input
                type="range"
                min={1}
                max={getSliderMax()}
                value={fileSize}
                onChange={(e) => setFileSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <select
              className="border rounded px-3 py-2"
              value={sizeUnit}
              onChange={(e) => {
                setSizeUnit(e.target.value);
              }}
            >
              <option value="B">Bytes</option>
              <option value="KB">KB</option>
              <option value="MB">MB</option>
              <option value="GB">GB</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block mb-2">File Type</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
          >
            {FILE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-600 mt-1">
            Content: {getFileContentDescription()}
          </p>
        </div>

        <Button onClick={createAndDownloadFile} className="w-full">
          Generate & Download File
        </Button>

        <div className="text-sm mt-4 p-4 bg-gray-100 rounded">
          <p>
            Files will have realistic content based on the type you select. Size
            is approximate and may vary slightly due to format constraints.
          </p>
          <p className="mt-2 text-amber-600">
            Note: Creating very large files may consume significant memory and
            could temporarily freeze your browser.
          </p>
        </div>
      </div>

      {/* Hidden canvas for image generation */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </ContentLayout>
  );
}
