"use client";
import { useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import CampaignManagement from "../components/CampaignManagement";

const CampaignsPage = () => {
  const [isOpen, setIsOpen] = useState(false);

  // ฟังก์ชันสำหรับปิด Modal
  const closeModal = () => setIsOpen(false);

  return (
    <div>
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
