"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";

export default function FileUpload() {
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setProcessing(true);
    setCompleted(false);

    // Simulate processing delay
    const processTimeout = setTimeout(() => {
      setCompleted(true);
    }, 3000); // Simulate a 3-second processing time

    // Hide the processing card after success
    const hideTimeout = setTimeout(() => {
      setProcessing(false);
      setCompleted(false);
    }, 5000); // Hide after 5 seconds

    setTimeoutId(hideTimeout);
  };

  // Drag and Drop handler
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
      {/* Hide upload UI when file is processed */}
      {!completed ? (
        <>
          {/* Drag & Drop Area */}
          <div
            {...getRootProps()}
            className={`w-96 h-32 flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition ${
              isDragActive ? "border-blue-500 bg-blue-100" : "border-gray-300 bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-gray-600">
              {isDragActive ? "Drop the file here..." : "Drag & Drop a CSV file or click to select"}
            </p>
          </div>

          {/* Traditional File Selection */}
          <label className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition cursor-pointer">
            Select File
            <input type="file" className="hidden" onChange={handleFileSelect} />
          </label>
        </>
      ) : (
        // Success Message After Processing
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 100 }}
          className="bg-green-100 text-green-700 p-4 rounded-lg shadow-lg"
        >
          <p className="text-lg font-semibold">🎉 {selectedFile?.name} was successfully uploaded!</p>
        </motion.div>
      )}

      {/* Processing Card */}
      {processing && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 transform -translate-x-1/2 bg-white shadow-lg rounded-lg p-4 w-80 flex flex-col items-center"
        >
          {completed ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="text-green-500 text-4xl">✔</div>
              <p className="text-lg font-semibold text-gray-700 mt-2">
                {selectedFile?.name} ({((selectedFile?.size ?? 0) / 1024).toFixed(2)} KB) Processed!
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
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
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
