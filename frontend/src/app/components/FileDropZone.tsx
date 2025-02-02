'use client';

import React from 'react';
import { useDropzone } from 'react-dropzone';

interface FileDropzoneProps {
  onDrop: (acceptedFiles: File[]) => void;
}

export default function FileDropzone({ onDrop }: FileDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition mb-6
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
    >
      <input {...getInputProps()} />
      <p className="text-gray-600">
        {isDragActive
          ? 'Drop the CSV file here'
          : 'Drag & drop a CSV file here, or click to select'}
      </p>
    </div>
  );
}
