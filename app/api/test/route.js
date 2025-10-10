import { NextResponse } from "next/server";
import { getSequenceById } from "../../campaigns/get_sequence";

export async function GET() {
  const seq_id = "1357E6072D53EE"; // ใส่ค่า test ตรงนี้
  const items = await getSequenceById(seq_id);
  return NextResponse.json(items);
}
