"use server";

import {
  getCurrentUser,
  getAuthenticatedSupabaseClient,
} from "../lib/auth-actions.js";

// Environment variables for Basic Auth
const STACKS_USERNAME = process.env.STACKS_USERNAME;
const STACKS_PASSWORD = process.env.STACKS_PASSWORD;

// Utility function to parse milliseconds safely
function parseMillis(value) {
  if (
    value === null ||
    value === "null" ||
    value === undefined ||
    value === "" ||
    isNaN(parseInt(value))
  ) {
    return null;
  }
  return parseInt(value);
}

// Fetch user sequences from Supabase
export async function getUserSequences() {
  const { success: userSuccess, user } = await getCurrentUser();
  if (!userSuccess || !user) {
    return { success: false, message: "User not authenticated" };
  }

  const supabase = await getAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("sequence_users")
    .select("seq_id, sequence(seq_name)");

  if (error) {
    return { success: false, message: `Supabase error: ${error.message}` };
  }

  const formatted = data.map((row) => ({
    [row.sequence.seq_name]: row.seq_id,
  }));

  return { success: true, data: formatted };
}

// Fetch sequence details by ID from external API
export async function getSequenceById(seq_id) {
  const auth = Buffer.from(`${STACKS_USERNAME}:${STACKS_PASSWORD}`).toString(
    "base64"
  );
  try {
    const response = await fetch(
      `https://stacks.targetr.net/rest-api/v1/sequences/${seq_id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    return extractItems(data);
  } catch (error) {
    console.error(`Error fetching sequence ${seq_id}:`, error);
    return [];
  }
}

// Extract items from API response
function extractItems(data) {
  if (!data || !Array.isArray(data.stacks)) {
    return [];
  }

  return data.stacks.flatMap((stack) =>
    (stack.items || []).map((item) => {
      const thumbResource = item.resources?.find(
        (r) => r.data?.thumb === "true"
      );
      return {
        startMillis: parseMillis(item.data?.startMillis),
        condition: item.data?.condition || null,
        createdMillis: parseMillis(item.data?.createdMillis),
        modifiedMillis: parseMillis(item.data?.modifiedMillis),
        durationMillis: parseMillis(item.data?.durationMillis),
        label: item.data?.label || null,
        endMillis: parseMillis(item.data?.endMillis),
        libraryItemId: item.data?.libraryItemId || null,
        blobId: thumbResource?.data?.blobId || null,
      };
    })
  );
}

// Calculate status for sequence items
function calculateStatusForItems(items, seqName, seqId) {
  const now = Date.now();

  return items.map((item) => {
    const startMillis = parseMillis(item.startMillis);
    const endMillis = parseMillis(item.endMillis) ?? Infinity;

    let status = "Unknown";

    if (startMillis === null) {
      status =
        endMillis === Infinity
          ? "Schedule"
          : endMillis < now
          ? "Complete"
          : "Schedule";
    } else {
      if (startMillis < now && now < endMillis) {
        const isFirstRunning = items.some(
          (other) =>
            parseMillis(other.startMillis) < now &&
            now < (parseMillis(other.endMillis) ?? Infinity) &&
            other.libraryItemId === item.libraryItemId
        );
        status = isFirstRunning ? "Running" : "Schedule";
      } else if (now < startMillis && startMillis < endMillis) {
        status = "Schedule";
      } else if (startMillis < endMillis && endMillis < now) {
        status = "Complete";
      }
    }

    return {
      ...item,
      seq_name: seqName,
      seq_id: seqId,
      status,
    };
  });
}

// Fetch all sequences and their items
export async function get_sequence_all() {
  const { success: userSuccess, data: sequences } = await getUserSequences();
  if (!userSuccess || !sequences) {
    return { success: false, message: "Failed to get user sequences" };
  }

  const allItems = [];

  for (const sequence of sequences) {
    const [[seq_name, seq_id]] = Object.entries(sequence);
    const items = await getSequenceById(seq_id);
    if (items.length > 0) {
      const itemsWithStatus = calculateStatusForItems(items, seq_name, seq_id);
      allItems.push(...itemsWithStatus);
    }
  }

  return {
    success: true,
    data: allItems,
    total_sequences: sequences.length,
    total_items: allItems.length,
  };
}
