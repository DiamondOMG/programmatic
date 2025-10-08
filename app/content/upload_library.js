"use server";

import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "../lib/auth-actions.js";
import { cookies } from "next/headers"; // <--- เพิ่มตัวนี้

// อ่าน environment variables สำหรับ Basic Auth
const STACKS_USERNAME = process.env.STACKS_USERNAME;
const STACKS_PASSWORD = process.env.STACKS_PASSWORD;

// ใช้ Supabase client เดียวกับ auth-actions.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
async function getAuthenticatedSupabaseClient() {
  const cookieStore = await cookies(); // 👈 แก้ตรงนี้: AWAIT cookies()
  const accessToken = cookieStore.get("access_token")?.value;

  // สร้าง Client ที่ฉีด JWT จากคุกกี้เข้าไปใน Header
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
      },
    },
  });
}

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
async function createLibraryItem(label) {
  const pendingId = generatePendingId();
  const createdMillis = generateCreatedMillis();

  const requestBody = {
    type: "libraryitem",
    data: {
      label: label,
      apiTest: "true",
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
    throw new Error(
      `Failed to create library item: ${response.status} ${response.statusText}`
    );
  }

  const result = await response.json();
  return {
    id: result.id,
    pendingId: pendingId,
  };
}

// API 2: Upload ไฟล์
async function uploadFile(file, itemId, pendingId, fileName) {
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const auth = Buffer.from(`${STACKS_USERNAME}:${STACKS_PASSWORD}`).toString(
    "base64"
  );

  const response = await fetch("https://stacks.targetr.net/upload", {
    method: "POST",
    headers: {
      "X-UploadType": "raw",
      "X-FileName": fileName,
      "X-ItemType": "libraryitem",
      "Content-Type": "content/unknown",
      "X-PendingId": pendingId,
      "X-ItemId": itemId,
      Authorization: `Basic ${auth}`,
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to upload file: ${response.status} ${response.statusText}`
    );
  }

  return response;
}

// ฟังก์ชันบันทึกข้อมูลลง library table (ใช้ getCurrentUser จาก auth-actions.js)
// ฟังก์ชันบันทึกข้อมูลลง library table
async function createLibraryRecord(id, pendingId) {
  const { success: userSuccess, user } = await getCurrentUser();
  if (!userSuccess || !user) {
    throw new Error("User not authenticated");
  }

  // 👈 แก้ตรงนี้: AWAIT การสร้าง Client
  const supabaseAuthenticated = await getAuthenticatedSupabaseClient();

  const { error } = await supabaseAuthenticated.from("library").insert({
    id: id,
    pending_id: pendingId,
    user_id: user.id,
    created: new Date().toISOString(),
  });

  if (error) {
    // **ส่วนนี้ไม่ควรติดแล้ว**
    throw new Error(`Failed to create library record: ${error.message}`);
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

    // Step 1: สร้าง library item
    const { id, pendingId } = await createLibraryItem(label);

    // Step 2: Upload ไฟล์
    await uploadFile(file, id, pendingId, file.name);

    // Step 3: บันทึกข้อมูลลง library table
    await createLibraryRecord(id, pendingId);

    return {
      success: true,
      message: "Upload successful",
      data: { id },
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error uploading file",
    };
  }
}
