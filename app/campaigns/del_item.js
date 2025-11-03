"use server";

import { checkStackItem } from "./get_sequence";

// อ่าน environment variables สำหรับ Basic Auth
const STACKS_USERNAME = process.env.STACKS_USERNAME;
const STACKS_PASSWORD = process.env.STACKS_PASSWORD;

// Server action สำหรับลบ item
export async function delItem(id_programmatic, seq_id, libraryId) {
  try {
    // ขั้นตอน 1: ใช้ checkStackItem เพื่อหาตำแหน่งและ type_programmatic
    console.log("libraryId", libraryId);
    const itemDetails = await checkStackItem(seq_id, id_programmatic);

    // ตรวจสอบว่าพบ item หรือไม่
    if (itemDetails.error) {
      return {
        success: false,
        error: itemDetails.error,
      };
    }

    // ถ้ามี libraryId ให้ลบข้อมูลในตาราง library ด้วย
    if (libraryId) {
      try {
        const { getAuthenticatedSupabaseClient } = await import('../lib/auth-actions');
        const supabase = await getAuthenticatedSupabaseClient();
        const { error } = await supabase
          .from('library')
          .delete()
          .eq('library_id', libraryId);

        if (error) {
          console.error('Error deleting library record:', error);
          // ยังคงดำเนินการลบ sequence ต่อไปแม้ลบ library record ไม่สำเร็จ
        }
      } catch (error) {
        console.error('Error in library record deletion:', error);
        // ยังคงดำเนินการลบ sequence ต่อไปแม้เกิดข้อผิดพลาด
      }
    }

    // ขั้นตอน 2: ตรวจสอบ type_programmatic
    if (itemDetails.type_programmatic && itemDetails.type_programmatic === "default") {
      throw new Error("Can not Delete Campaign Default");
    }

    // ขั้นตอน 3: ยิง DELETE API โดยใช้ stack และ item จากผลลัพธ์
    const { stack, item } = itemDetails;
    const DELETE_API_URL = `https://stacks.targetr.net/rest-api/v1/op/sequence/${seq_id}/${stack}/${item}`;

    if (!STACKS_USERNAME || !STACKS_PASSWORD) {
      return {
        success: false,
        error: "Error: Not found authentication data in environment variables",
      };
    }

    // Basic Auth
    const auth = Buffer.from(`${STACKS_USERNAME}:${STACKS_PASSWORD}`).toString("base64");

    const response = await fetch(DELETE_API_URL, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to delete item: ${response.status} ${response.statusText}`
      );
    }
    return {
      success: true,
      message: "Delete Successfull",
    };
  } catch (error) {
    console.error("Delete item error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error delete item",
    };
  }
}