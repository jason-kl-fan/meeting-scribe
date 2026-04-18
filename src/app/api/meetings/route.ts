import { NextResponse } from "next/server";
import { listMeetings } from "@/lib/meeting-db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const meetings = await listMeetings();
    return NextResponse.json({ meetings });
  } catch (error) {
    return NextResponse.json(
      {
        error: "讀取會議列表失敗",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
