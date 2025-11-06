"use client";

import { useState, useTransition } from "react";
import { updateCampaign } from "../campaign/update_campaign";

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

  return date.getTime().toString();
}

// ฟังก์ชันแปลง UnixTime → date format (yyyy-MM-dd)
function formatDateForInput(unixTime) {
  if (!unixTime) return "";
  const d = new Date(parseInt(unixTime, 10));
  const pad = (n) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function EditCampaignManagement({ campaign, onSuccess }) {
  const [seq_label, setSeqLabel] = useState(campaign.title);
  const [seq_form, setSeqForm] = useState(campaign.seq_form);
  const [seq_condition, setSeqCondition] = useState(campaign.description);
  const [seq_name, setSeqName] = useState(campaign.seq_name);
  const [seq_id, setSeqId] = useState(campaign.seq_id);
  const [seq_startdate, setSeqStartDate] = useState(formatDateForInput(campaign.startMillis));
  const [seq_enddate, setSeqEndDate] = useState(formatDateForInput(campaign.endMillis));
  const [image, setImage] = useState(campaign.image);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();



  // ✅ ฟังก์ชันส่งข้อมูลไป update_campaign.js
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const formData = new FormData();
    formData.append("libraryId", campaign.id);
    formData.append("seq_label", seq_label);
    formData.append("seq_id", seq_id);
    formData.append("programmaticId", campaign.id);
    formData.append("seq_startdate", convertToUnixTime(seq_startdate, false));
    formData.append("seq_enddate", convertToUnixTime(seq_enddate, true));
    formData.append("libraryItemId", campaign.libraryItemId);
    formData.append("seq_form", seq_form);
    formData.append("seq_condition", seq_condition);

    startTransition(async () => {
      try {
        const result = await updateCampaign(formData);
        if (result.success) {
          setMessage("✅ " + result.message);
          if (onSuccess) onSuccess(result.data);
        } else {
          setMessage("❌ " + result.error);
        }
      } catch (err) {
        console.error("Update error:", err);
        setMessage("❌ Update Campaign Failed");
      }
    });
  };

  return (
    <div className="h-full w-full bg-white flex flex-col pt-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* LEFT PANEL */}
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col">
          <form onSubmit={handleSubmit} className="space-y-3 flex-1">
            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                value={seq_label}
                onChange={(e) => setSeqLabel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format *
              </label>
              <input
                type="text"
                value={seq_form}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-600"
              />
            </div>

            {/* Spot */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spot *
              </label>
              <input
                type="text"
                value={seq_name}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-600"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={seq_startdate}
                onChange={(e) => setSeqStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={seq_enddate}
                onChange={(e) => setSeqEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isPending ? "Updating..." : "Save Changes"}
              </button>
            </div>

            {message && (
              <div
                className={`p-2 mt-2 rounded-md text-center ${
                  message.startsWith("✅")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </div>

        {/* RIGHT PANEL: IMAGE */}
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-center">
          {image ? (
            <img
              src={image}
              alt="Campaign preview"
              className="max-h-[400px] w-auto rounded-lg shadow-sm object-contain"
            />
          ) : (
            <p className="text-gray-400 italic">No image available</p>
          )}
        </div>
      </div>
    </div>
  );
}
