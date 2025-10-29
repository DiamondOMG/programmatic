"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogPanel } from "@headlessui/react";
import CampaignManagement from "../components/CampaignManagement";
import CampaignCard from "../components/CampaignCard";
import { get_sequence_all } from "./get_sequence";
import { delItem } from "./del_item";
import EditCampaignManagement from "../components/Edit_CampaignManagement";
import signage_form from "../make_data/signage_form";

const CampaignsPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFormFilterOpen, setIsFormFilterOpen] = useState(false);
  const [selectedSequenceId, setSelectedSequenceId] = useState(null);
  const [selectedFormFilter, setSelectedFormFilter] = useState(null);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [selectId, setSelectId] = useState(null);
  const [selectSeqId, setSelectSeqId] = useState(null);
  const [message, setMessage] = useState(null); // State for API response message
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [showAllSpots, setShowAllSpots] = useState(false); // Toggle state for showing all spots

  const closeModal = () => setIsOpen(false);
  const closeDeleteModal = () => {
    setIsDeleteOpen(false);
    setMessage(null); // Reset message when closing
  };
  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingCampaign(null);
  };

  // Update the handleEdit function
  const handleEdit = (id, seq_id) => {
    const campaignToEdit = filteredCampaigns.find(
      (c) => c.id === id && c.seq_id === seq_id
    );
    if (campaignToEdit) {
      setEditingCampaign(campaignToEdit);
      setIsEditOpen(true);
    }
  };
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await delItem(selectId, selectSeqId);
      if (response.success) {
        setMessage({ type: "success", text: response.message });
        // Invalidate queries to refetch the latest data
        await queryClient.invalidateQueries(["sequences"]);
      } else {
        setMessage({ type: "error", text: response.error });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Unexpected error occurred",
      });
    } finally {
      setIsDeleting(false);
      // Close the delete modal after a short delay to show success message
      if (message?.type === "success") {
        setTimeout(closeDeleteModal, 1500);
      }
    }
  };

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
        id: item.id || uniqueId,
        seq_id: item.seq_id,
        image: item.blobId
          ? `https://d2cep6vins8x6z.blobstore.net/${item.blobId}`
          : "",
        title: item.label || "No Title",
        description: item.condition || "Global",
        startDate: formatDate(item.startMillis),
        endDate: formatDate(item.endMillis),
        startMillis: item.startMillis,
        endMillis: item.endMillis,
        status: item.status,
        modifiedMillis: item.modifiedMillis
          ? formatDate(item.modifiedMillis)
          : "ไม่มีข้อมูล",
        seq_name: item.seq_name,
        email: item.email,
        libraryItemId: item.libraryItemId,
        type_programmatic: item.type_programmatic,
        seq_form: item.form_programmatic || "Global",
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
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-800">
              Campaign Management
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAllSpots(!showAllSpots)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showAllSpots
                  ? "bg-gray-400 text-white hover:bg-gray-500"
                  : "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
              }`}
            >
              {showAllSpots ? "Hide Details" : "Show All Spot"}
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Add Campaign
            </button>
          </div>
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
                console.log("formattedCampaigns:", formattedCampaigns);

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
                      <span className="font-bold underline">{seqName}</span>
                    </div>

                    {/* Dynamic sections based on signage_form */}
                    {showAllSpots
                      ? // Show All Spot: แสดงทุก format
                        Object.keys(signage_form).map((formKey, formIndex) => {
                          // หา campaigns ทั้งหมดที่ match กับ format นี้
                          const campaignsForForm = formattedCampaigns.filter(
                            (c) => c.seq_form === formKey
                          );

                          // เอา campaign ตัวแรก (ถ้ามี) เพื่อดู status
                          let firstCampaign =
                            campaignsForForm.length > 0
                              ? campaignsForForm[0]
                              : null;

                          // ถ้าไม่มี campaign สำหรับ format นี้ ให้หา Global
                          if (!firstCampaign) {
                            firstCampaign = formattedCampaigns.find(
                              (c) => c.seq_form === "Global"
                            );
                          }

                          // คำนวณ status และสีสำหรับ format นี้
                          let formStatus = firstCampaign?.status || "none";
                          let formStatusColor = "bg-gray-400";
                          if (formStatus === "Running")
                            formStatusColor = "bg-green-500";
                          else if (formStatus === "Schedule")
                            formStatusColor = "bg-yellow-500";
                          else if (formStatus === "Complete")
                            formStatusColor = "bg-blue-500";

                          const formStartDate = firstCampaign
                            ? formatUnixToDDMMYYYY(firstCampaign.startMillis)
                            : "none";
                          const formEndDate = firstCampaign
                            ? formatUnixToDDMMYYYY(firstCampaign.endMillis)
                            : "none";
                          const formImageUrl = firstCampaign?.image || "";

                          return (
                            <div key={formKey}>
                              {formIndex > 0 && (
                                <div className="w-full h-px bg-gray-300 my-2"></div>
                              )}
                              <div className="flex items-center mb-1 space-x-1 text-sm font-medium">
                                <span>{formKey}</span>
                                <span
                                  className={`w-3 h-3 rounded-full ${formStatusColor}`}
                                  title={formStatus}
                                ></span>
                              </div>

                              {/* รูปตัวอย่าง */}
                              {formImageUrl ? (
                                <img
                                  src={formImageUrl}
                                  alt={seqName}
                                  className="w-full h-20 object-contain object-center rounded mb-1 bg-gray-100"
                                />
                              ) : (
                                <div className="w-full h-20 bg-gray-200 flex items-center justify-center rounded mb-1 text-gray-400 text-xs">
                                  No Campaign
                                </div>
                              )}

                              {/* วันที่ */}
                              <div className="text-xs text-gray-600">
                                {formStartDate} - {formEndDate}
                              </div>
                            </div>
                          );
                        })
                      : // Default: แสดงแค่ campaign ล่าสุด
                        (() => {
                          // หา campaign ล่าสุด (modifiedMillis สูงสุด)
                          const latestCampaign = formattedCampaigns.reduce(
                            (latest, current) => {
                              if (!latest) return current;
                              const latestModified = parseInt(
                                latest.modifiedMillis || "0"
                              );
                              const currentModified = parseInt(
                                current.modifiedMillis || "0"
                              );
                              return currentModified > latestModified
                                ? current
                                : latest;
                            },
                            null
                          );

                          if (!latestCampaign) return null;

                          const formStatus = latestCampaign.status || "none";
                          let formStatusColor = "bg-gray-400";
                          if (formStatus === "Running")
                            formStatusColor = "bg-green-500";
                          else if (formStatus === "Schedule")
                            formStatusColor = "bg-yellow-500";
                          else if (formStatus === "Complete")
                            formStatusColor = "bg-blue-500";

                          const formStartDate = formatUnixToDDMMYYYY(
                            latestCampaign.startMillis
                          );
                          const formEndDate = formatUnixToDDMMYYYY(
                            latestCampaign.endMillis
                          );
                          const formImageUrl = latestCampaign.image || "";

                          return (
                            <div>
                              <div className="flex items-center mb-1 space-x-1 text-sm font-medium">
                                <span>{latestCampaign.seq_form}</span>
                                <span
                                  className={`w-3 h-3 rounded-full ${formStatusColor}`}
                                  title={formStatus}
                                ></span>
                              </div>

                              {/* รูปตัวอย่าง */}
                              {formImageUrl ? (
                                <img
                                  src={formImageUrl}
                                  alt={seqName}
                                  className="w-full h-20 object-contain object-center rounded mb-1 bg-gray-100"
                                />
                              ) : (
                                <div className="w-full h-20 bg-gray-200 flex items-center justify-center rounded mb-1 text-gray-400 text-xs">
                                  No Campaign
                                </div>
                              )}

                              {/* วันที่ */}
                              <div className="text-xs text-gray-600">
                                {formStartDate} - {formEndDate}
                              </div>
                            </div>
                          );
                        })()}
                  </div>
                );
              })}
            </div>

            <div className="relative inline-block text-left ml-2 w-full">
              <div className="flex justify-end gap-2">
                {/* Spot Filter */}
                <button
                  type="button"
                  className="inline-flex w-32 rounded-md border border-gray-300 shadow-sm px-4 py-2 my-4 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  id="spot-filter-menu"
                  aria-expanded="true"
                  aria-haspopup="true"
                  onClick={() => {
                    setIsFilterOpen(!isFilterOpen);
                    setIsFormFilterOpen(false);
                  }}
                >
                  Spot Filter
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

                {/* Form Filter */}
                <button
                  type="button"
                  className="inline-flex w-32 rounded-md border border-gray-300 shadow-sm px-4 py-2 my-4 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  id="form-filter-menu"
                  aria-expanded="true"
                  aria-haspopup="true"
                  onClick={() => {
                    setIsFormFilterOpen(!isFormFilterOpen);
                    setIsFilterOpen(false);
                  }}
                >
                  Form Filter
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

              {/* Spot Filter Dropdown */}
              {isFilterOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="spot-filter-menu"
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
                        const formatted = formatCampaignData(allCampaigns);
                        setFilteredCampaigns(
                          selectedFormFilter
                            ? formatted.filter(
                                (c) => c.seq_form === selectedFormFilter
                              )
                            : formatted
                        );
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
                      All spots
                    </button>
                    {allData?.sequences.map((seqObj) => {
                      const seqName = Object.keys(seqObj)[0];
                      const seqId = seqObj[seqName];
                      const isActive = selectedSequenceId === seqId;

                      return (
                        <button
                          key={seqId}
                          onClick={() => {
                            setSelectedSequenceId(seqId);
                            const selectedSeqName = Object.keys(
                              allData.sequences.find(
                                (s) => Object.values(s)[0] === seqId
                              )
                            )[0];
                            const rawCampaigns =
                              allData.groupedData[selectedSeqName] || [];
                            const formatted = formatCampaignData(rawCampaigns);
                            setFilteredCampaigns(
                              selectedFormFilter
                                ? formatted.filter(
                                    (c) => c.seq_form === selectedFormFilter
                                  )
                                : formatted
                            );
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

              {/* Form Filter Dropdown */}
              {isFormFilterOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="form-filter-menu"
                >
                  <div className="py-1" role="none">
                    <button
                      onClick={() => {
                        setSelectedFormFilter(null);
                        // Show all forms
                        if (selectedSequenceId) {
                          const selectedSeqName = Object.keys(
                            allData.sequences.find(
                              (s) => Object.values(s)[0] === selectedSequenceId
                            )
                          )[0];
                          const rawCampaigns =
                            allData.groupedData[selectedSeqName] || [];
                          setFilteredCampaigns(
                            formatCampaignData(rawCampaigns)
                          );
                        } else {
                          const allCampaigns = [];
                          Object.values(allData?.groupedData || {}).forEach(
                            (sequenceCampaigns) => {
                              allCampaigns.push(...sequenceCampaigns);
                            }
                          );
                          setFilteredCampaigns(
                            formatCampaignData(allCampaigns)
                          );
                        }
                        setIsFormFilterOpen(false);
                      }}
                      className={`${
                        selectedFormFilter === null
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-700"
                      } block w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                      role="menuitem"
                    >
                      All forms
                    </button>
                    {Object.keys(signage_form).map((formKey) => {
                      const isActive = selectedFormFilter === formKey;

                      return (
                        <button
                          key={formKey}
                          onClick={() => {
                            setSelectedFormFilter(formKey);
                            // Get current campaigns based on spot filter
                            let campaigns;
                            if (selectedSequenceId) {
                              const selectedSeqName = Object.keys(
                                allData.sequences.find(
                                  (s) =>
                                    Object.values(s)[0] === selectedSequenceId
                                )
                              )[0];
                              campaigns =
                                allData.groupedData[selectedSeqName] || [];
                            } else {
                              campaigns = [];
                              Object.values(allData?.groupedData || {}).forEach(
                                (sequenceCampaigns) => {
                                  campaigns.push(...sequenceCampaigns);
                                }
                              );
                            }
                            const formatted = formatCampaignData(campaigns);
                            setFilteredCampaigns(
                              formatted.filter((c) => c.seq_form === formKey)
                            );
                            setIsFormFilterOpen(false);
                          }}
                          className={`${
                            isActive
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700"
                          } block w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                          role="menuitem"
                        >
                          Only {formKey}
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
                  <p className="text-gray-600">No Campaigns Found</p>
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
                              onDelete={() => setIsDeleteOpen(true)}
                              selectId={setSelectId}
                              selectSeqId={setSelectSeqId}
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
                              onDelete={() => setIsDeleteOpen(true)}
                              selectId={setSelectId}
                              selectSeqId={setSelectSeqId}
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
                              onDelete={() => setIsDeleteOpen(true)}
                              selectId={setSelectId}
                              selectSeqId={setSelectSeqId}
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
        {/* Modal */}
        <Dialog
          open={isDeleteOpen}
          onClose={closeDeleteModal}
          className="relative z-50"
        >
          {/* ฉากหลังเบลอและมืด */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
              {/* ปุ่มปิดมุมขวา */}
              <button
                onClick={closeDeleteModal}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                aria-label="Close"
                disabled={isDeleting}
              >
                <svg
                  className="h-5 w-5"
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

              {/* Content */}
              {!message ? (
                <>
                  {/* ไอคอนเตือน */}
                  <div className="flex justify-center mb-4">
                    <div className="bg-red-100 p-4 rounded-full flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-red-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v2m0 4h.01M12 3.75l8.25 14.25H3.75L12 3.75z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* ข้อความยืนยัน */}
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">
                    Confirm Deletion
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Are you sure you want to delete this item?
                  </p>

                  {/* ปุ่มยืนยัน / ยกเลิก */}
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={closeDeleteModal}
                      className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium transition-colors"
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors shadow-sm"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Message display */}
                  <div className="flex justify-center mb-4">
                    <div
                      className={`p-4 rounded-full flex items-center justify-center ${
                        message.type === "success"
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      <svg
                        className={`w-10 h-10 ${
                          message.type === "success"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        {message.type === "success" ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        ) : (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v2m0 4h.01M12 3.75l8.25 14.25H3.75L12 3.75z"
                          />
                        )}
                      </svg>
                    </div>
                  </div>

                  {/* Message text */}
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">
                    {message.type === "success"
                      ? "Deletion Successful"
                      : "Deletion Failed"}
                  </h2>
                  <p className="text-gray-600 mb-4">{message.text}</p>

                  {/* OK button */}
                  <div className="flex justify-center">
                    <button
                      onClick={closeDeleteModal}
                      className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors shadow-sm"
                    >
                      OK
                    </button>
                  </div>
                </>
              )}
            </DialogPanel>
          </div>
        </Dialog>
        <Dialog
          open={isEditOpen}
          onClose={closeEditModal}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-4xl rounded-xl bg-white p-6">
              <div className="flex items-center justify-between mb-4 ">
                <div className="flex-1"></div>
                <h2 className="text-xl font-bold text-center">Edit Campaign</h2>
                <div className="flex-1 flex justify-end">
                  <button
                    onClick={closeEditModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {editingCampaign && (
                <EditCampaignManagement
                  campaign={editingCampaign}
                  onSuccess={() => {
                    queryClient.invalidateQueries(["sequences"]);
                    closeEditModal();
                  }}
                />
              )}
            </DialogPanel>
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default CampaignsPage;
