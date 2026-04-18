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

const STORAGE_KEY = "meeting-scribe-history";

export function createMeetingId() {
  return `meeting-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadMeetingHistory(): MeetingHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MeetingHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMeetingHistory(items: MeetingHistoryItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function prependMeetingHistory(item: MeetingHistoryItem) {
  const current = loadMeetingHistory();
  const next = [item, ...current.filter((existing) => existing.id !== item.id)];
  saveMeetingHistory(next);
  return next;
}

export function getMeetingHistoryItem(id: string) {
  return loadMeetingHistory().find((item) => item.id === id) ?? null;
}
