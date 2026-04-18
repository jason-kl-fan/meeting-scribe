export type MeetingTranscriptItem = {
  speaker: string;
  time: string;
  text: string;
};

export type MeetingHistoryItem = {
  id: string;
  title: string;
  createdAt: string;
  duration: string;
  sourceLabel: string;
  status: string;
  summary: string;
  keyPoints: string[];
  actions: string[];
  transcriptText: string;
  transcript: MeetingTranscriptItem[];
};

export async function loadMeetingHistory(): Promise<MeetingHistoryItem[]> {
  const response = await fetch("/api/meetings", { cache: "no-store" });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || payload?.detail || "Failed to load meeting history");
  }
  return Array.isArray(payload?.meetings) ? payload.meetings : [];
}

export async function getMeetingHistoryItem(id: string): Promise<MeetingHistoryItem | null> {
  const response = await fetch(`/api/meetings/${id}`, { cache: "no-store" });
  if (response.status === 404) return null;

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || payload?.detail || "Failed to load meeting detail");
  }

  return payload?.meeting ?? null;
}
