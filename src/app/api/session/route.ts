import { NextResponse } from "next/server";
import { encodeSession, getConfiguredPassword, getConfiguredUser } from "@/lib/auth";

export const runtime = "nodejs";

function buildSessionCookie() {
  const user = getConfiguredUser();
  return {
    user,
    token: encodeSession(user),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = body?.username?.trim();
    const password = body?.password ?? "";
    const { user, token } = buildSessionCookie();

    if (username !== user.username || password !== getConfiguredPassword()) {
      return NextResponse.json({ error: "帳號或密碼不正確" }, { status: 401 });
    }

    const response = NextResponse.json({ user });
    response.cookies.set("meeting_scribe_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "登入失敗", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("meeting_scribe_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function GET(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const matched = cookie.match(/(?:^|; )meeting_scribe_session=([^;]+)/);
  if (!matched) {
    return NextResponse.json({ user: null });
  }

  const value = decodeURIComponent(matched[1] || "");
  const { user, token } = buildSessionCookie();
  if (value !== token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
