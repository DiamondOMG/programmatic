import { NextResponse } from "next/server";
import { checkSequence } from "../../campaigns/get_sequence";

export async function GET() {
  const seq_id = "132D4D45714905"; // ใส่ค่า test ตรงนี้
  const items = await checkSequence(seq_id);
  return NextResponse.json(items);
}
