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
    const startDateTime = formData.get("startDateTime"); // รับเป็น UnixTime UTC แล้ว
    const endDateTime = formData.get("endDateTime"); // รับเป็น UnixTime UTC แล้ว
    const duration = formData.get("duration");

    // 🔹 รับค่าจาก dropdown ใหม่
    const type = formData.get("type") || "Landscape";
    const contentOrder = formData.get("contentOrder") || "2";
    const slotOrder = formData.get("slotOrder") || "1";

    // 🔹 แปลง type เป็น prefix id
    const prefix = type === "Portrait" ? "13DA9DDD7E8E70" : "13653C81488E4C";

    // 🔹 ประกอบ URL แบบ dynamic ตามค่าที่เลือก
    const SEQUENCE_API_URL = `https://stacks.targetr.net/rest-api/v1/op/sequence/${prefix}/${contentOrder}/${slotOrder}`;

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
