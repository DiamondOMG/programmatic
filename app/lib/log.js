"use server";

import {
  getCurrentUser,
  getAuthenticatedSupabaseClient,
} from "./auth-actions.js";
/**
 * Fetches audit logs from Supabase
 * @returns {Promise<Array>} Array of audit log entries
 */
export async function getAuditLogs() {
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
      .from("audit_log")
      .select("*")
      .order("changed_at", { ascending: false });

    if (error) {
      console.error("Error fetching audit logs:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    throw new Error("Failed to fetch audit logs");
  }
}
