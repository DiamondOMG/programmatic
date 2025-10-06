"use client";

import { useState, useRef, useEffect } from "react";
import { uploadAsset } from "./upload_library";

export default function UploadPage() {
  const [label, setLabel] = useState("");
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'
  const [libraryId, setLibraryId] = useState("");
  const fileInputRef = useRef(null);

  // Load library ID from localStorage on component mount
  useEffect(() => {
    const savedLibraryId = localStorage.getItem("lastLibraryId");
    if (savedLibraryId) {
      setLibraryId(savedLibraryId);
    }
  }, []);

  // Clear library ID from localStorage
  const clearLibraryId = () => {
    localStorage.removeItem("lastLibraryId");
    setLibraryId("");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setFile(droppedFiles[0]);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!label || !file) {
      setMessage("Please fill in label and select file");
      setMessageType("error");
      return;
    }

    setIsUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("label", label);
      formData.append("file", file);

      const result = await uploadAsset(formData);

      if (result.success) {
        setMessage(result.message);
        setMessageType("success");
        setLibraryId(result.data.id);
        // Save to localStorage
        localStorage.setItem("lastLibraryId", result.data.id);
        setLabel("");
        setFile(null);
      } else {
        setMessage(result.error);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Error uploading file");
      setMessageType("error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Upload Content
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label Input */}
          <div>
            <label
              htmlFor="upload-label"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Label *
            </label>
            <input
              type="text"
              id="upload-label"
              name="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter label for asset"
              disabled={isUploading}
            />
          </div>

          {/* File Upload Area */}
          <div>
            <label
              htmlFor="upload-file"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              File *
            </label>

            {/* Drag & Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              } ${
                isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              {file ? (
                <div className="space-y-2">
                  <div className="text-green-600 font-medium">
                    ✓ {file.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-gray-500">
                    Drag file here or click to select file
                  </div>
                  <div className="text-sm text-gray-400">
                    Supports all file types
                  </div>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              id="upload-file"
              name="file"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUploading || !label || !file}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </form>

        {/* Status Message */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-md ${
              messageType === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* Library ID Display */}
        {libraryId && (
          <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-blue-800">Last Upload</h3>
              <button
                onClick={clearLibraryId}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
              >
                Clear
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1">
                Library ID
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={libraryId}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-white border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(libraryId)}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
