"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Sparkles } from "lucide-react";
import { hasAuth, setAuth } from "@/components/app-shell";

const DEMO_USERNAME = process.env.NEXT_PUBLIC_DEMO_USERNAME || "Jason";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || "123456";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState(DEMO_USERNAME);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasAuth()) return;

    void fetch("/api/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = await response.json();
        if (payload?.user) {
          router.replace("/dashboard");
        }
      })
      .catch(() => undefined);
  }, [router]);

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void (async () => {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.error || "帳號或密碼不正確");
        return;
      }

      setAuth(payload.user);
      router.push("/dashboard");
    })();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white lg:px-8">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-1 text-sm text-cyan-200">
            Meeting Scribe · Login required
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
            先登入，再進入你的會議工作台。
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            這一版先加上基本登入門檻。登入後才可以進入首頁、歷史紀錄與新增錄音頁，避免直接裸露主功能頁面。
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <FeatureCard title="登入後才能進主頁" description="未登入會被導回登入頁。" />
            <FeatureCard title="錄音與歷史頁保護" description="/meetings 與 /meetings/new 都有登入檢查。" />
            <FeatureCard title="快速導覽" description="首頁、歷史、新增錄音三頁可互相切換。" />
            <FeatureCard title="後續可升級 OAuth" description="之後再接 Google / GitHub 登入。" />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900 p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-300">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">登入</p>
              <h2 className="text-2xl font-semibold">進入 Meeting Scribe</h2>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">帳號</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none transition focus:border-cyan-300"
                placeholder="Jason"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none transition focus:border-cyan-300"
                placeholder="******"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div>
            ) : null}

            <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300">
              <Sparkles className="h-4 w-4" />
              登入並進入首頁
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
            <p className="font-medium text-cyan-200">目前為 demo 登入</p>
            <p className="mt-2">帳號：Jason</p>
            <p>密碼：123456</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-400">{description}</p>
    </div>
  );
}
