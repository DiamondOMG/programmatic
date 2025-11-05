"use server";

import {
  getCurrentUser,
  getAuthenticatedSupabaseClient,
} from "./auth-actions.js";
/**
 * Fetches sequence from Supabase
 * @returns {Promise<Array>} Array of sequence entries
 */
export async function getFormat() {
  try {
    const { success: userSuccess, user } = await getCurrentUser();
    if (!userSuccess || !user) {
      // 📢 เพิ่ม Step ใน Error message
      throw new Error(
        "Step 3 (createLibraryRecord) failed: User not authenticated"
      );
    }
    const supabaseAuthenticated = await getAuthenticatedSupabaseClient();
    const { data, error } = await supabaseAuthenticated
      .from("format")
      .select("*")
      .order("format", { ascending: true });

    if (error) {
      console.error("Error fetching format:", error);
      throw error;
    }

    return data || [];
// [
//     {
//         "form_id": "eed616e1-b5af-43b2-a87a-eb63899c1adb",
//         "created_at": "2025-11-04T10:26:30.901773+00:00",
//         "format": "TV Signage 43",
//         "width": 1920,
//         "height": 1080,
//         "condition": "displayAspectRatio == \"1920x1080\"",
//         "retailer": "TopsDigital"
//     },
//     {
//         "form_id": "7b8122e3-7c44-487c-ba18-e7d738a8ec06",
//         "created_at": "2025-11-05T02:54:37.045832+00:00",
//         "format": "TV Signage 55",
//         "width": 1920,
//         "height": 1080,
//         "condition": "displayAspectRatio == \"1920x1080\" && AssetTypeId == \"AS0120\"",
//         "retailer": "TopsDigital"
//     },
//     {
//         "form_id": "823e8b28-ed02-44b9-940f-da362b092323",
//         "created_at": "2025-11-05T07:34:28.316954+00:00",
//         "format": "Kiosk 43",
//         "width": 1080,
//         "height": 1920,
//         "condition": "displayAspectRatio == \"1080x1920\" && AssetTypeId == \"AS0119\"",
//         "retailer": "TopsDigital"
//     },
//     {
//         "form_id": "f649b6d6-1d60-4ddb-a834-a23db720c8c9",
//         "created_at": "2025-11-05T07:35:23.35861+00:00",
//         "format": "Kiosk 55",
//         "width": 1080,
//         "height": 1920,
//         "condition": "displayAspectRatio == \"1080x1920\" && AssetTypeId == \"AS0120\"",
//         "retailer": "TopsDigital"
//     },
//     {
//         "form_id": "0181f2e1-62c2-4a99-bf3a-e61a6eae90aa",
//         "created_at": "2025-11-05T07:35:54.654133+00:00",
//         "format": "Category Signage",
//         "width": 1920,
//         "height": 540,
//         "condition": "displayAspectRatio == \"1920x540\" && AssetTypeId == \"AS0066\"",
//         "retailer": "TopsDigital"
//     },
//     {
//         "form_id": "c902c7f2-d851-4ba0-9b49-b87c20747ec0",
//         "created_at": "2025-11-05T07:36:19.734033+00:00",
//         "format": "Pillar Signage",
//         "width": 1080,
//         "height": 1920,
//         "condition": "displayAspectRatio == \"1080x1920\" && AssetTypeId == \"AS0066\"",
//         "retailer": "TopsDigital"
//     }
// ]
  } catch (error) {
    console.error("Failed to fetch format:", error);
    throw new Error("Failed to fetch format");
  }
}

/**
 * Creates a new sequence
 * @param {Object} sequenceData - The sequence data to create
 * @returns {Promise<Object>} The created sequence
 */
export async function createFormat(formatData) {
  try {
    const { success: userSuccess, user } = await getCurrentUser();
    if (!userSuccess || !user) {
      throw new Error("User not authenticated");
    }

    const supabaseAuthenticated = await getAuthenticatedSupabaseClient();
    const { data, error } = await supabaseAuthenticated
      .from("format")
      .insert([{
        ...formatData,
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating format:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to create format:", error);
    throw new Error("Failed to create format");
  }
}

/**
 * Updates an existing sequence
 * @param {string} seqId - The ID of the sequence to update
 * @param {Object} sequenceData - The updated sequence data
 * @returns {Promise<Object>} The updated sequence
 */
export async function updateFormat(form_id, formatData) {
  try {
    const { success: userSuccess, user } = await getCurrentUser();
    if (!userSuccess || !user) {
      throw new Error("User not authenticated");
    }

    const supabaseAuthenticated = await getAuthenticatedSupabaseClient();
    const { data, error } = await supabaseAuthenticated
      .from("format")
      .update(formatData)
      .eq("form_id", form_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating format:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to update format:", error);
    throw new Error("Failed to update format");
  }
}

/**
 * Deletes a sequence
 * @param {string} form_id - The ID of the sequence to delete
 * @returns {Promise<boolean>} True if deletion was successful
 */
export async function deleteFormat(form_id) {
  try {
    const { success: userSuccess, user } = await getCurrentUser();
    if (!userSuccess || !user) {
      throw new Error("User not authenticated");
    }

    const supabaseAuthenticated = await getAuthenticatedSupabaseClient();
    const { error } = await supabaseAuthenticated
      .from("format")
      .delete()
      .eq("form_id", form_id);

    if (error) {
      console.error("Error deleting format:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Failed to delete format:", error);
    throw new Error("Failed to delete format");
  }
}
