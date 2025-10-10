"use client";
import { useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import CampaignManagement from "../components/CampaignManagement";
import CampaignCard from "../components/CampaignCard";
import SubNavbar from "../components/SubNavbar";

const CampaignsPage = () => {
  const [isOpen, setIsOpen] = useState(false);

  // ฟังก์ชันสำหรับปิด Modal
  const closeModal = () => setIsOpen(false);

  const campaigns = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop",
      title: "Summer Sale Campaign 2024",
      description: "แคมเปญลดราคาสินค้าฤดูร้อน ลดสูงสุดถึง 50%",
      startDate: "1 มิ.ย. 2024",
      endDate: "31 ส.ค. 2024",
      status: "Active",
      budget: "฿50,000",
    },
    {
      id: 2,
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
      title: "New Product Launch",
      description: "เปิดตัวสินค้าใหม่ล่าสุด พร้อมโปรโมชั่นพิเศษ",
      startDate: "15 ก.ค. 2024",
      endDate: "30 ก.ย. 2024",
      status: "Scheduled",
      budget: "฿100,000",
    },
    {
      id: 3,
      image:
        "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop",
      title: "Year End Clearance",
      description: "ลดล้างสต็อกสิ้นปี ราคาพิเศษทุกรายการ",
      startDate: "1 ธ.ค. 2024",
      endDate: "31 ธ.ค. 2024",
      status: "Draft",
      budget: "฿75,000",
    },
  ];

  const handleEdit = (id) => {
    console.log("Edit campaign:", id);
    // เพิ่ม logic แก้ไขที่นี่
  };

  const handleDelete = (id) => {
    console.log("Delete campaign:", id);
    // เพิ่ม logic ลบที่นี่
  };

  return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-200 to-cyan-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            Campaign Management
          </h1>

          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          // Tailwind class สำหรับปุ่มเปิด Modal
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          เปิด Modal จัดการแคมเปญ
        </button>

        {/* Headless UI Dialog Component */}
        <Dialog
          open={isOpen}
          onClose={closeModal}
          className="relative z-50" // z-index สูงเพื่อให้ขึ้นมาอยู่หน้าสุด
        >
          {/* Backdrop (พื้นหลังมืด) */}
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          {/* ปรับเป็น 50% ให้มืดขึ้น */}

          {/* Full-screen container to center the panel */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            {/* The actual dialog panel container */}
            {/* ปรับแก้: w-[70vw] และ h-[70vh] เพื่อให้กว้าง-สูง 70% ของจอ และใช้ relative สำหรับปุ่มปิด */}
            <DialogPanel className="relative w-[70vw] h-[70vh] rounded bg-white p-2 shadow-2xl overflow-y-auto">
              {/* 1. ปุ่มปิดแบบกากบาท (X) ที่มุมขวาบน */}
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Close"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* เนื้อหา Modal: CampaignManagement Component */}
              <div className="h-full">
                <CampaignManagement />
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      </div>
  );
};

export default CampaignsPage;
