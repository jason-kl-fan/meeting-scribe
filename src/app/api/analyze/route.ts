import { NextResponse } from "next/server";
import { persistMeeting } from "@/lib/meeting-db";

export const runtime = "nodejs";

type TranscriptSegment = {
  speaker: string;
  time: string;
  text: string;
};

function toTimestamp(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  return [hrs, mins, secs].map((value) => value.toString().padStart(2, "0")).join(":");
}

function createFallbackSummary(transcript: string) {
  const normalized = transcript.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return {
      summary: "目前沒有可用的逐字稿內容。",
      keyPoints: ["請重新錄音或改用音檔上傳後再試一次。"],
      actions: ["確認麥克風權限已開啟。"],
    };
  }

  const sentences = normalized
    .split(/(?<=[。！？.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const summary = sentences.slice(0, 3).join(" ") || normalized.slice(0, 180);
  const keyPoints = sentences.slice(0, 3).map((sentence) => sentence.slice(0, 120));
  const actions = sentences
    .filter((sentence) => /需要|應該|待辦|下一步|請|安排|確認/.test(sentence))
    .slice(0, 3)
    .map((sentence) => sentence.slice(0, 120));

  return {
    summary,
    keyPoints: keyPoints.length ? keyPoints : ["已完成基本摘要，但未偵測到明確條列重點。"],
    actions: actions.length ? actions : ["目前未偵測到明確待辦事項，可人工補充。"],
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");
    const transcriptOverride = formData.get("transcriptText");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "尚未設定 OPENAI_API_KEY，請先在 Vercel Environment Variables 加入。",
        },
        { status: 500 },
      );
    }

    if (typeof transcriptOverride === "string" && transcriptOverride.trim()) {
      const transcriptText = transcriptOverride.trim();
      const transcript: TranscriptSegment[] = transcriptText
        .split(/(?<=[。！？.!?])\s+/)
        .map((sentence: string) => sentence.trim())
        .filter(Boolean)
        .map((sentence: string, index: number) => ({
          speaker: "Speaker 1",
          time: toTimestamp(index * 15),
          text: sentence,
        }));

      const summaryResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: [
            {
              role: "system",
              content:
                "你是會議助理。請根據逐字稿輸出 JSON，格式為 {summary: string, keyPoints: string[], actions: string[]}。summary 用繁體中文，keyPoints 與 actions 各 3-5 條，避免虛詞。只輸出 JSON。",
            },
            {
              role: "user",
              content: transcriptText,
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "meeting_summary",
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  summary: { type: "string" },
                  keyPoints: {
                    type: "array",
                    items: { type: "string" },
                  },
                  actions: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["summary", "keyPoints", "actions"],
              },
            },
          },
        }),
      });

      let summaryPayload = createFallbackSummary(transcriptText);

      if (summaryResponse.ok) {
        const summaryJson = await summaryResponse.json();
        const outputText =
          summaryJson.output_text ||
          summaryJson.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? []).map((item: { text?: string }) => item.text ?? "").join("") ||
          "";

        try {
          const parsed = JSON.parse(outputText);
          if (parsed?.summary && Array.isArray(parsed?.keyPoints) && Array.isArray(parsed?.actions)) {
            summaryPayload = parsed;
          }
        } catch {
          summaryPayload = createFallbackSummary(transcriptText);
        }
      }

      const savedMeeting = await persistMeeting({
        title: `Meeting ${new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
        sourceLabel: "Recorded in browser",
        durationSeconds: transcript.length * 15,
        transcriptText,
        transcript,
        summary: summaryPayload.summary,
        keyPoints: summaryPayload.keyPoints,
        actions: summaryPayload.actions,
      });

      return NextResponse.json({
        meetingId: savedMeeting.id,
        transcriptText,
        transcript,
        ...summaryPayload,
      });
    }

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "缺少 audio 檔案" }, { status: 400 });
    }

    const transcriptionForm = new FormData();
    transcriptionForm.append("file", audio, audio.name || "recording.webm");
    transcriptionForm.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe");
    transcriptionForm.append("response_format", "json");

    const transcriptResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: transcriptionForm,
    });

    if (!transcriptResponse.ok) {
      const detail = await transcriptResponse.text();
      return NextResponse.json(
        {
          error: "OpenAI transcription 失敗",
          detail,
        },
        { status: 500 },
      );
    }

    const transcriptJson = await transcriptResponse.json();
    const transcriptText = typeof transcriptJson.text === "string" ? transcriptJson.text.trim() : "";
    const rawSegments = Array.isArray(transcriptJson.segments) ? transcriptJson.segments : [];

    const transcript: TranscriptSegment[] = rawSegments.length
      ? rawSegments.map((segment: { start?: number; text?: string }, index: number) => ({
          speaker: `Speaker ${index + 1}`,
          time: toTimestamp(typeof segment.start === "number" ? segment.start : 0),
          text: typeof segment.text === "string" ? segment.text.trim() : "",
        }))
      : transcriptText
          .split(/(?<=[。！？.!?])\s+/)
          .map((sentence: string) => sentence.trim())
          .filter(Boolean)
          .map((sentence: string, index: number) => ({
            speaker: "Speaker 1",
            time: toTimestamp(index * 15),
            text: sentence,
          }));

    const summaryResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "你是會議助理。請根據逐字稿輸出 JSON，格式為 {summary: string, keyPoints: string[], actions: string[]}。summary 用繁體中文，keyPoints 與 actions 各 3-5 條，避免虛詞。只輸出 JSON。",
          },
          {
            role: "user",
            content: transcriptText || transcript.map((item) => `${item.time} ${item.text}`).join("\n"),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "meeting_summary",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                keyPoints: {
                  type: "array",
                  items: { type: "string" },
                },
                actions: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["summary", "keyPoints", "actions"],
            },
          },
        },
      }),
    });

    let summaryPayload = createFallbackSummary(transcriptText);

    if (summaryResponse.ok) {
      const summaryJson = await summaryResponse.json();
      const outputText =
        summaryJson.output_text ||
        summaryJson.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? []).map((item: { text?: string }) => item.text ?? "").join("") ||
        "";

      try {
        const parsed = JSON.parse(outputText);
        if (parsed?.summary && Array.isArray(parsed?.keyPoints) && Array.isArray(parsed?.actions)) {
          summaryPayload = parsed;
        }
      } catch {
        summaryPayload = createFallbackSummary(transcriptText);
      }
    }

    const savedMeeting = await persistMeeting({
      title: audio.name ? audio.name.replace(/\.[^.]+$/, "") : `Meeting ${new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
      sourceLabel: audio.name ? "Uploaded audio" : "Recorded in browser",
      durationSeconds: transcript.length * 15,
      transcriptText,
      transcript,
      summary: summaryPayload.summary,
      keyPoints: summaryPayload.keyPoints,
      actions: summaryPayload.actions,
      audioFilename: audio.name || null,
      audioMimeType: audio.type || null,
      audioSizeBytes: audio.size || null,
    });

    return NextResponse.json({
      meetingId: savedMeeting.id,
      transcriptText,
      transcript,
      ...summaryPayload,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "分析失敗",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
