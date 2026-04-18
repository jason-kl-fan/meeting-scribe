export const SESSION_KEY = "meeting-scribe-auth";

export type SessionUser = {
  username: string;
  displayName: string;
};

export function getConfiguredUser(): SessionUser {
  const username = process.env.DEMO_USERNAME?.trim() || "Jason";
  const displayName = process.env.DEMO_DISPLAY_NAME?.trim() || username;

  return {
    username,
    displayName,
  };
}

export function getConfiguredPassword() {
  return process.env.DEMO_PASSWORD?.trim() || "123456";
}

export function parseSessionHeader(value: string | null) {
  if (!value) return null;

  try {
    const decoded = Buffer.from(value, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as SessionUser;
    if (!parsed?.username) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function encodeSession(user: SessionUser) {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64");
}
