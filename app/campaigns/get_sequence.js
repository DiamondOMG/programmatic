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
    .select("seq_id, sequence(seq_name)")
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
