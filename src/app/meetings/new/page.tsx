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
  const [status, setStatus] = useState<string>("按下開始錄音，或直接上傳音檔。");
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
        setStatus("錄音完成，可以先播放確認，再按分析。");
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
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
      setStatus("正在錄音中...");

      timerRef.current = window.setInterval(() => {
        setSeconds((current) => current + 1);
      }, 1000);
    } catch (recordingError) {
      setError(recordingError instanceof Error ? recordingError.message : "無法啟動錄音");
      setStatus("錄音啟動失敗，請檢查麥克風權限。");
    }
  }

  function pauseRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recorder.state === "recording") {
      recorder.pause();
      setIsPaused(true);
      setStatus("錄音已暫停。");
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (recorder.state === "paused") {
      recorder.resume();
      setIsPaused(false);
      setStatus("錄音已繼續。");
      timerRef.current = window.setInterval(() => {
        setSeconds((current) => current + 1);
      }, 1000);
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recorder.state !== "inactive") {
      recorder.stop();
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
    setStatus("正在上傳音檔並分析內容...");

    try {
      const formData = new FormData();
      formData.append("audio", new File([blob], fileName, { type: blob.type || "audio/webm" }));

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || payload?.detail || "分析失敗");
      }

      setResult(payload);
      setStatus("分析完成，可以查看逐字稿與摘要。✨");
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "分析失敗");
      setStatus("分析失敗，請檢查 API key 或重新上傳音檔。");
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
    setStatus(`已選擇音檔：${file.name}`);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-sm text-cyan-300">New Meeting</p>
          <h1 className="mt-2 text-4xl font-bold">建立一場新會議</h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            這一版已經可以直接錄音或上傳音檔，送到 OpenAI 做逐字稿與摘要分析。若要正式使用，記得先在 Vercel 設定
            <code className="mx-1 rounded bg-white/10 px-2 py-1 text-cyan-200">OPENAI_API_KEY</code>。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Mic className="h-7 w-7 text-cyan-300" />
              <div>
                <h2 className="text-2xl font-semibold">直接錄音</h2>
                <p className="text-sm text-slate-400">用瀏覽器麥克風錄音後直接分析。</p>
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
                  開始錄音
                </button>
                <button
                  onClick={pauseRecording}
                  disabled={!isRecording || isAnalyzing}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pause className="h-4 w-4" />
                  {isPaused ? "繼續" : "暫停"}
                </button>
                <button
                  onClick={stopRecording}
                  disabled={!isRecording || isAnalyzing}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Square className="h-4 w-4" />
                  結束
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Upload className="h-7 w-7 text-cyan-300" />
              <div>
                <h2 className="text-2xl font-semibold">上傳音檔</h2>
                <p className="text-sm text-slate-400">支援 mp3、wav、m4a、webm。</p>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-8 text-center">
              <p className="text-lg font-medium">拖曳 / 點選上傳會議音檔</p>
              <p className="mt-2 text-sm text-slate-400">建議先拿 1~5 分鐘短音檔測試。</p>
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
                選擇音檔
              </button>
              {selectedFileName ? <p className="mt-4 text-sm text-cyan-200">已選擇：{selectedFileName}</p> : null}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">分析控制台</h2>
              <p className="mt-2 text-sm text-slate-400">先錄音或上傳，確認音訊後按分析。</p>
            </div>
            <button
              onClick={handleAnalyzeClick}
              disabled={!canAnalyze}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isAnalyzing ? "分析中..." : "開始分析"}
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
              <h2 className="mb-5 text-2xl font-semibold">逐字稿</h2>
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
                <h2 className="mb-4 text-2xl font-semibold">會議摘要</h2>
                <p className="leading-8 text-slate-200">{result.summary}</p>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="mb-4 text-xl font-semibold">重點整理</h3>
                <ul className="space-y-3 text-slate-200">
                  {result.keyPoints.map((point) => (
                    <li key={point} className="rounded-2xl bg-slate-950/50 px-4 py-3">
                      {point}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="mb-4 text-xl font-semibold">待辦事項</h3>
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
