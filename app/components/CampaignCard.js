import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import signage_form from "../make_data/signage_form.js";

// Component Card แยกออกมา
export default function CampaignCard({ campaign, onEdit, onDelete, selectId, selectSeqId }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "Running":
        return "bg-green-100 text-green-700";
      case "Schedule":
        return "bg-yellow-100 text-yellow-700";
      case "Complete":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // 🔹 ฟังก์ชัน map condition เป็น label
  const getLabelFromCondition = (condition) => {
    for (const [label, cond] of Object.entries(signage_form)) {
      if (cond === condition) {
        return label;
      }
    }
    return condition; // ถ้าหาไม่เจอ แสดง condition เดิม
  };

  // ✅ เช็คว่าควรแสดงปุ่มหรือไม่
  const shouldShowButtons = campaign.title !== "Default";

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-100">
      <div className="flex items-center p-4 gap-6">
        {/* รูปภาพด้านซ้าย */}
        <div className="flex-shrink-0">
          <h1 className="text-xl font-bold">{campaign.seq_name}</h1>
          <img
            src={campaign.image || "/placeholder-image.jpg"}
            alt={campaign.title || "No Title"}
            className="w-32 h-24 object-contain object-center rounded mb-1 bg-gray-100"
            onError={(e) => {
              e.target.src = "/placeholder-image.jpg";
            }}
          />
        </div>

        {/* ปุ่มแก้ไข/ลบตรงกลาง - แสดงเฉพาะเมื่อ type_programmatic !== "default" */}
        {shouldShowButtons && (
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={() => onEdit(campaign.id, campaign.seq_id)}
              className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md group"
            >
              <Pencil className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            <button
              onClick={() => {
                selectId(campaign.id);       // ✅ เก็บ id ของแคมเปญ
                selectSeqId(campaign.seq_id); // ✅ เก็บ seq_id
                onDelete();
              }}
              className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md group"
            >
              <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}

        {/* ข้อมูลด้านขวา */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="text-l font-bold text-gray-800 mb-1">
                {campaign.title}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-1">
                {campaign.seq_form}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(
                campaign.status
              )}`}
            >
              {campaign.status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-3">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Period Run</p>
              <p className="text-sm font-semibold text-gray-800">
                {campaign.startDate} - {campaign.endDate}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Last Modified</p>
              <p className="text-sm font-semibold text-blue-600">
                {campaign.modifiedMillis}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Modified By</p>
              <p className="text-sm font-semibold text-blue-600">
                {campaign.email ? campaign.email : "Some One"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}