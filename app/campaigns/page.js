"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogPanel } from "@headlessui/react";
import CampaignManagement from "../components/CampaignManagement";
import CampaignCard from "../components/CampaignCard";
import { get_sequence_all } from "./get_sequence";

const CampaignsPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedSequenceId, setSelectedSequenceId] = useState(null);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);

  const closeModal = () => setIsOpen(false);
  const handleEdit = (id) => console.log("Edit campaign:", id);
  const handleDelete = (id) => console.log("Delete campaign:", id);

  // 🔹 ฟังก์ชันแปลง timestamp เป็นวันที่
  const formatDate = (timestamp) => {
    if (!timestamp || isNaN(timestamp)) return "None";

    const date = new Date(parseInt(timestamp));

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
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

  // 🔹 ฟังก์ชัน format ข้อมูลสำหรับแสดงผล
  const formatCampaignData = (items) => {
    // สร้าง Set เพื่อเก็บ ID ที่เคยเห็นแล้ว
    const seenIds = new Set();

    return items.map((item, index) => {
      // สร้าง unique ID โดยรวม index เข้าไปด้วยถ้าเจอ ID ซ้ำ
      let uniqueId = item.libraryItemId || `item-${index}`;
      if (seenIds.has(uniqueId)) {
        uniqueId = `${uniqueId}-${index}`; // เพิ่ม index ถ้าเจอ ID ซ้ำ
      }
      seenIds.add(uniqueId);

      return {
        id: uniqueId,
        image: item.blobId
          ? `https://d2cep6vins8x6z.blobstore.net/${item.blobId}`
          : "",
        title: item.label || "ไม่มีชื่อ",
        description: item.condition || "ไม่มีคำอธิบาย",
        startDate: formatDate(item.startMillis),
        endDate: formatDate(item.endMillis),
        startMillis: item.startMillis,
        endMillis: item.endMillis,
        status: item.status,
        modifiedMillis: item.modifiedMillis
          ? formatDate(item.modifiedMillis)
          : "ไม่มีข้อมูล",
        seq_name: item.seq_name,
      };
    });
  };

  // 🔹 ดึงข้อมูลทั้งหมดจาก get_sequence_all ด้วย React Query
  const {
    data: allData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sequences"],
    queryFn: async () => {
      const result = await get_sequence_all();
      if (!result.success) throw new Error(result.message);

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
        .map((seqName) => ({
          [seqName]: groupedBySequence[seqName][0].seq_id,
        }));

      // โหลดข้อมูลทั้งหมดจากทุก sequence
      if (sequencesArray.length > 0) {
        const allCampaigns = [];
        Object.values(groupedBySequence).forEach((sequenceCampaigns) => {
          allCampaigns.push(...sequenceCampaigns);
        });
        setFilteredCampaigns(formatCampaignData(allCampaigns));
      }

      return { sequences: sequencesArray, groupedData: groupedBySequence };
    },
  });

  // 🔹 ฟังก์ชันเมื่อกดปุ่ม Spot
  const handleSelectSequence = (seqId) => {
    setSelectedSequenceId(seqId);

    // หาชื่อ sequence และฟิลเตอร์ข้อมูลจาก groupedData
    const selectedSeqName = allData?.sequences.find(
      (seqObj) => Object.values(seqObj)[0] === seqId
    )
      ? Object.keys(
          allData.sequences.find((seqObj) => Object.values(seqObj)[0] === seqId)
        )[0]
      : null;

    if (selectedSeqName && allData?.groupedData) {
      const rawCampaigns = allData.groupedData[selectedSeqName] || [];
      setFilteredCampaigns(formatCampaignData(rawCampaigns));
    } else {
      setFilteredCampaigns([]);
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

        {/* 🔹 แสดง UI การโหลดหรือปุ่ม Spot และรายการแคมเปญ */}
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
          </div>
        ) : error ? (
          <p className="text-red-500 text-center py-8">{error.message}</p>
        ) : (
          <>
            <div className="ml-2 flex gap-2 overflow-x-auto ">
              {allData?.sequences.map((seqObj, index) => {
                const seqName = Object.keys(seqObj)[0];
                const seqId = seqObj[seqName];
                const campaigns = allData?.groupedData[seqName] || [];
                const formattedCampaigns = formatCampaignData(campaigns);

                // 🔹 หาสถานะของ sequence
                let status = "none";
                if (formattedCampaigns.some((c) => c.status === "Running")) {
                  status = "Running";
                } else if (
                  formattedCampaigns.some((c) => c.status === "Scheduled")
                ) {
                  status = "Scheduled";
                } else if (
                  formattedCampaigns.some((c) => c.status === "Completed")
                ) {
                  status = "Completed";
                }

                const isActive = selectedSequenceId === seqId;

                const formatUnixToDDMMYYYY = (unixMillis) => {
                  if (!unixMillis || isNaN(unixMillis)) return "none";
                  const date = new Date(parseInt(unixMillis));
                  const day = String(date.getDate()).padStart(2, "0");
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const year = date.getFullYear();
                  return `${day}/${month}/${year}`;
                };

                const startDate = formatUnixToDDMMYYYY(
                  formattedCampaigns[0]?.startMillis
                );
                const endDate = formatUnixToDDMMYYYY(
                  formattedCampaigns[0]?.endMillis
                );

                // 🔹 รูปตัวอย่าง
                const imageUrl = formattedCampaigns[0]?.image || "";

                // 🔹 วงกลมสี status
                let statusColor = "bg-gray-400"; // default
                if (status === "Running") statusColor = "bg-green-500";
                else if (status === "Scheduled") statusColor = "bg-yellow-500";
                else if (status === "Completed") statusColor = "bg-blue-500";

                return (
                  <div
                    key={index}
                    onClick={() => handleSelectSequence(seqId)}
                    className={`flex-shrink-0 w-38 flex flex-col items-center bg-gray-100 rounded-lg p-2 cursor-pointer ${
                      isActive ? "ring-2 ring-blue-500 ring-inset" : ""
                    }`}
                  >
                    {/* ชื่อ + status */}
                    <div className="flex items-center mb-1 space-x-1 text-sm font-medium">
                      <span>{seqName}</span>
                      <span
                        className={`w-3 h-3 rounded-full ${statusColor}`}
                        title={status}
                      ></span>
                    </div>

                    {/* รูปตัวอย่าง */}
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={seqName}
                        className="w-full h-20 object-cover rounded mb-1"
                      />
                    ) : (
                      <div className="w-full h-20 bg-gray-200 flex items-center justify-center rounded mb-1 text-gray-400 text-xs">
                        No Campaign
                      </div>
                    )}

                    {/* วันที่ */}
                    <div className="text-xs text-gray-600">
                      {startDate} - {endDate}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="relative inline-block text-left ml-2 w-full">
              <div className="flex justify-end">
                <button
                  type="button"
                  className="inline-flex  w-20 rounded-md border border-gray-300 shadow-sm px-4 py-2 my-4 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  id="filter-menu"
                  aria-expanded="true"
                  aria-haspopup="true"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  Filter
                  <svg
                    className="-mr-1 ml-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {isFilterOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="filter-menu"
                >
                  <div className="py-1" role="none">
                    <button
                      onClick={() => {
                        // Show all campaigns
                        const allCampaigns = [];
                        Object.values(allData?.groupedData || {}).forEach(
                          (sequenceCampaigns) => {
                            allCampaigns.push(...sequenceCampaigns);
                          }
                        );
                        setFilteredCampaigns(formatCampaignData(allCampaigns));
                        setSelectedSequenceId(null);
                        setIsFilterOpen(false);
                      }}
                      className={`${
                        selectedSequenceId === null
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-700"
                      } block w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                      role="menuitem"
                    >
                      All campaigns
                    </button>
                    {allData?.sequences.map((seqObj) => {
                      const seqName = Object.keys(seqObj)[0];
                      const seqId = seqObj[seqName];
                      const isActive = selectedSequenceId === seqId;

                      return (
                        <button
                          key={seqId}
                          onClick={() => {
                            handleSelectSequence(seqId);
                            setIsFilterOpen(false);
                          }}
                          className={`${
                            isActive
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700"
                          } block w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                          role="menuitem"
                        >
                          Only {seqName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {filteredCampaigns.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">ไม่มีแคมเปญใน Sequence นี้</p>
                </div>
              ) : (
                <>
                  {/* Running Section */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="text-lg font-medium text-green-600 mb-3">
                      Running
                    </h3>
                    <div className="space-y-3">
                      {filteredCampaigns
                        .filter((campaign) => campaign.status === "Running")
                        .map((campaign) => (
                          <div
                            key={campaign.id}
                            className="border border-green-200 rounded-lg "
                          >
                            <CampaignCard
                              campaign={campaign}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Scheduled Section */}
                  <div className="border-l-4 border-yellow-500 pl-4 mt-6">
                    <h3 className="text-lg font-medium text-yellow-600 mb-3">
                      Scheduled
                    </h3>
                    <div className="space-y-3">
                      {filteredCampaigns
                        .filter((campaign) => campaign.status === "Schedule")
                        .map((campaign) => (
                          <div
                            key={campaign.id}
                            className="border border-yellow-200 rounded-lg "
                          >
                            <CampaignCard
                              campaign={campaign}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Completed Section */}
                  <div className="border-l-4 border-gray-400 pl-4 mt-6">
                    <h3 className="text-lg font-medium text-gray-500 mb-3">
                      Completed
                    </h3>
                    <div className="space-y-3">
                      {filteredCampaigns
                        .filter((campaign) => campaign.status === "Complete")
                        .map((campaign) => (
                          <div
                            key={campaign.id}
                            className="border border-gray-200 rounded-lg "
                          >
                            <CampaignCard
                              campaign={campaign}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

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
    </div>
  );
};

export default CampaignsPage;
