import Link from "next/link";
import { Mic, FileAudio, FileText, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { sampleMeeting } from "@/lib/sample-data";

const features = [
  {
    title: "網頁直接錄音",
    description: "支援開始、暫停、結束錄音，快速建立一場會議。",
    icon: Mic,
  },
  {
    title: "上傳會議音檔",
    description: "支援既有會議錄音檔，方便先做歷史資料測試。",
    icon: FileAudio,
  },
  {
    title: "逐字稿 + 摘要",
    description: "錄音完成後產生逐字稿、會議重點、待辦事項。",
    icon: FileText,
  },
  {
    title: "說話者辨識",
    description: "區分不同發言者，後續還可手動重新命名。",
    icon: Users,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 lg:px-8">
        <div className="flex flex-col gap-6">
          <span className="w-fit rounded-full border border-white/15 bg-white/5 px-4 py-1 text-sm text-slate-200">
            Meeting Scribe · private MVP
          </span>
          <div className="max-w-3xl space-y-5">
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
              把會議錄音變成逐字稿、重點摘要與待辦事項。
            </h1>
            <p className="text-lg leading-8 text-slate-300">
              這是一個中階版本的會議助理 web app 骨架，先把最重要的流程做出來：錄音 / 上傳、說話者辨識、逐字稿、摘要與會議紀錄頁。
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/meetings/demo"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300"
            >
              直接看 Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/meetings/new"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
            >
              建立新會議
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <Icon className="mb-4 h-6 w-6 text-cyan-300" />
                <h2 className="mb-2 text-lg font-semibold">{feature.title}</h2>
                <p className="text-sm leading-7 text-slate-300">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">最新會議 Demo</p>
                <h3 className="text-2xl font-semibold">{sampleMeeting.title}</h3>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-300">
                {sampleMeeting.status}
              </span>
            </div>
            <p className="mb-6 text-slate-300">{sampleMeeting.summary}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoCard label="長度" value={sampleMeeting.duration} />
              <InfoCard label="說話者" value={`${sampleMeeting.speakers.length} 位`} />
              <InfoCard label="待辦" value={`${sampleMeeting.actions.length} 項`} />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
            <h3 className="mb-4 text-lg font-semibold">目前已完成</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <Bullet text="Prisma schema v2" />
              <Bullet text="首頁與 demo UI" />
              <Bullet text="可擴充成真實轉錄流程的資料結構" />
              <Bullet text="準備接 GitHub private repo" />
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />
      <span>{text}</span>
    </li>
  );
}
