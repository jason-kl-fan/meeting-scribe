import { NextResponse } from "next/server";
import { listMeetings } from "@/lib/meeting-db";
import { getRequestUser } from "@/lib/request-user";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const meetings = await listMeetings(user.username);
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
