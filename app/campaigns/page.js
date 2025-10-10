"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import CampaignManagement from "../components/CampaignManagement";
import CampaignCard from "../components/CampaignCard";
import { getUserSequences, getSequenceById } from "./get_sequence";

const CampaignsPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const closeModal = () => setIsOpen(false);
  const [sequences, setSequences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const campaigns = [
    {
      id: 1,
      image:
        "https://d2cep6vins8x6z.blobstore.net/F273B6D53DD61CDFFAD1999FA335EB81-22179",
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
        "https://d2cep6vins8x6z.blobstore.net/F273B6D53DD61CDFFAD1999FA335EB81-22179",
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
        "https://d2cep6vins8x6z.blobstore.net/F273B6D53DD61CDFFAD1999FA335EB81-22179",
      title: "Year End Clearance",
      description: "ลดล้างสต็อกสิ้นปี ราคาพิเศษทุกรายการ",
      startDate: "1 ธ.ค. 2024",
      endDate: "31 ธ.ค. 2024",
      status: "Draft",
      budget: "฿75,000",
    },
  ];

  const handleEdit = (id) => console.log("Edit campaign:", id);
  const handleDelete = (id) => console.log("Delete campaign:", id);

  // 🔹 ดึงข้อมูล sequences ของ user
  useEffect(() => {
    async function fetchSequences() {
      setIsLoading(true);
      setError(null);
      try {
        const seq_by_user = await getUserSequences();
        console.log("seq_by_user", seq_by_user);

        if (seq_by_user.success) {
          // เรียง key เช่น Spot #1, Spot #2, ...
          const sorted = seq_by_user.data.sort((a, b) => {
            const keyA = Object.keys(a)[0];
            const keyB = Object.keys(b)[0];
            const numA = parseInt(keyA.match(/\d+/)?.[0] || 0);
            const numB = parseInt(keyB.match(/\d+/)?.[0] || 0);
            return numA - numB;
          });
          setSequences(sorted);
        } else {
          setError(seq_by_user.message);
        }
      } catch (e) {
        console.error(e);
        setError("ไม่สามารถเชื่อมต่อกับ Server Action ได้");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSequences();
  }, []);

  // 🔹 ฟังก์ชันเมื่อกดปุ่ม Spot
  const handleSelectSequence = async (seqId) => {
    console.log("เรียกข้อมูลของ seq_id:", seqId);
    try {
      const seq_by_id = await getSequenceById(seqId);
      console.log("seq_by_id", seq_by_id);
    } catch (err) {
      console.error("เกิดข้อผิดพลาดตอนเรียก getSequenceById:", err);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-200 to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Campaign Management
        </h1>

        {/* 🔹 แสดงปุ่ม Spot ที่ได้จาก seq_by_user */}
        {isLoading ? (
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-8">
            {sequences.map((seqObj, index) => {
              const key = Object.keys(seqObj)[0];
              const value = seqObj[key];
              console.log("seqObj", seqObj);
              console.log("key", key);
              console.log("value", value);
              return (
                <button
                  key={index}
                  onClick={() => handleSelectSequence(value)}
                  className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-md transition"
                >
                  {key}
                </button>
              );
            })}
          </div>
        )}

        {/* 🔹 แสดงรายการแคมเปญ */}
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
        className="mt-6 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        เปิด Modal จัดการแคมเปญ
      </button>

      {/* Modal */}
      <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="relative w-[70vw] h-[70vh] rounded bg-white p-2 shadow-2xl overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
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
