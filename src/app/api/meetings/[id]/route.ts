import { NextResponse } from "next/server";
import { getMeetingById } from "@/lib/meeting-db";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const meeting = await getMeetingById(id);

    if (!meeting) {
      return NextResponse.json({ error: "找不到會議" }, { status: 404 });
    }

    return NextResponse.json({ meeting });
  } catch (error) {
    return NextResponse.json(
      {
        error: "讀取會議詳情失敗",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
