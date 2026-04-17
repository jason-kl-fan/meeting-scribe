"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Upload, Clock3, Loader2, Square, Pause, Play, FileAudio, Sparkles } from "lucide-react";

type AnalysisResult = {
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

function formatDuration(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hrs, mins, secs].map((value) => value.toString().padStart(2, "0")).join(":");
}

export default function NewMeetingPage() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const [seconds, setSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [status, setStatus] = useState<string>("Click start recording, or upload an audio file.");
  const [error, setError] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

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

  const canAnalyze = useMemo(() => Boolean(audioBlob) && !isRecording && !isAnalyzing, [audioBlob, isRecording, isAnalyzing]);

  async function startRecording() {
    try {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }

      mediaRecorderRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      setError("");
      setResult(null);
      setSelectedFileName("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined,
      });

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl((previousUrl) => {
          if (previousUrl) URL.revokeObjectURL(previousUrl);
          return URL.createObjectURL(blob);
        });
        setStatus("Recording finished. You can preview the audio, then start analysis.");
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setAudioBlob(null);
      setAudioUrl((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        return null;
      });
      setSeconds(0);
      setIsRecording(true);
      setIsPaused(false);
      setStatus("Recording in progress...");

      timerRef.current = window.setInterval(() => {
        setSeconds((current) => current + 1);
      }, 1000);
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
      setStatus("Recording resumed.");
      timerRef.current = window.setInterval(() => {
        setSeconds((current) => current + 1);
      }, 1000);
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      mediaRecorderRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function analyzeBlob(blob: Blob, fileName: string) {
    setIsAnalyzing(true);
    setError("");
    setResult(null);
    setStatus("Uploading audio and analyzing content...");

    try {
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

      setResult(payload);
      setStatus("Analysis complete. You can now review the transcript and summary. ✨");
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Analysis failed");
      setStatus("Analysis failed. Please check the API key or upload the audio again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleAnalyzeClick() {
    if (!audioBlob) return;
    await analyzeBlob(audioBlob, selectedFileName || "recording.webm");
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setAudioBlob(file);
    setAudioUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return URL.createObjectURL(file);
    });
    setSeconds(0);
    setResult(null);
    setError("");
    setStatus(`Selected audio file: ${file.name}`);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-sm text-cyan-300">New Meeting</p>
          <h1 className="mt-2 text-4xl font-bold">Create a new meeting</h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This MVP can already record audio in the browser or upload an audio file, then send it to OpenAI
            for transcription and summarization. For production use, remember to set
            <code className="mx-1 rounded bg-white/10 px-2 py-1 text-cyan-200">OPENAI_API_KEY</code> in Vercel.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Mic className="h-7 w-7 text-cyan-300" />
              <div>
                <h2 className="text-2xl font-semibold">Record in browser</h2>
                <p className="text-sm text-slate-400">Use your microphone and analyze the recording right away.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-6 text-center">
              <Clock3 className="mx-auto mb-3 h-10 w-10 text-slate-400" />
              <p className="text-4xl font-semibold tracking-wider">{formatDuration(seconds)}</p>
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
              <p className="mt-2 text-sm text-slate-400">Record or upload first, confirm the audio, then run analysis.</p>
            </div>
            <button
              onClick={handleAnalyzeClick}
              disabled={!canAnalyze}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isAnalyzing ? "Analyzing..." : "Start analysis"}
            </button>
          </div>

          {audioUrl ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
                <FileAudio className="h-4 w-4 text-cyan-300" />
                <span>{selectedFileName || "recording.webm"}</span>
              </div>
              <audio controls src={audioUrl} className="w-full" />
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
    </main>
  );
}
