"use server";

import {
  getCurrentUser,
  getAuthenticatedSupabaseClient,
} from "../lib/auth-actions.js";

const STACKS_USERNAME = process.env.STACKS_USERNAME;
const STACKS_PASSWORD = process.env.STACKS_PASSWORD;

// ✅ helper แปลงค่าเป็น millis (หรือ fallback)
function toMillis(value, fallback = null) {
  if (
    value === null ||
    value === "null" ||
    value === undefined ||
    value === "" ||
    isNaN(parseInt(value))
  ) {
    return fallback;
  }
  return parseInt(value);
}

// ✅ ดึง sequences ของ user
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

  if (error)
    return { success: false, message: `Supabase error: ${error.message}` };

  const formatted = data.map((row) => ({
    [row.sequence.seq_name]: row.seq_id,
  }));

  return { success: true, data: formatted };
}

// ✅ ดึงข้อมูล sequence จาก Stacks API
export async function getSequenceById(seq_id) {
  const auth = Buffer.from(`${STACKS_USERNAME}:${STACKS_PASSWORD}`).toString(
    "base64"
  );

  const response = await fetch(
    `https://stacks.targetr.net/rest-api/v1/sequences/${seq_id}`,
    { headers: { Authorization: `Basic ${auth}` } }
  );

  const data = await response.json();
  return extractItems(data);
}

// ✅ ดึงข้อมูล items จาก stacks
function extractItems(data) {
  if (!data || !Array.isArray(data.stacks)) return [];

  return data.stacks.flatMap((stack) =>
    (stack.items || []).map((item) => {
      const thumbResource = item.resources?.find(
        (r) => r.data?.thumb === "true"
      );
      const d = item.data || {};

      return {
        startMillis: d.startMillis || null,
        endMillis: d.endMillis || null,
        durationMillis: d.durationMillis || null,
        createdMillis: d.createdMillis || null,
        modifiedMillis: d.modifiedMillis || null,
        condition: d.condition || null,
        label: d.label || null,
        libraryItemId: d.libraryItemId || null,
        blobId: thumbResource?.data?.blobId || null,
        email: d.email_programmatic || null,
      };
    })
  );
}

// ✅ รวมทุก sequence ของ user และเพิ่ม status
export async function get_sequence_all() {
  const { success, data: sequences } = await getUserSequences();
  if (!success || !sequences)
    return { success: false, message: "Failed to get user sequences" };

  const allItems = [];

  for (const sequence of sequences) {
    const [[seq_name, seq_id]] = Object.entries(sequence);
    try {
      const items = await getSequenceById(seq_id);
      if (items?.length) {
        allItems.push(...calculateStatusForItems(items, seq_name, seq_id));
      }
    } catch (error) {
      console.error(`Error getting sequence ${seq_id}:`, error);
    }
  }

  return {
    success: true,
    data: allItems,
    total_sequences: sequences.length,
    total_items: allItems.length,
  };
}

// ✅ คำนวณสถานะของแต่ละ item
function calculateStatusForItems(items, seqName, seqId) {
  const now = Date.now();

  const validItems = items.filter((item) => {
    const startMillis = toMillis(item.startMillis);
    const endMillis = toMillis(item.endMillis, Infinity);
    return (
      (startMillis !== null || item.startMillis === null) &&
      (endMillis !== null || item.endMillis === null)
    );
  });

  const runningItems = validItems.filter((item) => {
    const startMillis = toMillis(item.startMillis);
    const endMillis = toMillis(item.endMillis, Infinity);
    return startMillis !== null && startMillis < now && now < endMillis;
  });

  return items.map((item) => {
    const startMillis = toMillis(item.startMillis);
    const endMillis = toMillis(item.endMillis, Infinity);
    let status = "Unknown";

    if (startMillis === null) {
      if (endMillis === Infinity) status = "Schedule";
      else if (endMillis < now) status = "Complete";
      else status = "Schedule";
    } else {
      if (startMillis < now && now < endMillis) {
        const isFirstRunning =
          runningItems[0]?.libraryItemId === item.libraryItemId;
        status = isFirstRunning ? "Running" : "Schedule";
      } else if (now < startMillis && startMillis < endMillis) {
        status = "Schedule";
      } else if (startMillis < endMillis && endMillis < now) {
        status = "Complete";
      }
    }

    return { ...item, seq_name: seqName, seq_id: seqId, status };
  });
}
