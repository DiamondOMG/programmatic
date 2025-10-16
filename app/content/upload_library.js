"use server";

import {
  getCurrentUser,
  getAuthenticatedSupabaseClient,
} from "../lib/auth-actions.js";

// อ่าน environment variables สำหรับ Basic Auth
const STACKS_USERNAME = process.env.STACKS_USERNAME;
const STACKS_PASSWORD = process.env.STACKS_PASSWORD;

// ฟังก์ชันสร้าง pendingId (เลขสุ่ม + timestamp)
function generatePendingId() {
  const randomNum = Math.floor(Math.random() * 1000000000);
  const timestamp = Date.now();
  return `${randomNum}${timestamp}`;
}

function generateCreatedMillis() {
  return Date.now().toString();
}

// API 1: สร้าง library item
export async function createLibraryItem(label) {
  const pendingId = generatePendingId();
  const createdMillis = generateCreatedMillis();

  const requestBody = {
    type: "libraryitem",
    data: {
      label: label,
      apiTest: "true",
      transitionShader: "none",
    },
    resources: [
      {
        type: "pending",
        data: {
          pendingId: pendingId,
          createdMillis: createdMillis,
        },
      },
    ],
  };

  const auth = Buffer.from(`${STACKS_USERNAME}:${STACKS_PASSWORD}`).toString(
    "base64"
  );

  const response = await fetch(
    "https://stacks.targetr.net/rest-api/v1/libraryitems",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    // 📢 เพิ่ม Step ใน Error message
    const errorDetails = await response.text();
    throw new Error(
      `Step 1 (createLibraryItem) failed: ${response.status} ${response.statusText}. Details: ${errorDetails}`
    );
  }

  const result = await response.json();
  return {
    id: result.id,
    pendingId: pendingId,
  };
}

// API 2: Upload ไฟล์
export async function uploadFile(file, itemId, pendingId, fileName) {
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  // const auth = Buffer.from(`${STACKS_USERNAME}:${STACKS_PASSWORD}`).toString(
  //   "base64"
  // );

  const response = await fetch("https://stacks.targetr.net/upload", {
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
    // 📢 เพิ่ม Step ใน Error message
    const errorDetails = await response.text();
    throw new Error(
      `Step 2 (uploadFile) failed: ${response.status} ${response.statusText}. Details: ${errorDetails}`
    );
  }

  return response;
}

// ฟังก์ชันบันทึกข้อมูลลง library table
export async function createLibraryRecord(id, pendingId) {
  const { success: userSuccess, user } = await getCurrentUser();
  if (!userSuccess || !user) {
    // 📢 เพิ่ม Step ใน Error message
    throw new Error(
      "Step 3 (createLibraryRecord) failed: User not authenticated"
    );
  }

  const supabaseAuthenticated = await getAuthenticatedSupabaseClient();

  const { error } = await supabaseAuthenticated.from("library").insert({
    library_id: id,
    pending_id: pendingId,
    user_id: user.id,
    created: new Date().toISOString(),
  });

  if (error) {
    // 📢 เพิ่ม Step ใน Error message
    throw new Error(
      `Step 3 (createLibraryRecord) failed: Supabase error: ${error.message}`
    );
  }

  return { success: true };
}

// Main server action
export async function uploadAsset(formData) {
  try {
    const label = formData.get("label");
    const file = formData.get("file");

    if (!label || !file) {
      return { success: false, error: "Please fill in label and select file" };
    }

    if (!STACKS_USERNAME || !STACKS_PASSWORD) {
      return {
        success: false,
        error: "Authentication credentials not found in environment variables",
      };
    }

    let id, pendingId;

    // Step 1: สร้าง library item
    try {
      console.log("Starting Step 1: createLibraryItem");
      const result = await createLibraryItem(label);
      id = result.id;
      pendingId = result.pendingId;
      console.log(`Step 1 success. Item ID: ${id}, Pending ID: ${pendingId}`);
    } catch (e) {
      // 🚨 จับ error เฉพาะ Step 1
      console.error("Error in Step 1:", e);
      // Re-throw เพื่อให้ไปเข้า catch ใหญ่
      throw e;
    }

    // Step 2: Upload ไฟล์
    try {
      console.log("Starting Step 2: uploadFile");
      await uploadFile(file, id, pendingId, file.name);
      console.log("Step 2 success. File uploaded.");
    } catch (e) {
      // 🚨 จับ error เฉพาะ Step 2
      console.error("Error in Step 2:", e);
      // Re-throw เพื่อให้ไปเข้า catch ใหญ่
      throw e;
    }

    // Step 3: บันทึกข้อมูลลง library table
    try {
      console.log("Starting Step 3: createLibraryRecord");
      await createLibraryRecord(id, pendingId);
      console.log("Step 3 success. Record saved to Supabase.");
    } catch (e) {
      // 🚨 จับ error เฉพาะ Step 3
      console.error("Error in Step 3:", e);
      // Re-throw เพื่อให้ไปเข้า catch ใหญ่
      throw e;
    }

    return {
      success: true,
      message: "Upload successful",
      data: { id },
    };
  } catch (error) {
    // 🔍 แสดงข้อความ Error ที่รวมถึง Step ที่ผิดพลาด
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred during upload";
    console.error("Final Upload error:", errorMessage);
    return {
      success: false,
      // 💡 ส่ง Error message ที่ระบุ Step กลับไปยัง client
      error: `Error uploading file. Check logs for details. Cause: ${errorMessage}`,
    };
  }
}
