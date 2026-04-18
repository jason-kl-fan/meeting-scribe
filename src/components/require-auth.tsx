"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuth, hasAuth } from "@/components/app-shell";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasAuth()) {
      router.replace("/");
      return;
    }

    void fetch("/api/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("UNAUTHORIZED");
        }
        const payload = await response.json();
        if (!payload?.user) {
          throw new Error("UNAUTHORIZED");
        }
        setReady(true);
      })
      .catch(() => {
        clearAuth();
        router.replace("/");
      });
  }, [router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-slate-300">
          正在確認登入狀態...
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
