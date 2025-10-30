import { NextResponse } from "next/server";
import { get_sequence_all_2 } from "../../campaigns/get_sequence.js";

export async function GET() {
  const result = await get_sequence_all_2();
  return NextResponse.json(result);
}
