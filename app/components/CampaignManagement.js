"use client";

import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadAsset } from "../content/upload_library_client";
import { updateSequence } from "../campaign/update_sequence";
import signage_form_2 from "../make_data/signage_form_2";
import seq_table from "../make_data/seq_table";
import { sequence_supabase } from "../campaigns/get_sequence";
import { v4 as uuidv4 } from "uuid";

// Constants
const ENTERPRISE = "A";
const DEFAULT_SEQ_CONDITION = 'displayAspectRatio == "1920x1080"';
const DEFAULT_SEQ_ID = "133DA4F113E159";
const DEFAULT_SEQ_SLOT = "1";
const DEFAULT_SEQ_ITEM = "1";
const DEFAULT_SEQ_DURATION = "15000";

// ฟังก์ชันแปลง date เป็น UnixTime UTC
// สำหรับ startdate: บวก 5 นาที (00:05)
// สำหรับ enddate: บวก 23 ชม 55 นาที (23:55)
function convertToUnixTime(dateString, isEndDate = false) {
  if (!dateString) return null;
  const date = new Date(dateString);

  if (isEndDate) {
    // End date: ตั้งเวลาเป็น 23:55
    date.setHours(23, 55, 0, 0);
  } else {
    // Start date: ตั้งเวลาเป็น 00:05
    date.setHours(0, 5, 0, 0);
  }

  const utcTime = date.getTime();
  return utcTime.toString();
}

export default function CombinedPage() {
  const queryClient = useQueryClient();

  // Content Upload States
  const [contentFile, setContentFile] = useState(null);
  const [isContentDragOver, setIsContentDragOver] = useState(false);
  const [isContentUploading, setIsContentUploading] = useState(false);
  const [contentMessage, setContentMessage] = useState("");
  const [contentMessageType, setContentMessageType] = useState("");
  const contentFileInputRef = useRef(null);

  // Campaign States
  const [seq_form, setseq_form] = useState("TV Signage 43");
  const [seq_condition, setseq_condition] = useState(DEFAULT_SEQ_CONDITION);
  const [seq_id, setseq_id] = useState(DEFAULT_SEQ_ID);
  const [seq_slot, setseq_slot] = useState(DEFAULT_SEQ_SLOT);
  const [seq_item, setseq_item] = useState(DEFAULT_SEQ_ITEM);
  const [seq_startdate, setseq_startdate] = useState("");
  const [seq_enddate, setseq_enddate] = useState("");
  const [seq_duration, setseq_duration] = useState(DEFAULT_SEQ_DURATION);
  const [seq_label, setseq_label] = useState("");
  const [seq_table_data, setSeqTableData] = useState([]);
  const [fileDimensions, setFileDimensions] = useState(null);
  const [isDimensionValid, setIsDimensionValid] = useState(null);

  const validateDimensions = (formKey, dims) => {
    if (!formKey || !dims) {
      setIsDimensionValid(null);
      return;
    }
    const spec = signage_form_2[formKey];
    if (!spec) {
      setIsDimensionValid(null);
      return;
    }
    const ok = dims.width === spec.width && dims.height === spec.height;
    setIsDimensionValid(ok);
    if (!ok) {
      setContentMessage(
        `Invalid dimensions. Expected ${spec.width}x${spec.height}px, got ${dims.width}x${dims.height}px`
      );
      setContentMessageType("error");
    } else {
      setContentMessage("");
      setContentMessageType("");
    }
  };

  // Format date to yyyy-MM-dd for input[type="date"]
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const pad = (num) => num.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  // Set default start date to current day when component mounts
  useEffect(() => {
    const today = new Date();
    setseq_startdate(formatDateForInput(today));
    const fetchSequenceData = async () => {
      const result = await sequence_supabase();
      setSeqTableData(result);
    };
    fetchSequenceData();
  }, []);

  const getFileDimensions = (file) => {
    return new Promise((resolve, reject) => {
      const type = file.type;

      // ถ้าเป็นวิดีโอ
      if (type.startsWith("video/")) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          resolve({ width: video.videoWidth, height: video.videoHeight });
          URL.revokeObjectURL(video.src);
        };
        video.onerror = reject;
        video.src = URL.createObjectURL(file);
      }
      // ถ้าเป็นภาพ
      else if (type.startsWith("image/")) {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
          URL.revokeObjectURL(img.src);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      } else {
        resolve(null);
      }
    });
  };

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
      const file = droppedFiles[0];
      setContentFile(file);
      getFileDimensions(file)
        .then((dims) => {
          setFileDimensions(dims);
          validateDimensions(seq_form, dims);
        })
        .catch(() => {
          setFileDimensions(null);
          setIsDimensionValid(null);
        });
    }
  };

  const handleContentFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      const file = selectedFiles[0];
      setContentFile(file);

      try {
        const dims = await getFileDimensions(file);
        setFileDimensions(dims);
        validateDimensions(seq_form, dims);
      } catch (err) {
        setFileDimensions(null);
        setIsDimensionValid(null);
      }
    }
  };

  const handleContentSubmit = async (e) => {
    e.preventDefault();

    if (!contentFile) {
      setContentMessage("Please select file");
      setContentMessageType("error");
      return;
    }

    if (isDimensionValid === false) {
      setContentMessage("Cannot upload: file dimensions do not match the selected format.");
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
      formData.append("campaign_name", seq_label);

      const result = await uploadAsset(formData, seq_id);

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
      const programmaticId = uuidv4();
      const formData = new FormData();
      formData.append("libraryId", libraryId);
      formData.append(
        "seq_startdate",
        convertToUnixTime(seq_startdate || new Date(), false)
      );
      formData.append(
        "seq_enddate",
        convertToUnixTime(seq_enddate || "", true)
      );
      formData.append("seq_duration", seq_duration);
      formData.append("seq_slot", seq_slot);
      formData.append("seq_item", seq_item);
      formData.append("seq_label", seq_label);
      formData.append("seq_form", seq_form);
      formData.append("seq_condition", seq_condition);
      formData.append("seq_id", seq_id);
      formData.append("programmaticId", programmaticId);

      await updateSequence(formData);

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries(["campaigns"]);
      setContentMessage("Campaign updated successfully");
      setContentMessageType("success");
    } catch (error) {
      setContentMessage(error.message || "Error updating campaign");
      setContentMessageType("error");
      throw error;
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
                value={seq_form}
                onChange={(e) => {
                  const selectedForm = e.target.value;
                  setseq_form(selectedForm);
                  const sel = signage_form_2[selectedForm];
                  setseq_condition(sel ? sel.condition : DEFAULT_SEQ_CONDITION);
                  if (fileDimensions) {
                    validateDimensions(selectedForm, fileDimensions);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={false}
              >
                {Object.keys(signage_form_2).map((option) => (
                  <option key={option} value={option}>
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
                {seq_table_data
                  .sort((a, b) => a.seq_name.localeCompare(b.seq_name))
                  .map((item) => (
                    <label
                      key={item.seq_name}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="signage-form"
                        value={item.seq_id}
                        checked={seq_id === item.seq_id}
                        onChange={(e) => setseq_id(e.target.value)}
                        disabled={false}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{item.seq_name}</span>
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
                type="date"
                id="startDate"
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                value={
                  seq_startdate ? seq_startdate : formatDateForInput(new Date())
                }
                min={formatDateForInput(new Date())}
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
                type="date"
                id="endDate"
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
                    {fileDimensions && (
                      <div className="text-sm text-gray-500">
                        {fileDimensions.width} x {fileDimensions.height}px
                      </div>
                    )}
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
          disabled={isContentUploading || !contentFile || isDimensionValid === false}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md 
             hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
             focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed 
             transition-colors"
        >
          {isContentUploading ? "Uploading..." : "Upload Content"}
        </button>
      </div>

      <div className="pb-2"></div>
    </div>
  );
}
