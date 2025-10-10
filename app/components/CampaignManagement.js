"use client";

import { useState, useRef, useEffect } from "react";
import { uploadAsset } from "../content/upload_library";
import { updateSequence } from "../campaign/update_sequence";
import signage_form from "../make_data/signage_form";
import seq_id_data from "../make_data/seq_id";

// Constants
const ENTERPRISE = "A";
const DEFAULT_SEQ_CONDITION = 'displayAspectRatio == "1920x1080"';
const DEFAULT_SEQ_ID = "133DA4F113E159";
const DEFAULT_SEQ_SLOT = "1";
const DEFAULT_SEQ_ITEM = "1";
const DEFAULT_SEQ_DURATION = "15000";

// ฟังก์ชันแปลง datetime-local เป็น UnixTime UTC (ลบ 7 ชมสำหรับไทย timezone)
function convertToUnixTime(dateTimeString) {
  if (!dateTimeString) return null;
  const date = new Date(dateTimeString);
  const utcTime = date.getTime();
  return utcTime.toString();
}

export default function CombinedPage() {
  // Content Upload States
  const [contentFile, setContentFile] = useState(null);
  const [isContentDragOver, setIsContentDragOver] = useState(false);
  const [isContentUploading, setIsContentUploading] = useState(false);
  const [contentMessage, setContentMessage] = useState("");
  const [contentMessageType, setContentMessageType] = useState("");
  const contentFileInputRef = useRef(null);

  // Campaign States
  const [seq_condition, setseq_condition] = useState(DEFAULT_SEQ_CONDITION);
  const [seq_id, setseq_id] = useState(DEFAULT_SEQ_ID);
  const [seq_slot, setseq_slot] = useState(DEFAULT_SEQ_SLOT);
  const [seq_item, setseq_item] = useState(DEFAULT_SEQ_ITEM);
  const [seq_startdate, setseq_startdate] = useState("");
  const [seq_enddate, setseq_enddate] = useState("");
  const [seq_duration, setseq_duration] = useState(DEFAULT_SEQ_DURATION);
  const [seq_label, setseq_label] = useState("");

  // Format date to yyyy-MM-ddTHH:mm for input[type="datetime-local"]
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const pad = (num) => num.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Set default start date to 00:00 AM of current day when component mounts
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setseq_startdate(formatDateForInput(today));
  }, []);

  // Content Upload Handlers
  const handleContentDragOver = (e) => {
    e.preventDefault();
    setIsContentDragOver(true);
  };

  const handleContentDragLeave = (e) => {
    e.preventDefault();
    setIsContentDragOver(false);
  };

  const handleContentDrop = (e) => {
    e.preventDefault();
    setIsContentDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setContentFile(droppedFiles[0]);
    }
  };

  const handleContentFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setContentFile(selectedFiles[0]);
    }
  };

  const handleContentSubmit = async (e) => {
    e.preventDefault();

    if (!contentFile) {
      setContentMessage("Please select file");
      setContentMessageType("error");
      return;
    }

    setIsContentUploading(true);
    setContentMessage("");

    try {
      const formData = new FormData();
      const fileNameWithEnterprise = `ENTERPRISE ${ENTERPRISE} - ${contentFile.name}`;
      formData.append("label", fileNameWithEnterprise);
      formData.append("file", contentFile);

      const result = await uploadAsset(formData);

      if (result.success) {
        setContentMessage(result.message);
        setContentMessageType("success");
        localStorage.setItem("lastLibraryId", result.data.id);
        localStorage.setItem("lastContentName", contentFile.name);

        try {
          const existingMap = JSON.parse(
            localStorage.getItem("contentNameToIdMap") || "{}"
          );
          existingMap[contentFile.name] = result.data.id;
          localStorage.setItem(
            "contentNameToIdMap",
            JSON.stringify(existingMap)
          );
        } catch (err) {
          localStorage.setItem(
            "contentNameToIdMap",
            JSON.stringify({ [contentFile.name]: result.data.id })
          );
        }
        await triggerAutoCampaignUpdate(result.data.id, contentFile.name);
        setContentFile(null);
      } else {
        setContentMessage(result.error);
        setContentMessageType("error");
      }
    } catch (error) {
      setContentMessage("Error uploading file");
      setContentMessageType("error");
    } finally {
      setIsContentUploading(false);
    }
  };

  // ฟังก์ชัน trigger อัปเดตแคมเปญอัตโนมัติหลัง upload สำเร็จ
  const triggerAutoCampaignUpdate = async (libraryId, contentName) => {
    try {
      const formData = new FormData();
      formData.append("libraryId", libraryId);
      formData.append(
        "seq_startdate",
        convertToUnixTime(seq_startdate || new Date())
      );
      formData.append("seq_enddate", convertToUnixTime(seq_enddate || ""));
      formData.append("seq_duration", seq_duration);
      formData.append("seq_slot", seq_slot);
      formData.append("seq_item", seq_item);
      formData.append("seq_label", seq_label);
      formData.append("seq_condition", seq_condition);
      formData.append("seq_id", seq_id);

      const result = await updateSequence(formData);
    } catch (error) {
      // Error auto-updating campaign
    }
  };

  return (
    <div className="h-full w-full bg-white flex flex-col pt-2">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2">
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Campaigns
          </h2>
          <form className="space-y-3 flex-1">
            <div>
              <label
                htmlFor="campaign-content-name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Campaign Name *
              </label>
              <input
                type="text"
                id="campaign-content-name"
                name="contentName"
                value={seq_label}
                onChange={(e) => setseq_label(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter Campaign Name "
                disabled={false}
              />
            </div>
            <div>
              <label
                htmlFor="signage-form"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Format *
              </label>
              <select
                id="signage-form"
                value={seq_condition}
                onChange={(e) => setseq_condition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={false}
              >
                {Object.keys(signage_form).map((option) => (
                  <option key={option} value={signage_form[option]}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spot *
              </label>
              <div className="flex flex-wrap gap-4">
                {Object.keys(seq_id_data).map((option) => (
                  <label
                    key={option}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="signage-form"
                      value={seq_id_data[option]}
                      checked={seq_id === seq_id_data[option]}
                      onChange={(e) => setseq_id(e.target.value)}
                      disabled={false}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label
                htmlFor="campaign-start-date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Start Date (Optional)
              </label>
              <input
                type="datetime-local"
                id="startDateTime"
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                value={
                  seq_startdate ? seq_startdate : formatDateForInput(new Date())
                }
                min={formatDateForInput(
                  new Date(new Date().setHours(0, 0, 0, 0))
                )}
                onChange={(e) => setseq_startdate(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="campaign-end-date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                End Date (Optional)
              </label>
              <input
                type="datetime-local"
                id="endDateTime"
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                value={seq_enddate}
                min={
                  seq_startdate ? seq_startdate : formatDateForInput(new Date())
                }
                onChange={(e) => setseq_enddate(e.target.value)}
              />
            </div>
          </form>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Add Content
          </h2>

          <form
            id="uploadForm"
            onSubmit={handleContentSubmit}
            className="space-y-4 flex-1 flex flex-col"
          >
            <div>
              <label
                htmlFor="content-file"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                File *
              </label>

              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors flex-1 flex items-center justify-center ${
                  isContentDragOver
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                } ${
                  isContentUploading
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                onDragOver={handleContentDragOver}
                onDragLeave={handleContentDragLeave}
                onDrop={handleContentDrop}
                onClick={() =>
                  !isContentUploading && contentFileInputRef.current?.click()
                }
              >
                {contentFile ? (
                  <div className="space-y-2">
                    <div className="text-green-600 font-medium">
                      ✓ {contentFile.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(contentFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-gray-500">
                      Drag file here or click to select file
                    </div>
                    <div className="text-sm text-gray-400">
                      Supports only .mp4 / .jpg / .png files and Name English
                      only
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={contentFileInputRef}
                type="file"
                id="content-file"
                name="file"
                onChange={handleContentFileSelect}
                className="hidden"
                disabled={isContentUploading}
              />
            </div>
          </form>
        </div>
      </div>
      {contentMessage && (
        <div
          className={`mt-2 p-2 rounded-md ${
            contentMessageType === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {contentMessage}
        </div>
      )}
      <div className="mt-2">
        <button
          type="submit"
          form="uploadForm"
          disabled={isContentUploading || !contentFile}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md 
             hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
             focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed 
             transition-colors"
        >
          {isContentUploading ? "Uploading..." : "Upload Content"}
        </button>
      </div>

      {/* Padding bottom เพื่อให้เนื้อหาไม่ชิดขอบล่างเมื่อเลื่อน scrollbar */}
      <div className="pb-2"></div>
    </div>
  );
}
