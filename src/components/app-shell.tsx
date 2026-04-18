"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, History, Mic, LogOut } from "lucide-react";
import { clearSessionUser, getSessionUser, setSessionUser } from "@/lib/session-client";

const links = [
  { href: "/dashboard", label: "首頁", icon: Home },
  { href: "/meetings", label: "歷史紀錄", icon: History },
  { href: "/meetings/new", label: "新增錄音", icon: Mic },
];

export function clearAuth() {
  clearSessionUser();
}

export function setAuth(user?: { username: string; displayName: string }) {
  setSessionUser(user || { username: "Jason", displayName: "Jason" });
}

export function hasAuth() {
  return Boolean(getSessionUser());
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm text-cyan-300">Meeting Scribe</p>
            <h1 className="text-lg font-semibold text-white">會議助理工作台</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-cyan-400 text-slate-950"
                      : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}

            <button
              onClick={() => {
                void fetch("/api/session", { method: "DELETE" }).finally(() => {
                  clearAuth();
                  router.push("/");
                });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-400/15"
            >
              <LogOut className="h-4 w-4" />
              登出
            </button>
          </div>
        </div>
      </div>

      {children}
    </main>
  );
}
