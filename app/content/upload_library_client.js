"use client";

import { createLibraryItem, createLibraryRecord } from "./upload_library.js";

// ฟังก์ชัน upload ไฟล์ฝั่ง client
async function uploadFile(file, itemId, pendingId, fileName) {
  // โค้ดนี้ยังคงอยู่ และสร้าง Buffer ใน Browser เหมือนเดิม
  const fileBuffer = Buffer.from(await file.arrayBuffer()); // 🎯 เปลี่ยนปลายทางให้ชี้ไปที่ Express Proxy Service

  // const EC2_PROXY_URL = "https://assets.actmedia.com/upload";
  const EC2_PROXY_URL = "https://assets.actmedia.com/upload-go";
  // const EC2_PROXY_URL = "http://localhost:5001/upload-go"; // เปลี่ยนเป็น localhost:5000
  const response = await fetch(EC2_PROXY_URL, {
    // ใช้ URL ใหม่
    method: "POST",
    headers: {
      "X-UploadType": "raw",
      "X-FileName": fileName,
      "X-ItemType": "libraryitem",
      "Content-Type": "content/unknown",
      "X-PendingId": pendingId,
      "X-ItemId": itemId,
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(
      `Step 2 (uploadFile) failed: ${response.status} ${response.statusText}. Details: ${errorDetails}`
    );
  }

  return response;
}

// Main client-side function
export async function uploadAsset(formData) {
  try {
    const label = formData.get("label");
    const file = formData.get("file");

    if (!label || !file) {
      return { success: false, error: "Please fill in label and select file" };
    }

    let id, pendingId;

    // Step 1: เรียก server action เพื่อสร้าง library item
    try {
      console.log("Starting Step 1: createLibraryItem");
      const result = await createLibraryItem(label);
      id = result.id;
      pendingId = result.pendingId;
      console.log(`Step 1 success. Item ID: ${id}, Pending ID: ${pendingId}`);
    } catch (e) {
      console.error("Error in Step 1:", e);
      throw e;
    }

    // Step 2: Upload ไฟล์ฝั่ง client
    try {
      console.log("Starting Step 2: uploadFile");
      await uploadFile(file, id, pendingId, file.name);
      console.log("Step 2 success. File uploaded.");
    } catch (e) {
      console.error("Error in Step 2:", e);
      throw e;
    }

    // Step 3: เรียก server action เพื่อบันทึกข้อมูลลง library table
    try {
      console.log("Starting Step 3: createLibraryRecord");
      await createLibraryRecord(id, pendingId);
      console.log("Step 3 success. Record saved to Supabase.");
    } catch (e) {
      console.error("Error in Step 3:", e);
      throw e;
    }

    return {
      success: true,
      message: "Upload successful",
      data: { id },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred during upload";
    console.error("Final Upload error:", errorMessage);
    return {
      success: false,
      error: `Error uploading file. Check logs for details. Cause: ${errorMessage}`,
    };
  }
}
