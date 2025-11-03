"use server";

import { getCurrentUser, getAuthenticatedSupabaseClient } from "../lib/auth-actions";
import { checkStackItem } from "../campaigns/get_sequence";

// อ่าน environment variables สำหรับ Basic Auth
const STACKS_USERNAME = process.env.STACKS_USERNAME;
const STACKS_PASSWORD = process.env.STACKS_PASSWORD;

// ฟังก์ชันสร้าง modifiedMillis (Unix timestamp 13 หลัก)
function generateModifiedMillis() {
  return Date.now().toString();
}

// ฟังก์ชันอัปเดตข้อมูลในตาราง library (อัปเดตจาก library_id)
async function updateLibraryRecord(id, campaign_name, seq_id) {
  const { success: userSuccess, user } = await getCurrentUser();
  if (!userSuccess || !user) {
    throw new Error("Step 3 (updateLibraryRecord) failed: User not authenticated");
  }

  const supabaseAuthenticated = await getAuthenticatedSupabaseClient();
  const { error } = await supabaseAuthenticated
    .from("library")
    .update({ campaign_name, seq_id })
    .eq("library_id", id);

  if (error) {
    throw new Error(`Step 3 (updateLibraryRecord) failed: Supabase error: ${error.message}`);
  }

  return { success: true };
}

// Main server action สำหรับ update sequence
export async function updateCampaign(formData) {
  try {
    const libraryId = formData.get("libraryItemId");
    const startDateTime = formData.get("seq_startdate"); // รับเป็น UnixTime UTC แล้ว
    const endDateTime = formData.get("seq_enddate"); // รับเป็น UnixTime UTC แล้ว
    // const duration = formData.get("seq_duration");
    const duration = 15000;
    // 🔹 รับค่าจาก dropdown ใหม่
    const seq_condition =
      formData.get("seq_condition") || 'displayAspectRatio == "1920x1080"';
    const seq_form = formData.get("seq_form") || "TV Signage 43";
    const seq_label = formData.get("seq_label") || "";
    const seq_id = formData.get("seq_id") || "133DA4F113E159";
    const programmaticId = formData.get("programmaticId") || "";

    const checkCampaign = await checkStackItem(seq_id, programmaticId);
    if ( checkCampaign.stack === null || checkCampaign.item === null ) {
      return {
        success: false,
        error: "No Campaign Data for Update",
      };
    }else if ( checkCampaign.type_programmatic === "default") {
      return {
        success: false,
        error: "Cannot Update Default Campaign",
      };
    }

    // 🔹 ประกอบ URL แบบ dynamic ตามค่าที่เลือก
    const SEQUENCE_API_URL = `https://stacks.targetr.net/rest-api/v1/op/sequence/${seq_id}/${checkCampaign.stack}/${checkCampaign.item}`;

    if (!STACKS_USERNAME || !STACKS_PASSWORD) {
      return {
        success: false,
        error: "No Auth Data",
      };
    }
    const user = await getCurrentUser();
    console.log("user", user);
    // 🔹 สร้าง body สำหรับ PUT request
    const requestBody = {
      type: "libraryitem",
      id: libraryId,
      data: {
        modifiedMillis: generateModifiedMillis(),
        condition: seq_condition,
        label: seq_label,
        email_programmatic: user.user.email,
        id_programmatic: programmaticId,
        apiTest: "true",
        libraryItemId: libraryId,
        form_programmatic: seq_form,
      },
    };
    // เพิ่มค่า optional
    if (startDateTime) requestBody.data.startMillis = startDateTime;
    if (endDateTime && endDateTime !== "" && endDateTime !== "null")
      requestBody.data.endMillis = endDateTime;
    if (duration) requestBody.data.durationMillis = duration;

    // 🔹 Basic Auth
    const auth = Buffer.from(`${STACKS_USERNAME}:${STACKS_PASSWORD}`).toString(
      "base64"
    );
    console.log("requestBody", requestBody, "SEQUENCE_API_URL ",SEQUENCE_API_URL);
    // 🔹 ส่งคำขอ PUT ไปยัง API
    const response = await fetch(SEQUENCE_API_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to update sequence: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    
    // Trigger update to Supabase library record (non-blocking on failure)
    try {
      await updateLibraryRecord(libraryId, seq_label, seq_id);
    } catch (e) {
      console.warn("updateLibraryRecord failed:", e);
    }

    return {
      success: true,
      message: "Update Campaign Success",
      data: result,
    };
  } catch (error) {
    console.error("Update Campaign error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Update Campaign Error",
    };
  }
}
