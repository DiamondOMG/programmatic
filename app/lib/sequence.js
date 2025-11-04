"use server";

import {
  getCurrentUser,
  getAuthenticatedSupabaseClient,
} from "./auth-actions.js";
/**
 * Fetches sequence from Supabase
 * @returns {Promise<Array>} Array of sequence entries
 */
export async function getSequence() {
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
      .from("sequence")
      .select("*")
      .order("seq_name", { ascending: true });

    if (error) {
      console.error("Error fetching sequence:", error);
      throw error;
    }

    return data || [];
//     [
//     {
//         "seq_id": "1314CF47CE209F",
//         "created_at": "2025-10-10T08:44:21.780149+00:00",
//         "seq_name": "Spot #2",
//         "retailer": "TopsDigital"
//     },
//     {
//         "seq_id": "132D4D45714905",
//         "created_at": "2025-10-10T08:46:52.95341+00:00",
//         "seq_name": "Spot #6",
//         "retailer": "TopsDigital"
//     },
//     {
//         "seq_id": "132E3FF1F22F64",
//         "created_at": "2025-10-10T08:45:29+00:00",
//         "seq_name": "Spot #4",
//         "retailer": "TopsDigital"
//     },
//     {
//         "seq_id": "133DA4F113E159",
//         "created_at": "2025-10-10T08:43:39+00:00",
//         "seq_name": "Spot #1",
//         "retailer": "TopsDigital"
//     },
//     {
//         "seq_id": "1357E6072D53EE",
//         "created_at": "2025-10-10T08:48:29.564014+00:00",
//         "seq_name": "Spot #8",
//         "retailer": "TopsDigital"
//     },
//     {
//         "seq_id": "1386EC1F116465",
//         "created_at": "2025-10-10T08:44:48.820249+00:00",
//         "seq_name": "Spot #3",
//         "retailer": "TopsDigital"
//     },
//     {
//         "seq_id": "138733B8D76106",
//         "created_at": "2025-10-10T08:47:40.106936+00:00",
//         "seq_name": "Spot #5",
//         "retailer": "TopsDigital"
//     },
//     {
//         "seq_id": "13DCAB3612C400",
//         "created_at": "2025-10-10T08:48:14.067099+00:00",
//         "seq_name": "Spot #7",
//         "retailer": "TopsDigital"
//     }
// ]
  } catch (error) {
    console.error("Failed to fetch sequence:", error);
    throw new Error("Failed to fetch sequence");
  }
}

/**
 * Creates a new sequence
 * @param {Object} sequenceData - The sequence data to create
 * @returns {Promise<Object>} The created sequence
 */
export async function createSequence(sequenceData) {
  try {
    const { success: userSuccess, user } = await getCurrentUser();
    if (!userSuccess || !user) {
      throw new Error("User not authenticated");
    }

    const supabaseAuthenticated = await getAuthenticatedSupabaseClient();
    const { data, error } = await supabaseAuthenticated
      .from("sequence")
      .insert([{
        ...sequenceData,
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating sequence:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to create sequence:", error);
    throw new Error("Failed to create sequence");
  }
}

/**
 * Updates an existing sequence
 * @param {string} seqId - The ID of the sequence to update
 * @param {Object} sequenceData - The updated sequence data
 * @returns {Promise<Object>} The updated sequence
 */
export async function updateSequence(seqId, sequenceData) {
  try {
    const { success: userSuccess, user } = await getCurrentUser();
    if (!userSuccess || !user) {
      throw new Error("User not authenticated");
    }

    const supabaseAuthenticated = await getAuthenticatedSupabaseClient();
    const { data, error } = await supabaseAuthenticated
      .from("sequence")
      .update(sequenceData)
      .eq("seq_id", seqId)
      .select()
      .single();

    if (error) {
      console.error("Error updating sequence:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to update sequence:", error);
    throw new Error("Failed to update sequence");
  }
}

/**
 * Deletes a sequence
 * @param {string} seqId - The ID of the sequence to delete
 * @returns {Promise<boolean>} True if deletion was successful
 */
export async function deleteSequence(seqId) {
  try {
    const { success: userSuccess, user } = await getCurrentUser();
    if (!userSuccess || !user) {
      throw new Error("User not authenticated");
    }

    const supabaseAuthenticated = await getAuthenticatedSupabaseClient();
    const { error } = await supabaseAuthenticated
      .from("sequence")
      .delete()
      .eq("seq_id", seqId);

    if (error) {
      console.error("Error deleting sequence:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Failed to delete sequence:", error);
    throw new Error("Failed to delete sequence");
  }
}
