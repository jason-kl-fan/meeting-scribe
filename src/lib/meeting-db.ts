import { ActionItemStatus, MeetingSourceType, MeetingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type MeetingTranscriptItem = {
  speaker: string;
  time: string;
  text: string;
};

export type PersistMeetingInput = {
  title: string;
  sourceLabel: string;
  durationSeconds: number;
  transcriptText: string;
  transcript: MeetingTranscriptItem[];
  summary: string;
  keyPoints: string[];
  actions: string[];
  audioFilename?: string | null;
  audioMimeType?: string | null;
  audioSizeBytes?: number | null;
};

const DEMO_USER_EMAIL = "demo@meeting-scribe.local";

function parseTimestampToMs(value: string, fallbackIndex: number) {
  const match = value.match(/^(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return fallbackIndex * 15000;
  const [, hh, mm, ss] = match;
  return (Number(hh) * 3600 + Number(mm) * 60 + Number(ss)) * 1000;
}

function inferSourceType(sourceLabel: string) {
  return /upload/i.test(sourceLabel) ? MeetingSourceType.UPLOAD : MeetingSourceType.RECORDING;
}

export async function getOrCreateDemoUser() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      email: DEMO_USER_EMAIL,
      name: "Demo User",
    },
  });
}

export async function persistMeeting(input: PersistMeetingInput) {
  const user = await getOrCreateDemoUser();
  const now = new Date();

  const meeting = await prisma.meeting.create({
    data: {
      userId: user.id,
      title: input.title,
      sourceType: inferSourceType(input.sourceLabel),
      audioFilename: input.audioFilename ?? undefined,
      audioMimeType: input.audioMimeType ?? undefined,
      audioSizeBytes: input.audioSizeBytes ?? undefined,
      durationSeconds: input.durationSeconds,
      status: MeetingStatus.COMPLETED,
      transcriptText: input.transcriptText,
      startedAt: input.durationSeconds > 0 ? new Date(now.getTime() - input.durationSeconds * 1000) : now,
      completedAt: now,
      summaries: {
        create: {
          version: 1,
          modelName: process.env.OPENAI_SUMMARIZE_MODEL || "gpt-4.1-mini",
          promptVersion: "v1",
          summaryText: input.summary,
          keyPointsJson: input.keyPoints,
          nextStepsJson: input.actions,
        },
      },
      actionItems: {
        create: input.actions.map((task) => ({
          task,
          status: ActionItemStatus.TODO,
        })),
      },
      transcriptSegments: {
        create: input.transcript.length
          ? input.transcript.map((item, index) => {
              const startMs = parseTimestampToMs(item.time, index);
              return {
                speakerKey: item.speaker || "Speaker 1",
                startMs,
                endMs: startMs + 15000,
                text: item.text,
              };
            })
          : input.transcriptText
              .split(/(?<=[。！？.!?])\s+/)
              .map((sentence) => sentence.trim())
              .filter(Boolean)
              .map((sentence, index) => ({
                speakerKey: "Speaker 1",
                startMs: index * 15000,
                endMs: index * 15000 + 15000,
                text: sentence,
              })),
      },
      speakers: {
        create: Array.from(new Set(input.transcript.map((item) => item.speaker).filter(Boolean))).map((speakerKey) => ({
          speakerKey,
          displayName: speakerKey,
        })),
      },
    },
    include: {
      summaries: { orderBy: { createdAt: "desc" }, take: 1 },
      actionItems: { orderBy: { createdAt: "asc" } },
      transcriptSegments: { orderBy: { startMs: "asc" } },
    },
  });

  return meeting;
}

function msToTimestamp(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return [hrs, mins, secs].map((value) => value.toString().padStart(2, "0")).join(":");
}

export async function listMeetings() {
  const meetings = await prisma.meeting.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      summaries: { orderBy: { createdAt: "desc" }, take: 1 },
      actionItems: { orderBy: { createdAt: "asc" } },
      transcriptSegments: { orderBy: { startMs: "asc" } },
    },
  });

  return meetings.map((meeting) => ({
    id: meeting.id,
    title: meeting.title,
    createdAt: meeting.createdAt.toISOString(),
    duration: msToTimestamp((meeting.durationSeconds || 0) * 1000),
    sourceLabel: meeting.sourceType === MeetingSourceType.UPLOAD ? "Uploaded audio" : "Recorded in browser",
    status: meeting.status,
    summary: meeting.summaries[0]?.summaryText || "",
    keyPoints: Array.isArray(meeting.summaries[0]?.keyPointsJson) ? (meeting.summaries[0]?.keyPointsJson as string[]) : [],
    actions: meeting.actionItems.map((item) => item.task),
    transcriptText: meeting.transcriptText || "",
    transcript: meeting.transcriptSegments.map((segment) => ({
      speaker: segment.speakerKey || "Speaker 1",
      time: msToTimestamp(segment.startMs),
      text: segment.text,
    })),
  }));
}

export async function getMeetingById(id: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      summaries: { orderBy: { createdAt: "desc" }, take: 1 },
      actionItems: { orderBy: { createdAt: "asc" } },
      transcriptSegments: { orderBy: { startMs: "asc" } },
    },
  });

  if (!meeting) return null;

  return {
    id: meeting.id,
    title: meeting.title,
    createdAt: meeting.createdAt.toISOString(),
    duration: msToTimestamp((meeting.durationSeconds || 0) * 1000),
    sourceLabel: meeting.sourceType === MeetingSourceType.UPLOAD ? "Uploaded audio" : "Recorded in browser",
    status: meeting.status,
    summary: meeting.summaries[0]?.summaryText || "",
    keyPoints: Array.isArray(meeting.summaries[0]?.keyPointsJson) ? (meeting.summaries[0]?.keyPointsJson as string[]) : [],
    actions: meeting.actionItems.map((item) => item.task),
    transcriptText: meeting.transcriptText || "",
    transcript: meeting.transcriptSegments.map((segment) => ({
      speaker: segment.speakerKey || "Speaker 1",
      time: msToTimestamp(segment.startMs),
      text: segment.text,
    })),
  };
}
