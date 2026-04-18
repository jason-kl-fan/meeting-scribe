import Link from "next/link";
import { ArrowRight, FileText, History, Mic, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";

const items = [
  {
    title: "開始新的錄音 / 分析",
    description: "進入新增錄音頁，直接錄音或上傳音檔後進行分析。",
    href: "/meetings/new",
    icon: Mic,
  },
  {
    title: "查看歷史紀錄",
    description: "查看之前分析過的會議、摘要、重點與行動項目。",
    href: "/meetings",
    icon: History,
  },
  {
    title: "目前系統重點",
    description: "已接上 PostgreSQL，分析結果可保存到資料庫。",
    href: "/meetings",
    icon: FileText,
  },
];

export default function DashboardPage() {
  return (
    <RequireAuth>
      <AppShell>
        <section className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="max-w-3xl space-y-5">
              <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/5 px-4 py-1 text-sm text-cyan-200">
                Dashboard
              </span>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">歡迎回來，準備開始整理新的會議內容。</h1>
              <p className="text-lg leading-8 text-slate-300">
                這裡是登入後的主頁。你可以從這裡開始新的錄音、上傳音檔，或回頭查看所有歷史分析紀錄。
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/meetings/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300"
                >
                  立即新增錄音
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/meetings"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
                >
                  查看歷史紀錄
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-cyan-300/40 hover:bg-white/7"
                >
                  <Icon className="mb-4 h-6 w-6 text-cyan-300" />
                  <h2 className="text-xl font-semibold">{item.title}</h2>
                  <p className="mt-3 leading-7 text-slate-300">{item.description}</p>
                </Link>
              );
            })}
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
            <div className="mb-3 flex items-center gap-3 text-cyan-200">
              <Users className="h-5 w-5" />
              <span className="font-medium">下一步建議</span>
            </div>
            <p className="text-slate-300">
              如果這版流程 OK，下一階段可以把 demo 登入升級成真正的 Google / GitHub OAuth，並把每位使用者的會議資料真正分開管理。
            </p>
          </div>
        </section>
      </AppShell>
    </RequireAuth>
  );
}
