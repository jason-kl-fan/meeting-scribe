import { parseSessionHeader } from "@/lib/auth";

export function getRequestUser(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const matched = cookie.match(/(?:^|; )meeting_scribe_session=([^;]+)/);
  const token = matched?.[1] ? decodeURIComponent(matched[1]) : null;
  return parseSessionHeader(token);
}
