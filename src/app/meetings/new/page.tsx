"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Mic, Upload, Clock3, Loader2, Square, Pause, Play, FileAudio, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";

type AnalysisResult = {
  meetingId?: string;
  transcriptText: string;
  summary: string;
  keyPoints: string[];
  actions: string[];
  transcript: Array<{
    speaker: string;
    time: string;
    text: string;
  }>;
};

type RecordedSegment = {
  id: string;
  blob: Blob;
  fileName: string;
  durationSeconds: number;
  liveTranscript?: string;
  analyzed?: boolean;
};

const SEGMENT_SECONDS = 120;
const LIVE_TRANSCRIBE_SECONDS = 15;

function formatDuration(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hrs, mins, secs].map((value) => value.toString().padStart(2, "0")).join(":");
}

function createSegmentFileName(index: number) {
  return `recording-part-${String(index).padStart(3, "0")}.webm`;
}

export default function NewMeetingPage() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const segmentDurationRef = useRef(0);
  const nextSegmentStartRef = useRef(false);
  const isStoppingSessionRef = useRef(false);
  const segmentIndexRef = useRef(0);
  const liveTranscribingCountRef = useRef(0);

  const [seconds, setSeconds] = useState(0);
  const [segmentSeconds, setSegmentSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [status, setStatus] = useState<string>("Click start recording, or upload an audio file.");
  const [error, setError] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLiveTranscribing, setIsLiveTranscribing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [recordedSegments, setRecordedSegments] = useState<RecordedSegment[]>([]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [savedMeetingId, setSavedMeetingId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [audioUrl]);

  const canAnalyze = useMemo(
    () => (Boolean(audioBlob) || recordedSegments.length > 0) && !isRecording && !isAnalyzing && !isLiveTranscribing,
    [audioBlob, recordedSegments.length, isRecording, isAnalyzing, isLiveTranscribing],
  );

  function updateLiveTranscribingState(delta: number) {
    liveTranscribingCountRef.current = Math.max(0, liveTranscribingCountRef.current + delta);
    setIsLiveTranscribing(liveTranscribingCountRef.current > 0);
  }

  function resetTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = window.setInterval(() => {
      setSeconds((current) => current + 1);
      setSegmentSeconds((current) => {
        const next = current + 1;
        segmentDurationRef.current = next;
        if (next >= SEGMENT_SECONDS && mediaRecorderRef.current?.state === "recording") {
          nextSegmentStartRef.current = true;
          mediaRecorderRef.current.stop();
          return 0;
        }
        return next;
      });
    }, 1000);
  }

  function stopActiveStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function transcribeForLivePreview(blob: Blob, fileName: string) {
    const formData = new FormData();
    formData.append("audio", new File([blob], fileName, { type: blob.type || "audio/webm" }));

    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || payload?.detail || "Live transcription failed");
    }

    return payload as AnalysisResult;
  }

  function appendSegmentAndTranscribe(segment: RecordedSegment) {
    setRecordedSegments((current) => [...current, segment]);
    setAudioBlob(segment.blob);
    setSelectedFileName(segment.fileName);
    setAudioUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return URL.createObjectURL(segment.blob);
    });

    updateLiveTranscribingState(1);
    setStatus(`Segment ${segmentIndexRef.current} saved. Transcribing preview text...`);

    void transcribeForLivePreview(segment.blob, segment.fileName)
      .then((partial) => {
        const transcriptText = partial.transcriptText?.trim() || "";
        if (!transcriptText) return;

        setRecordedSegments((current) =>
          current.map((item) =>
            item.id === segment.id
              ? {
                  ...item,
                  liveTranscript: transcriptText,
                  analyzed: true,
                }
              : item,
          ),
        );

        setLiveTranscript((current) => (current ? `${current}\n${transcriptText}` : transcriptText));
      })
      .catch((transcriptionError) => {
        setRecordedSegments((current) =>
          current.map((item) =>
            item.id === segment.id
              ? {
                  ...item,
                  analyzed: false,
                }
              : item,
          ),
        );
        setError(transcriptionError instanceof Error ? transcriptionError.message : "Live transcription failed");
      })
      .finally(() => {
        updateLiveTranscribingState(-1);
        setStatus((currentStatus) => {
          if (isStoppingSessionRef.current) {
            return "Recording finished. Live transcript is ready; you can now generate the final summary.";
          }
          return currentStatus.includes("Transcribing preview text")
            ? `Recording in progress... live text updates every ${LIVE_TRANSCRIBE_SECONDS}s.`
            : currentStatus;
        });
      });
  }

  function beginRecorderWithStream(stream: MediaStream) {
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined,
    });

    chunksRef.current = [];
    segmentDurationRef.current = 0;
    setSegmentSeconds(0);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      const durationSeconds = Math.max(segmentDurationRef.current, 1);
      const shouldStartNext = nextSegmentStartRef.current;
      const shouldFinishSession = isStoppingSessionRef.current;

      if (blob.size > 0) {
        const segmentIndex = segmentIndexRef.current + 1;
        segmentIndexRef.current = segmentIndex;
        const fileName = createSegmentFileName(segmentIndex);
        const segment: RecordedSegment = {
          id: `${Date.now()}-${segmentIndex}`,
          blob,
          fileName,
          durationSeconds,
        };

        appendSegmentAndTranscribe(segment);
      }

      mediaRecorderRef.current = null;
      nextSegmentStartRef.current = false;
      stopActiveStream();

      if (shouldStartNext && !shouldFinishSession) {
        try {
          const nextStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = nextStream;
          beginRecorderWithStream(nextStream);
          setStatus(`Segment saved. Continuing with segment ${segmentIndexRef.current + 1}...`);
          return;
        } catch (recordingError) {
          setIsRecording(false);
          setIsPaused(false);
          setError(recordingError instanceof Error ? recordingError.message : "Unable to continue recording");
          setStatus("Automatic segment restart failed. Please start recording again.");
          return;
        }
      }

      if (shouldFinishSession) {
        isStoppingSessionRef.current = false;
        setIsRecording(false);
        setIsPaused(false);
        setStatus("Recording finished. Waiting for the last live transcript chunk...");
        return;
      }

      setStatus(`Segment saved. Live text updates every ${LIVE_TRANSCRIBE_SECONDS}s.`);
    };

    mediaRecorderRef.current = recorder;
    recorder.start(LIVE_TRANSCRIBE_SECONDS * 1000);
  }

  async function startRecording() {
    try {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }

      mediaRecorderRef.current = null;
      stopActiveStream();

      setError("");
      setResult(null);
      setSavedMeetingId(null);
      setSelectedFileName("");
      setAudioBlob(null);
      setLiveTranscript("");
      setRecordedSegments([]);
      segmentIndexRef.current = 0;
      liveTranscribingCountRef.current = 0;
      setIsLiveTranscribing(false);
      setAudioUrl((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        return null;
      });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      nextSegmentStartRef.current = false;
      isStoppingSessionRef.current = false;
      setSeconds(0);

      beginRecorderWithStream(stream);
      setIsRecording(true);
      setIsPaused(false);
      setStatus(`Recording in progress... live text updates every ${LIVE_TRANSCRIBE_SECONDS}s.`);
      resetTimer();
    } catch (recordingError) {
      setIsRecording(false);
      setIsPaused(false);
      setError(recordingError instanceof Error ? recordingError.message : "Unable to start recording");
      setStatus("Could not start recording. Please check microphone permissions.");
    }
  }

  function pauseRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recorder.state === "recording") {
      recorder.pause();
      setIsPaused(true);
      setStatus("Recording paused.");
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (recorder.state === "paused") {
      recorder.resume();
      setIsPaused(false);
      setStatus(`Recording resumed... live text updates every ${LIVE_TRANSCRIBE_SECONDS}s.`);
      resetTimer();
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    isStoppingSessionRef.current = true;
    nextSegmentStartRef.current = false;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      stopActiveStream();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setIsPaused(false);
      setStatus("Recording finished. You can start analysis now.");
    }

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function analyzeBlob(blob: Blob, fileName: string) {
    const formData = new FormData();
    formData.append("audio", new File([blob], fileName, { type: blob.type || "audio/webm" }));

    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || payload?.detail || "Analysis failed");
    }

    return payload as AnalysisResult;
  }

  async function summarizeTranscript(transcriptText: string) {
    const formData = new FormData();
    formData.append("transcriptText", transcriptText);

    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || payload?.detail || "Summary failed");
    }

    return payload as AnalysisResult;
  }

  async function handleAnalyzeClick() {
    if (!audioBlob && recordedSegments.length === 0) return;

    setIsAnalyzing(true);
    setError("");
    setResult(null);

    try {
      if (recordedSegments.length > 0) {
        setStatus(`Preparing final summary from ${recordedSegments.length} recorded segments...`);

        const existingLiveTranscript = recordedSegments
          .map((item) => item.liveTranscript?.trim())
          .filter((item): item is string => Boolean(item))
          .join("\n");

        let mergedTranscriptText = existingLiveTranscript;
        let mergedTranscript = recordedSegments.flatMap((segment, index) => {
          const text = segment.liveTranscript?.trim();
          if (!text) return [];
          return [
            {
              speaker: "Speaker 1",
              time: formatDuration(index * LIVE_TRANSCRIBE_SECONDS),
              text,
            },
          ];
        });

        const missingSegments = recordedSegments.filter((segment) => !segment.liveTranscript?.trim());

        if (missingSegments.length > 0) {
          setStatus(`Backfilling ${missingSegments.length} segments that do not have live transcript yet...`);
          const backfilled: AnalysisResult[] = [];

          for (let index = 0; index < missingSegments.length; index += 1) {
            const segment = missingSegments[index];
            setStatus(`Backfilling segment ${index + 1} / ${missingSegments.length}...`);
            const partial = await analyzeBlob(segment.blob, segment.fileName);
            backfilled.push(partial);
          }

          const backfilledTranscriptText = backfilled.map((item) => item.transcriptText).filter(Boolean).join("\n");
          mergedTranscriptText = [mergedTranscriptText, backfilledTranscriptText].filter(Boolean).join("\n");
          mergedTranscript = [...mergedTranscript, ...backfilled.flatMap((item) => item.transcript)];
        }

        setStatus("Generating full meeting summary from the live transcript...");
        const merged = await summarizeTranscript(mergedTranscriptText);
        const finalResult = {
          ...merged,
          transcriptText: mergedTranscriptText,
          transcript: mergedTranscript.length ? mergedTranscript : merged.transcript,
        };
        setResult(finalResult);
        setSavedMeetingId(merged.meetingId || null);
        setStatus("Final summary complete and saved to database history. ✨");
        return;
      }

      setStatus("Uploading audio and analyzing content...");
      const payload = await analyzeBlob(audioBlob as Blob, selectedFileName || "recording.webm");
      setResult(payload);
      setSavedMeetingId(payload.meetingId || null);
      setStatus("Analysis complete and saved to database history. ✨");
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Analysis failed");
      setStatus("Analysis failed. Please check the API key or upload the audio again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setSavedMeetingId(null);
    setRecordedSegments([]);
    segmentIndexRef.current = 0;
    liveTranscribingCountRef.current = 0;
    setIsLiveTranscribing(false);
    setLiveTranscript("");
    setAudioBlob(file);
    setAudioUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return URL.createObjectURL(file);
    });
    setSeconds(0);
    setSegmentSeconds(0);
    setResult(null);
    setError("");
    setStatus(`Selected audio file: ${file.name}`);
  }

  return (
    <RequireAuth>
      <AppShell>
        <div className="mx-auto max-w-6xl space-y-8 px-6 py-12 lg:px-8">
          <div>
            <p className="text-sm text-cyan-300">New Meeting</p>
            <h1 className="mt-2 text-4xl font-bold">Create a new meeting</h1>
            <p className="mt-4 max-w-3xl text-slate-300">
              This MVP can now transcribe while recording by uploading a short audio chunk every 15 seconds,
              then generate the final summary after you stop. Long recordings are still protected by 2-minute
              rolling segments. For production use, remember to set
              <code className="mx-1 rounded bg-white/10 px-2 py-1 text-cyan-200">OPENAI_API_KEY</code> in Vercel.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Mic className="h-7 w-7 text-cyan-300" />
              <div>
                <h2 className="text-2xl font-semibold">Record in browser</h2>
                <p className="text-sm text-slate-400">Live transcript updates every 15 seconds while recording.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-6 text-center">
              <Clock3 className="mx-auto mb-3 h-10 w-10 text-slate-400" />
              <p className="text-4xl font-semibold tracking-wider">{formatDuration(seconds)}</p>
              <p className="mt-2 text-sm text-slate-500">
                Current rolling segment: {formatDuration(segmentSeconds)} / {formatDuration(SEGMENT_SECONDS)}
              </p>
              <p className="mt-3 text-sm text-slate-400">{status}</p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={startRecording}
                  disabled={isRecording || isAnalyzing}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  Start recording
                </button>
                <button
                  onClick={pauseRecording}
                  disabled={!isRecording || isAnalyzing}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pause className="h-4 w-4" />
                  {isPaused ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={stopRecording}
                  disabled={!isRecording || isAnalyzing}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </button>
              </div>

              {recordedSegments.length > 0 ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-left text-sm text-slate-300">
                  <p className="font-medium text-cyan-200">Saved live chunks: {recordedSegments.length}</p>
                  <ul className="mt-3 space-y-2">
                    {recordedSegments.map((segment) => (
                      <li key={segment.id} className="rounded-xl bg-slate-950/60 px-3 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <span className="truncate">{segment.fileName}</span>
                          <span className="shrink-0 text-slate-400">{formatDuration(segment.durationSeconds)}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs text-slate-400">
                          {segment.liveTranscript?.trim() || (segment.analyzed === false ? "Live transcription failed for this chunk." : "Transcribing...")}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Upload className="h-7 w-7 text-cyan-300" />
              <div>
                <h2 className="text-2xl font-semibold">Upload audio</h2>
                <p className="text-sm text-slate-400">Supports mp3, wav, m4a, and webm.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-8 text-center">
              <p className="text-lg font-medium">Drag in or choose a meeting audio file</p>
              <p className="mt-2 text-sm text-slate-400">Start with a short 1–5 minute audio clip for testing.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing || isRecording}
                className="mt-6 rounded-xl border border-white/15 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Choose audio file
              </button>
              {selectedFileName ? <p className="mt-4 text-sm text-cyan-200">Selected: {selectedFileName}</p> : null}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Analysis console</h2>
              <p className="mt-2 text-sm text-slate-400">
                While recording, the live transcript grows chunk by chunk. After stopping, run the final summary.
              </p>
            </div>
            <button
              onClick={handleAnalyzeClick}
              disabled={!canAnalyze}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isAnalyzing ? "Analyzing..." : recordedSegments.length > 0 ? "Generate final summary" : "Start analysis"}
            </button>
          </div>

          {isLiveTranscribing ? (
            <div className="mt-6 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
              正在把最新錄音片段轉成文字…
            </div>
          ) : null}

          {savedMeetingId ? (
            <div className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              <span>這次分析已經存到歷史紀錄。</span>
              <Link href="/meetings" className="font-medium text-emerald-200 underline underline-offset-4">查看歷史列表</Link>
              <Link href={`/meetings/${savedMeetingId}`} className="font-medium text-emerald-200 underline underline-offset-4">打開這筆詳情</Link>
            </div>
          ) : null}

          {audioUrl ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
                <FileAudio className="h-4 w-4 text-cyan-300" />
                <span>{selectedFileName || "recording.webm"}</span>
              </div>
              <audio controls src={audioUrl} className="w-full" />
            </div>
          ) : null}

          {liveTranscript ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <h3 className="mb-3 text-lg font-semibold text-cyan-200">Live transcript preview</h3>
              <p className="whitespace-pre-wrap leading-7 text-slate-200">{liveTranscript}</p>
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div>
          ) : null}
        </section>

          {result ? (
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="mb-5 text-2xl font-semibold">Transcript</h2>
                <div className="space-y-4">
                  {result.transcript.map((item, index) => (
                    <article key={`${item.time}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                        <span className="font-medium text-cyan-300">{item.speaker}</span>
                        <span>{item.time}</span>
                      </div>
                      <p className="leading-7 text-slate-100">{item.text}</p>
                    </article>
                  ))}
                </div>
              </section>

              <aside className="space-y-6">
                <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h2 className="mb-4 text-2xl font-semibold">Meeting summary</h2>
                  <p className="leading-8 text-slate-200">{result.summary}</p>
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h3 className="mb-4 text-xl font-semibold">Key points</h3>
                  <ul className="space-y-3 text-slate-200">
                    {result.keyPoints.map((point) => (
                      <li key={point} className="rounded-2xl bg-slate-950/50 px-4 py-3">
                        {point}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h3 className="mb-4 text-xl font-semibold">Action items</h3>
                  <ul className="space-y-3 text-slate-200">
                    {result.actions.map((action) => (
                      <li key={action} className="rounded-2xl bg-slate-950/50 px-4 py-3">
                        {action}
                      </li>
                    ))}
                  </ul>
                </section>
              </aside>
            </div>
          ) : null}
        </div>
      </AppShell>
    </RequireAuth>
  );
}
