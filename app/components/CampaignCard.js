import React from "react";
import { Pencil, Trash2 } from "lucide-react";

// Component Card แยกออกมา
export default function CampaignCard({ campaign, onEdit, onDelete }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Scheduled":
        return "bg-blue-100 text-blue-700";
      case "Draft":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-blue-100">
      <div className="flex items-center p-4 gap-6">
        {/* รูปภาพด้านซ้าย */}
        <div className="flex-shrink-0">
          <img
            src={campaign.image || "/placeholder-image.jpg"}
            alt={campaign.title || "ไม่มีชื่อ"}
            className="w-32 h-24 object-cover rounded-lg shadow-sm"
            onError={(e) => {
              e.target.src = "/placeholder-image.jpg";
            }}
          />
        </div>

        {/* ปุ่มแก้ไข/ลบตรงกลาง */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(campaign.id)}
            className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md group"
          >
            <Pencil className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={() => onDelete(campaign.id)}
            className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md group"
          >
            <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* ข้อมูลด้านขวา */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-1">
                {campaign.title}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-1">
                {campaign.description}
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
              <p className="text-xs text-gray-500 mb-1">Start Date</p>
              <p className="text-sm font-semibold text-gray-800">
                {campaign.startDate}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">End Date</p>
              <p className="text-sm font-semibold text-gray-800">
                {campaign.endDate}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Budget</p>
              <p className="text-sm font-semibold text-blue-600">
                {campaign.budget}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
