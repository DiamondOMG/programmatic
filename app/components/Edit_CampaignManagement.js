"use client";

import { useState, useEffect, useTransition } from "react";
import signage_form from "../make_data/signage_form";
import { updateCampaign } from "../campaign/update_campaign"; // ✅ import server action


// ฟังก์ชันแปลง datetime-local → UnixTime (string)
function convertToUnixTime(dateTimeString) {
  if (!dateTimeString) return null;
  const date = new Date(dateTimeString);
  return date.getTime().toString();
}

// ฟังก์ชันแปลง UnixTime → datetime-local format
function formatDateForInput(unixTime) {
  if (!unixTime) return "";
  const d = new Date(parseInt(unixTime, 10));
  const pad = (n) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function EditCampaignManagement({ campaign, onSuccess }) {
  console.log("campaign", campaign);
  const [seq_label, setSeqLabel] = useState("");
  const [seq_condition, setSeqCondition] = useState("");
  const [seq_name, setSeqName] = useState("");
  const [seq_id, setSeqId] = useState("");
  const [seq_startdate, setSeqStartDate] = useState("");
  const [seq_enddate, setSeqEndDate] = useState("");
  const [image, setImage] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  // โหลดค่าเริ่มต้นจาก props
  useEffect(() => {
    if (campaign) {
      setSeqLabel(campaign.title || "");
      setImage(campaign.image || "");
      setSeqName(campaign.seq_name || "");
      setSeqId(campaign.seq_id || "");

      // หา condition ที่ match signage_form
      const matchedConditionKey = Object.keys(signage_form).find(
        (key) => signage_form[key] === campaign.description
      );
      setSeqCondition(
        matchedConditionKey ? signage_form[matchedConditionKey] : ""
      );

      setSeqStartDate(formatDateForInput(campaign.startMillis));
      setSeqEndDate(formatDateForInput(campaign.endMillis));
    }
  }, [campaign]);

  // ✅ ฟังก์ชันส่งข้อมูลไป update_campaign.js
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const formData = new FormData();
    formData.append("libraryId", campaign.id); // ใช้ id เป็น libraryId
    formData.append("seq_label", seq_label);
    formData.append("seq_condition", seq_condition);
    formData.append("seq_id", seq_id);
    formData.append("programmaticId", campaign.id); // ใช้ id เดิมเป็น programmaticId (หากมีจริงค่อยปรับ)
    formData.append("seq_startdate", convertToUnixTime(seq_startdate));
    formData.append("seq_enddate", convertToUnixTime(seq_enddate));
    const debugObject = Object.fromEntries(formData.entries());
    return console.log("🧾 formData values:", debugObject);

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
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Edit Campaign
          </h2>

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
              <select
                value={seq_condition}
                onChange={(e) => setSeqCondition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(signage_form).map((option) => (
                  <option key={option} value={signage_form[option]}>
                    {option}
                  </option>
                ))}
              </select>
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
                type="datetime-local"
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
                type="datetime-local"
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
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Preview Image
          </h2>
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
