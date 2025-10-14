import { NextResponse } from "next/server";
import { get_sequence_all } from "../../campaigns/get_sequence";

export async function GET() {
  const items = await get_sequence_all();
  return NextResponse.json(items);
}
