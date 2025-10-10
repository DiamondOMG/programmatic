import { NextResponse } from "next/server";
import { getUserSequences } from "../../campaigns/get_sequence";

export async function GET() {
  const items = await getUserSequences();
  return NextResponse.json(items);
}
