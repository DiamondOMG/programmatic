import { NextResponse } from "next/server";
import { checkStackItem } from "../../campaigns/get_sequence";

export async function GET() {
  const seq_id = "133DA4F113E159"; // ใส่ค่า test ตรงนี้
  const id_programmatic = "3c8ca0c0-e1cf-4d07-9d81-fa786c2f3bf5"; // ใส่ค่า test ตรงนี้
  const items = await checkStackItem(seq_id, id_programmatic);
  return NextResponse.json(items);
}
