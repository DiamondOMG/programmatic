"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import CampaignManagement from "../components/CampaignManagement";
import CampaignCard from "../components/CampaignCard";
import { get_sequence_all } from "./get_sequence";

const CampaignsPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const closeModal = () => setIsOpen(false);
  const [sequences, setSequences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSequenceId, setSelectedSequenceId] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  const handleEdit = (id) => console.log("Edit campaign:", id);
  const handleDelete = (id) => console.log("Delete campaign:", id);

  // 🔹 ฟังก์ชันแปลง timestamp เป็นวันที่
  const formatDate = (timestamp) => {
    if (!timestamp) return "ไม่มีกำหนด";
    const date = new Date(parseInt(timestamp));
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // 🔹 ฟังก์ชันกำหนดสถานะจากวันที่
  const getStatusFromDates = (startMillis, endMillis) => {
    if (!startMillis || !endMillis) return "Draft";

    const now = new Date().getTime();
    const start = parseInt(startMillis);
    const end = parseInt(endMillis);

    if (now < start) return "Scheduled";
    if (now >= start && now <= end) return "Active";
    if (now > end) return "Completed";
    return "Draft";
  };

  // 🔹 ดึงข้อมูลทั้งหมดจาก get_sequence_all
  useEffect(() => {
    async function fetchAllData() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await get_sequence_all();
        console.log("get_sequence_all result:", result);

        if (result.success) {
          // จัดกลุ่มข้อมูลตาม seq_name
          const groupedBySequence = result.data.reduce((acc, item) => {
            if (!acc[item.seq_name]) {
              acc[item.seq_name] = [];
            }
            acc[item.seq_name].push(item);
            return acc;
          }, {});

          // แปลงเป็น array ของ sequences สำหรับปุ่มเลือก
          const sequencesArray = Object.keys(groupedBySequence)
            .sort((a, b) => {
              const numA = parseInt(a.match(/\d+/)?.[0] || 0);
              const numB = parseInt(b.match(/\d+/)?.[0] || 0);
              return numA - numB;
            })
            .map(seqName => ({
              [seqName]: groupedBySequence[seqName][0].seq_id
            }));

          setSequences(sequencesArray);

          // เซ็ต sequence แรกเป็น active และโหลดข้อมูล
          if (sequencesArray.length > 0) {
            const firstSeqId = Object.values(sequencesArray[0])[0];
            setSelectedSequenceId(firstSeqId);
            const firstSeqName = Object.keys(sequencesArray[0])[0];
            const rawCampaigns = groupedBySequence[firstSeqName] || [];
            const formattedCampaigns = formatCampaignData(rawCampaigns);
            setCampaigns(formattedCampaigns);
          }
        } else {
          setError(result.message);
        }
      } catch (e) {
        console.error(e);
        setError("ไม่สามารถเชื่อมต่อกับ Server Action ได้");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllData();
  }, []);

  // 🔹 ฟังก์ชัน format ข้อมูลสำหรับแสดงผล
  const formatCampaignData = (items) => {
    return items.map((item, index) => ({
      id: item.libraryItemId || `item-${index}`,
      image: item.blobId ? `https://d2cep6vins8x6z.blobstore.net/${item.blobId}` : "",
      title: item.label || "ไม่มีชื่อ",
      description: item.condition || "ไม่มีคำอธิบาย",
      startDate: formatDate(item.startMillis),
      endDate: formatDate(item.endMillis),
      status: getStatusFromDates(item.startMillis, item.endMillis),
      modifiedMillis: item.modifiedMillis ? formatDate(item.modifiedMillis) : "ไม่มีข้อมูล"
    }));
  };

  // 🔹 ฟังก์ชันเมื่อกดปุ่ม Spot
  const handleSelectSequence = (seqId) => {
    console.log("เลือก sequence:", seqId);
    setSelectedSequenceId(seqId);

    // หาชื่อ sequence และข้อมูลที่เกี่ยวข้อง
    const selectedSeqName = sequences.find(seqObj => Object.values(seqObj)[0] === seqId)
      ? Object.keys(sequences.find(seqObj => Object.values(seqObj)[0] === seqId))[0]
      : null;

    if (selectedSeqName) {
      setCampaignsLoading(true);

      // ดึงข้อมูลใหม่จาก API เพื่อให้ได้ข้อมูล campaigns สำหรับ sequence ที่เลือก
      get_sequence_all().then(result => {
        if (result.success) {
          const groupedBySequence = result.data.reduce((acc, item) => {
            if (!acc[item.seq_name]) {
              acc[item.seq_name] = [];
            }
            acc[item.seq_name].push(item);
            return acc;
          }, {});

          const rawCampaigns = groupedBySequence[selectedSeqName] || [];
          const formattedCampaigns = formatCampaignData(rawCampaigns);
          setCampaigns(formattedCampaigns);
        }
        setCampaignsLoading(false);
      }).catch(err => {
        console.error("เกิดข้อผิดพลาดตอนดึงข้อมูล:", err);
        setCampaigns([]);
        setCampaignsLoading(false);
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-200 to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Campaign Management
          </h1>
          <button
            onClick={() => setIsOpen(true)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Add Campaign
          </button>
        </div>
        

        {/* 🔹 แสดงปุ่ม Spot ที่ได้จาก seq_by_user */}
        {isLoading ? (
          null
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-8">
            {sequences.map((seqObj, index) => {
              const key = Object.keys(seqObj)[0];
              const value = seqObj[key];
              const isActive = selectedSequenceId === value;

              return (
                <button
                  key={index}
                  onClick={() => handleSelectSequence(value)}
                  className={`px-4 py-2 rounded shadow-md transition ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'bg-blue-300 hover:bg-blue-400 text-gray-700'
                  }`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        )}

        {/* 🔹 แสดงรายการแคมเปญ */}
        <div className="space-y-4">
          {campaignsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">กำลังโหลดข้อมูลแคมเปญ...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">ไม่มีแคมเปญใน Sequence นี้</p>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

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
