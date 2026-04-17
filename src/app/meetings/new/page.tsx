import { Mic, Upload, Clock3 } from "lucide-react";

export default function NewMeetingPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <p className="text-sm text-cyan-300">New Meeting</p>
          <h1 className="mt-2 text-4xl font-bold">建立一場新會議</h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            先把錄音 / 上傳的體驗做順。這一版先做前端 demo，下一步再接真實 API 與資料庫。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <Mic className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-2xl font-semibold">直接錄音</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              支援開始、暫停、結束錄音，未來會接 MediaRecorder 與音檔上傳流程。
            </p>

            <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-6 text-center">
              <Clock3 className="mx-auto mb-3 h-10 w-10 text-slate-400" />
              <p className="text-3xl font-semibold tracking-wider">00:00:00</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button className="rounded-xl bg-cyan-400 px-4 py-2 font-medium text-slate-950">開始錄音</button>
                <button className="rounded-xl border border-white/15 px-4 py-2 text-white">暫停</button>
                <button className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-red-200">結束</button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <Upload className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-2xl font-semibold">上傳音檔</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              支援 mp3、wav、m4a、webm。適合先拿既有會議音檔測試轉錄效果。
            </p>

            <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-10 text-center">
              <p className="text-lg font-medium">拖曳音檔到這裡</p>
              <p className="mt-2 text-sm text-slate-400">或點擊選取檔案</p>
              <button className="mt-6 rounded-xl border border-white/15 px-4 py-2 text-white">選擇音檔</button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
