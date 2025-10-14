"use server";
import {
  getCurrentUser,
  getAuthenticatedSupabaseClient,
} from "../lib/auth-actions.js";

// อ่าน environment variables สำหรับ Basic Auth
const STACKS_USERNAME = process.env.STACKS_USERNAME;
const STACKS_PASSWORD = process.env.STACKS_PASSWORD;

export async function getUserSequences() {
  const { success: userSuccess, user } = await getCurrentUser();
  if (!userSuccess || !user) {
    return { success: false, message: "User not authenticated" };
  }

  const supabase = await getAuthenticatedSupabaseClient();

  const { data, error } = await supabase
    .from("sequence_users")
    .select("seq_id, sequence(seq_name)");
  // .eq("user_id", user.id);

  if (error) {
    return { success: false, message: `Supabase error: ${error.message}` };
  }

  // ✅ แปลงผลลัพธ์ให้เป็น [{ seq_name: seq_id }]
  const formatted = data.map((row) => ({
    [row.sequence.seq_name]: row.seq_id,
  }));

  return { success: true, data: formatted };
}

export async function getSequenceById(seq_id) {
  const auth = Buffer.from(`${STACKS_USERNAME}:${STACKS_PASSWORD}`).toString(
    "base64"
  );
  const response = await fetch(
    "https://stacks.targetr.net/rest-api/v1/sequences/" + seq_id,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );
  const data = await response.json();
  const items = extractItems(data);
  return items;
}

function extractItems(data) {
  if (!data || !Array.isArray(data.stacks)) return [];

  return data.stacks.flatMap((stack) =>
    (stack.items || []).map((item) => {
      const thumbResource = item.resources?.find(
        (r) => r.data?.thumb === "true"
      );

      return {
        startMillis: item.data?.startMillis || null,
        condition: item.data?.condition || null,
        createdMillis: item.data?.createdMillis || null,
        modifiedMillis: item.data?.modifiedMillis || null,
        durationMillis: item.data?.durationMillis || null,
        label: item.data?.label || null,
        endMillis: item.data?.endMillis || null,
        libraryItemId: item.data?.libraryItemId || null,
        blobId: thumbResource?.data?.blobId || null,
      };
    })
  );
}

export async function get_sequence_all() {
  // ดึงข้อมูล sequences ทั้งหมดของ user
  const { success: userSuccess, data: sequences } = await getUserSequences();
  if (!userSuccess || !sequences) {
    return { success: false, message: "Failed to get user sequences" };
  }

  // เก็บผลลัพธ์ทั้งหมด
  const allItems = [];

  // วนลูปเรียก getSequenceById สำหรับแต่ละ sequence
  for (const sequence of sequences) {
    const [[seq_name, seq_id]] = Object.entries(sequence);

    try {
      const items = await getSequenceById(seq_id);
      if (items && items.length > 0) {
        // คำนวณ status สำหรับแต่ละ item ใน sequence นี้
        const itemsWithStatus = calculateStatusForItems(items, seq_name, seq_id);
        allItems.push(...itemsWithStatus);
      }
    } catch (error) {
      console.error(`Error getting sequence ${seq_id}:`, error);
      // อาจจะข้าม sequence ที่มีปัญหา หรือ return error
      continue;
    }
  }

  return {
    success: true,
    data: allItems,
    total_sequences: sequences.length,
    total_items: allItems.length
  };
}

function calculateStatusForItems(items, seqName, seqId) {
  const now = Date.now();

  // แยก items ที่มี startMillis และ endMillis ที่ถูกต้อง
  const validItems = items.filter(item => {
    const startMillis = (item.startMillis === null || item.startMillis === "null" || item.startMillis === undefined || item.startMillis === "" || isNaN(parseInt(item.startMillis)))
      ? null
      : parseInt(item.startMillis);
    const endMillis = (item.endMillis === null || item.endMillis === "null" || item.endMillis === undefined || item.endMillis === "")
      ? Infinity
      : parseInt(item.endMillis);

    return (item.startMillis === null || item.startMillis === "null" || item.startMillis === undefined || item.startMillis === "" || !isNaN(parseInt(item.startMillis))) &&
           (item.endMillis === null || item.endMillis === "null" || item.endMillis === undefined || item.endMillis === "" || !isNaN(endMillis));
  });

  // หา items ที่เป็น Running (ตัวแรกที่ startMillis < now < endMillis)
  const runningItems = validItems.filter(item => {
    const startMillis = (item.startMillis === null || item.startMillis === "null" || item.startMillis === undefined || item.startMillis === "" || isNaN(parseInt(item.startMillis)))
      ? null
      : parseInt(item.startMillis);
    const endMillis = (item.endMillis === null || item.endMillis === "null" || item.endMillis === undefined || item.endMillis === "")
      ? Infinity
      : parseInt(item.endMillis);

    return startMillis !== null && startMillis < now && now < endMillis;
  });

  // หา items ที่เป็น Schedule
  const scheduleItems = validItems.filter(item => {
    const startMillis = (item.startMillis === null || item.startMillis === "null" || item.startMillis === undefined || item.startMillis === "" || isNaN(parseInt(item.startMillis)))
      ? null
      : parseInt(item.startMillis);
    const endMillis = (item.endMillis === null || item.endMillis === "null" || item.endMillis === undefined || item.endMillis === "")
      ? Infinity
      : parseInt(item.endMillis);

    return (startMillis === null && endMillis !== Infinity && endMillis >= now) || // ไม่มี start แต่ยังไม่สิ้นสุด
           (startMillis !== null && now < startMillis && startMillis < endMillis) || // ยังไม่เริ่ม
           (startMillis !== null && startMillis < now && now < endMillis && !runningItems.some(running => running.libraryItemId === item.libraryItemId)); // กำลังรันแต่ไม่ใช่ตัวแรก
  });

  // หา items ที่เป็น Complete
  const completeItems = validItems.filter(item => {
    const startMillis = (item.startMillis === null || item.startMillis === "null" || item.startMillis === undefined || item.startMillis === "" || isNaN(parseInt(item.startMillis)))
      ? null
      : parseInt(item.startMillis);
    const endMillis = (item.endMillis === null || item.endMillis === "null" || item.endMillis === undefined || item.endMillis === "")
      ? Infinity
      : parseInt(item.endMillis);

    return (startMillis !== null && startMillis < endMillis && endMillis < now) || // จบแล้วตามปกติ
           (startMillis === null && endMillis !== Infinity && endMillis < now); // ไม่มี start แต่จบแล้ว
  });

  return items.map(item => {
    const startMillis = (item.startMillis === null || item.startMillis === "null" || item.startMillis === undefined || item.startMillis === "" || isNaN(parseInt(item.startMillis)))
      ? null  // ถ้าไม่มี startMillis ให้เป็น null แทน now
      : parseInt(item.startMillis);
    const endMillis = (item.endMillis === null || item.endMillis === "null" || item.endMillis === undefined || item.endMillis === "")
      ? Infinity
      : parseInt(item.endMillis);

    // กำหนด status ตามเงื่อนไข
    let status = "Unknown";

    if ((item.startMillis === null || item.startMillis === "null" || item.startMillis === undefined || item.startMillis === "" || !isNaN(parseInt(item.startMillis))) &&
        (item.endMillis === null || item.endMillis === "null" || item.endMillis === undefined || item.endMillis === "" || !isNaN(endMillis))) {

      // กรณีที่ไม่มี startMillis (เป็น null หรือไม่มีค่า)
      if (startMillis === null) {
        if (endMillis === Infinity) {
          status = "Schedule"; // ไม่มีกำหนดสิ้นสุด ถือว่าเป็น Schedule
        } else if (endMillis < now) {
          status = "Complete"; // สิ้นสุดไปแล้ว ถือว่า Complete
        } else {
          status = "Schedule"; // ยังไม่สิ้นสุด ถือว่า Schedule
        }
      } else {
        // กรณีที่มี startMillis ตามปกติ
        if (startMillis < now && now < endMillis) {
          // ตรวจสอบว่าเป็นตัวแรกใน seqName หรือไม่
          const isFirstRunning = runningItems.length > 0 &&
                                runningItems[0].libraryItemId === item.libraryItemId;
          status = isFirstRunning ? "Running" : "Schedule";
        } else if (now < startMillis && startMillis < endMillis) {
          status = "Schedule";
        } else if (startMillis < endMillis && endMillis < now) {
          status = "Complete";
        }
      }
    }

    return {
      ...item,
      seq_name: seqName,
      seq_id: seqId,
      status: status
    };
  });
}
