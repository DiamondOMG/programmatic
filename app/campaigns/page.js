"use client";

import { useState, useRef, useEffect } from "react";
import { uploadAsset } from "../content/upload_library";
import { updateSequence } from "../campaign/update_sequence";

// ฟังก์ชันแปลง datetime-local เป็น UnixTime UTC (ลบ 7 ชมสำหรับไทย timezone)
function convertToUnixTime(dateTimeString) {
  if (!dateTimeString) return null;

  // สร้าง Date object จาก datetime-local string
  const date = new Date(dateTimeString);

  // ลบ 7 ชมสำหรับไทย timezone เพื่อแปลงเป็น UTC
  const utcTime = date.getTime();

  return utcTime.toString();
}

export default function CombinedPage() {
  // Enterprise and Content States
  const [enterprise] = useState("A");

  // Content Upload States (Left Side)
  const [contentLabel, setContentLabel] = useState("");
  const [contentFile, setContentFile] = useState(null);
  const [isContentDragOver, setIsContentDragOver] = useState(false);
  const [isContentUploading, setIsContentUploading] = useState(false);
  const [contentMessage, setContentMessage] = useState("");
  const [contentMessageType, setContentMessageType] = useState("");
  const [contentLibraryId, setContentLibraryId] = useState("");
  const [lastContentName, setLastContentName] = useState("");
  const contentFileInputRef = useRef(null);
  const [campaignType, setCampaignType] = useState("Landscape");
  const [contentOrder, setContentOrder] = useState("1");
  const [slotOrder, setSlotOrder] = useState("1");

  // Campaign States (Right Side)
  const [campaignContentName, setCampaignContentName] = useState("");
  const [campaignStartDateTime, setCampaignStartDateTime] = useState("");
  const [campaignEndDateTime, setCampaignEndDateTime] = useState("");
  const [campaignDuration, setCampaignDuration] = useState("15000");
  const [isCampaignSubmitting, setIsCampaignSubmitting] = useState(false);
  const [campaignMessage, setCampaignMessage] = useState("");
  const [campaignMessageType, setCampaignMessageType] = useState("");

  const durationOptions = [
    { value: "15000", label: "15s" },
    { value: "30000", label: "30s" },
  ];

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
    // Set to 00:00 AM of current day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCampaignStartDateTime(formatDateForInput(today));

    // Load library ID from localStorage
    const savedLibraryId = localStorage.getItem("lastLibraryId");
    const savedContentName = localStorage.getItem("lastContentName");
    if (savedLibraryId) {
      setContentLibraryId(savedLibraryId);
    }
    if (savedContentName) {
      setLastContentName(savedContentName);
      setCampaignContentName(savedContentName);
    }
  }, []);

  // Clear library ID from localStorage
  const clearLibraryId = () => {
    localStorage.removeItem("lastLibraryId");
    localStorage.removeItem("lastContentName");
    setContentLibraryId("");
    setLastContentName("");
    setCampaignContentName("");
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

    if (!contentLabel || !contentFile) {
      setContentMessage("Please fill in label and select file");
      setContentMessageType("error");
      return;
    }

    setIsContentUploading(true);
    setContentMessage("");

    try {
      const formData = new FormData();
      // Add ENTERPRISE A - prefix to the label
      const fileNameWithEnterprise = `ENTERPRISE ${enterprise} - ${contentLabel}`;
      formData.append("label", fileNameWithEnterprise);
      formData.append("file", contentFile);

      const result = await uploadAsset(formData);

      if (result.success) {
        setContentMessage(result.message);
        setContentMessageType("success");
        setContentLibraryId(result.data.id);
        // Save last library id and content name, and a mapping of name->id
        localStorage.setItem("lastLibraryId", result.data.id);
        localStorage.setItem("lastContentName", contentLabel);
        setLastContentName(contentLabel);
        // Also update the campaign content name input so Campaign Management shows the latest content name immediately
        setCampaignContentName(contentLabel);
        try {
          const existingMap = JSON.parse(
            localStorage.getItem("contentNameToIdMap") || "{}"
          );
          existingMap[contentLabel] = result.data.id;
          localStorage.setItem(
            "contentNameToIdMap",
            JSON.stringify(existingMap)
          );
        } catch (err) {
          localStorage.setItem(
            "contentNameToIdMap",
            JSON.stringify({ [contentLabel]: result.data.id })
          );
        }
        await triggerAutoCampaignUpdate(result.data.id, contentLabel);
        // Reset form
        setContentLabel("");
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

  // Campaign Handlers
  const handleCampaignSubmit = async (e) => {
    e.preventDefault();

    // Require a content name (or id) and duration
    if (!campaignContentName || !campaignDuration) {
      setCampaignMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
      setCampaignMessageType("error");
      return;
    }

    const now = new Date();
    const startDate = campaignStartDateTime
      ? new Date(campaignStartDateTime)
      : now;
    const endDate = campaignEndDateTime ? new Date(campaignEndDateTime) : null;

    // ตรวจสอบว่า StartDate ต้องไม่น้อยกว่าวันนี้ 00:00 AM
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate.getTime() < today.getTime()) {
      setCampaignMessage("ไม่สามารถเลือกวันย้อนหลังได้");
      setCampaignMessageType("error");
      return;
    }

    // ตรวจสอบว่า EndDate ต้องมากกว่า StartDate
    if (endDate && endDate <= startDate) {
      setCampaignMessage("วันสิ้นสุดต้องมากกว่าวันเริ่มต้น");
      setCampaignMessageType("error");
      return;
    }

    setIsCampaignSubmitting(true);
    setCampaignMessage("");

    try {
      const formData = new FormData();
      // Resolve content name to libraryId using stored map; if not found, allow raw input as id
      let resolvedLibraryId = campaignContentName;
      try {
        const map = JSON.parse(
          localStorage.getItem("contentNameToIdMap") || "{}"
        );
        if (map && map[campaignContentName])
          resolvedLibraryId = map[campaignContentName];
      } catch (err) {
        // ignore parse errors and use campaignContentName as-is
      }
      formData.append("libraryId", resolvedLibraryId);
      formData.append(
        "startDateTime",
        convertToUnixTime(campaignStartDateTime)
      );
      formData.append("endDateTime", convertToUnixTime(campaignEndDateTime));
      formData.append("duration", campaignDuration);
      formData.append("type", campaignType);
      formData.append("contentOrder", contentOrder);
      formData.append("slotOrder", slotOrder);

      const result = await updateSequence(formData);

      if (result.success) {
        setCampaignMessage("Campaign updated successfully");
        setCampaignMessageType("success");
        // Reset form
        setCampaignContentName("");
        setCampaignStartDateTime("");
        setCampaignEndDateTime("");
        setCampaignDuration("");
      } else {
        setCampaignMessage(result.error);
        setCampaignMessageType("error");
      }
    } catch (error) {
      setCampaignMessage("Error updating campaign");
      setCampaignMessageType("error");
    } finally {
      setIsCampaignSubmitting(false);
    }
  };

  // ฟังก์ชัน trigger อัปเดตแคมเปญอัตโนมัติหลัง upload สำเร็จ
  const triggerAutoCampaignUpdate = async (libraryId, contentName) => {
    try {
      const formData = new FormData();
      formData.append("libraryId", libraryId);
      formData.append(
        "startDateTime",
        convertToUnixTime(campaignStartDateTime || new Date())
      );
      formData.append(
        "endDateTime",
        convertToUnixTime(campaignEndDateTime || "")
      );
      formData.append("duration", campaignDuration);
      formData.append("type", campaignType);
      formData.append("contentOrder", contentOrder);
      formData.append("slotOrder", slotOrder);

      const result = await updateSequence(formData);

      if (result.success) {
        setCampaignMessage(`Auto-updated campaign with ${contentName}`);
        setCampaignMessageType("success");
      } else {
        setCampaignMessage(result.error);
        setCampaignMessageType("error");
      }
    } catch (error) {
      setCampaignMessage("Error auto-updating campaign");
      setCampaignMessageType("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Campaign Management
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Right Side - Campaign Management */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Campaign Management
            </h2>

            <form onSubmit={handleCampaignSubmit} className="space-y-4">
              {/* <div>
                <label
                  htmlFor="campaign-content-name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Content Name
                </label>
                <input
                  type="text"
                  id="campaign-content-name"
                  name="contentName"
                  value={campaignContentName}
                  onChange={(e) => setCampaignContentName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Content Name "
                  disabled={isCampaignSubmitting}
                />
              </div> */}
              {/* Campaign Type */}
              <div>
                <label
                  htmlFor="campaign-type"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Type Campaign
                </label>
                <select
                  id="campaign-type"
                  value={campaignType}
                  onChange={(e) => setCampaignType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCampaignSubmitting}
                >
                  <option value="Portrait">Kiosk</option>
                  <option value="Landscape">TV Signage</option>
                </select>
              </div>

              {/* Campaign Start Date Time */}
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
                    campaignStartDateTime
                      ? campaignStartDateTime
                      : formatDateForInput(new Date())
                  }
                  min={formatDateForInput(
                    new Date(new Date().setHours(0, 0, 0, 0))
                  )}
                  onChange={(e) => setCampaignStartDateTime(e.target.value)}
                />
              </div>

              {/* Campaign End Date Time */}
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
                  value={campaignEndDateTime}
                  min={
                    campaignStartDateTime
                      ? campaignStartDateTime
                      : formatDateForInput(new Date())
                  }
                  onChange={(e) => setCampaignEndDateTime(e.target.value)}
                />
                <label
                  htmlFor="campaign-duration"
                  className="block text-sm font-medium text-gray-700 my-3"
                >
                  Duration *
                </label>
                <select
                  id="campaign-duration"
                  name="duration"
                  value={campaignDuration}
                  onChange={(e) => setCampaignDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isCampaignSubmitting}
                >
                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Order */}
              <div>
                <label
                  htmlFor="content-order"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Content Order
                </label>
                <select
                  id="content-order"
                  value={contentOrder}
                  onChange={(e) => setContentOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCampaignSubmitting}
                >
                  {[1, 2, 3].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              {/* Slot Order */}
              <div>
                <label
                  htmlFor="slot-order"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Slot Order
                </label>
                <select
                  id="slot-order"
                  value={slotOrder}
                  onChange={(e) => setSlotOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCampaignSubmitting}
                >
                  {[1, 2, 3].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campaign Submit Button */}
              {/* <button
                type="submit"
                disabled={
                  isCampaignSubmitting ||
                  !campaignContentName ||
                  !campaignDuration
                }
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCampaignSubmitting ? "Updating..." : "Update Campaign"}
              </button> */}
            </form>

            {/* Campaign Status Message */}
            {/* {campaignMessage && (
              <div
                className={`mt-4 p-3 rounded-md ${
                  campaignMessageType === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {campaignMessage}
              </div>
            )} */}
          </div>
          {/* Left Side - Content Upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Add Content
            </h2>

            <form onSubmit={handleContentSubmit} className="space-y-4">
              {/* Content Label Input */}
              <div>
                <label
                  htmlFor="content-label"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Content Name *
                </label>
                <input
                  type="text"
                  id="content-label"
                  name="label"
                  value={contentLabel}
                  onChange={(e) => setContentLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Content Name"
                  disabled={isContentUploading}
                />
              </div>

              {/* Content File Upload Area */}
              <div>
                <label
                  htmlFor="content-file"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  File *
                </label>

                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
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
                        Supports all file types
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

              {/* Content Submit Button */}
              <button
                type="submit"
                disabled={isContentUploading || !contentLabel || !contentFile}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isContentUploading ? "Uploading..." : "Upload Content"}
              </button>
            </form>

            {/* Content Status Message */}
            {contentMessage && (
              <div
                className={`mt-4 p-3 rounded-md ${
                  contentMessageType === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {contentMessage}
              </div>
            )}

            {/* Content Library ID Display */}
            {/* {contentLibraryId && (
              <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Last Upload
                  </h3>
                  <button
                    onClick={clearLibraryId}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    Content Name
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={lastContentName}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-white border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />{" "}
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(lastContentName)
                      }
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
}
