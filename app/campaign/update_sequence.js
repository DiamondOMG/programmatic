"use server";

// อ่าน environment variables สำหรับ Basic Auth
const STACKS_USERNAME = process.env.STACKS_USERNAME;
const STACKS_PASSWORD = process.env.STACKS_PASSWORD;

// ฟังก์ชันสร้าง modifiedMillis (Unix timestamp 13 หลัก)
function generateModifiedMillis() {
  return Date.now().toString();
}

// Main server action สำหรับ update sequence
export async function updateSequence(formData) {
  try {
    const libraryId = formData.get("libraryId");
    const startDateTime = formData.get("seq_startdate"); // รับเป็น UnixTime UTC แล้ว
    const endDateTime = formData.get("seq_enddate"); // รับเป็น UnixTime UTC แล้ว
    const duration = formData.get("seq_duration");

    // 🔹 รับค่าจาก dropdown ใหม่
    const seq_condition = formData.get("seq_condition") || "displayAspectRatio == \"1920x1080\"";
    const seq_slot = formData.get("seq_slot") || "1";
    const seq_item = formData.get("seq_item") || "1";
    const seq_label = formData.get("seq_label") || "";

    // ดึง prefix ตาม type ถ้าไม่เจอใช้ค่า default
    const prefix = "13DA9DDD7E8E70";

    // 🔹 ประกอบ URL แบบ dynamic ตามค่าที่เลือก
    const SEQUENCE_API_URL = `https://stacks.targetr.net/rest-api/v1/op/sequence/${prefix}/${seq_slot}/${seq_item}`;

    if (!STACKS_USERNAME || !STACKS_PASSWORD) {
      return {
        success: false,
        error: "ไม่พบข้อมูลการยืนยันตัวตนใน environment variables",
      };
    }

    // 🔹 สร้าง body สำหรับ PUT request
    const requestBody = {
      type: "libraryitem",
      id: libraryId,
      data: {
        modifiedMillis: generateModifiedMillis(),
        condition: seq_condition,
        label:seq_label
      },
    };

    // เพิ่มค่า optional
    if (startDateTime) requestBody.data.startMillis = startDateTime;
    if (endDateTime) requestBody.data.endMillis = endDateTime;
    if (duration) requestBody.data.durationMillis = duration;

    // 🔹 Basic Auth
    const auth = Buffer.from(`${STACKS_USERNAME}:${STACKS_PASSWORD}`).toString(
      "base64"
    );
    console.log("requestBody", requestBody, SEQUENCE_API_URL);
    // 🔹 ส่งคำขอ PUT ไปยัง API
    const response = await fetch(SEQUENCE_API_URL, {
      method: "POST",
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

    return {
      success: true,
      message: "อัปเดต sequence สำเร็จ",
      data: result,
    };
  } catch (error) {
    console.error("Update sequence error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการอัปเดต sequence",
    };
  }
}
