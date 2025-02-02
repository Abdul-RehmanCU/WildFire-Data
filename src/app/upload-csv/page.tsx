"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function FileUpload() {
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter(); // Next.js router for redirection

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setProcessing(true);
    setCompleted(false);

    // Simulate processing delay
    const processTimeout = setTimeout(() => {
      setCompleted(true);

      // Redirect after 2 seconds of success
      const redirectTimeout = setTimeout(() => {
        router.push("/statistics");
      }, 2000);

      setTimeoutId(redirectTimeout);
    }, 3000); // Simulate a 3-second processing time

    setTimeoutId(processTimeout);
  };

  // Drag & Drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] }, // Accept only CSV files
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleCancel = () => {
    if (timeoutId) clearTimeout(timeoutId); // Stop processing timeout
    setProcessing(false);
    setCompleted(false);
    setSelectedFile(null);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={processing ? { scale: 1.1, opacity: 1 } : {}}
        transition={{ duration: 0.3 }}
        className="w-96 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-white shadow-lg space-y-4 p-6"
      >
        {!processing ? (
          <>
            {/* Drag & Drop Area */}
            <div
              {...getRootProps()}
              className={`w-full h-32 flex items-center justify-center rounded-lg transition ${
                isDragActive ? "border-blue-500 bg-blue-100" : "border-gray-300 bg-gray-50"
              }`}
            >
              <input {...getInputProps()} />
              <p className="text-gray-600 text-center">
                {isDragActive ? "Drop the file here..." : "Drag & Drop a CSV file or click to select"}
              </p>
            </div>

            {/* Traditional File Selection */}
            <label className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition cursor-pointer">
              Select File
              <input type="file" className="hidden" onChange={handleFileSelect} />
            </label>
          </>
        ) : (
          // Processing Animation
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center space-y-4"
          >
            {completed ? (
              <>
                <div className="text-green-500 text-4xl">✔</div>
                <p className="text-lg font-semibold text-gray-700 mt-2">
                  {selectedFile?.name} ({((selectedFile?.size ?? 0) / 1024).toFixed(2)} KB) Processed!
                </p>
                <p className="text-sm text-gray-500">Redirecting to Statistics...</p>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
                <p className="text-lg font-semibold text-gray-700 mt-2">
                  Processing {selectedFile?.name} ({((selectedFile?.size ?? 0) / 1024).toFixed(2)} KB)...
                </p>
                <button
                  className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
