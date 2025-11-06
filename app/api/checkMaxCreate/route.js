import { NextResponse } from "next/server";
import { checkMaxCreate } from "../../campaigns/get_sequence";

export async function GET() {
  const seq_id = "132D4D45714905"; // ใส่ค่า test ตรงนี้
  const max_create = 0; // ใส่ค่า test ตรงนี้
  const result = await checkMaxCreate(seq_id, max_create,"TV Signage 43");
  return NextResponse.json(result);
}