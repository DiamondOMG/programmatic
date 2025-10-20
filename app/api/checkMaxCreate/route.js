import { NextResponse } from "next/server";
import { checkMaxCreate } from "../../campaigns/get_sequence";

export async function GET() {
  const seq_id = "133DA4F113E159"; // ใส่ค่า test ตรงนี้
  const max_create = 2; // ใส่ค่า test ตรงนี้
  const result = await checkMaxCreate(seq_id, max_create);
  return NextResponse.json(result);
}