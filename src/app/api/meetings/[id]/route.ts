import { NextResponse } from "next/server";
import { getMeetingById } from "@/lib/meeting-db";
import { getRequestUser } from "@/lib/request-user";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const { id } = await context.params;
    const meeting = await getMeetingById(id, user.username);

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
