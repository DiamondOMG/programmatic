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
    // 📢 เพิ่ม Step ใน Error message
    throw new Error(
      "Step 3 (createLibraryRecord) failed: User not authenticated"
    );
  }

  const supabaseAuthenticated = await getAuthenticatedSupabaseClient();

  const { error, data } = await supabaseAuthenticated
    .from("sequence_users")
    .select("*")
    .eq("user_id", user.id);
  if (error) {
    // 📢 เพิ่ม Step ใน Error message
    throw new Error(
      `Step 3 (createLibraryRecord) failed: Supabase error: ${error.message}`
    );
  }

  return { success: true, data: data };
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
