"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, FileText, History, Sparkles } from "lucide-react";
import { loadMeetingHistory, type MeetingHistoryItem } from "@/lib/meeting-history";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center">
      <History className="mx-auto h-10 w-10 text-slate-500" />
      <h2 className="mt-4 text-2xl font-semibold">No saved meeting history yet</h2>
      <p className="mt-3 text-slate-400">
        Finish one analysis in <span className="text-cyan-200">/meetings/new</span>, and it will appear here.
      </p>
      <Link
        href="/meetings/new"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 font-medium text-slate-950"
      >
        Create new meeting
      </Link>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function MeetingsHistoryPage() {
  const [items, setItems] = useState<MeetingHistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void loadMeetingHistory()
      .then((nextItems) => {
        if (cancelled) return;
        setItems(nextItems);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalActions = useMemo(
    () => items.reduce((sum, item) => sum + item.actions.length, 0),
    [items],
  );

  return (
    <RequireAuth>
      <AppShell>
        <div className="mx-auto max-w-6xl space-y-8 px-6 py-12 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm text-cyan-300">Meeting History</p>
              <h1 className="mt-2 text-4xl font-bold">Review previous meeting analyses</h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                This page now reads meeting history from the database, so your previous analyses are preserved across
                browser restarts and devices.
              </p>
            </div>
            <Link
              href="/meetings/new"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 font-medium text-slate-950"
            >
              <Sparkles className="h-4 w-4" />
              New meeting
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Saved meetings" value={loaded ? String(items.length) : "..."} />
            <StatCard label="Total action items" value={loaded ? String(totalActions) : "..."} />
            <StatCard label="Storage mode" value="PostgreSQL" />
          </div>

          {!loaded ? null : items.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/meetings/${item.id}`}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-cyan-300/40 hover:bg-white/7"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-semibold">{item.title}</h2>
                        <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-300">
                          {item.status}
                        </span>
                      </div>
                      <p className="max-w-3xl leading-7 text-slate-300">{item.summary}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                        <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(item.createdAt)}</span>
                        <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" />{item.duration}</span>
                        <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" />{item.sourceLabel}</span>
                      </div>
                    </div>
                    <div className="grid min-w-52 gap-3 sm:grid-cols-3 md:grid-cols-1">
                      <MiniStat label="Key points" value={String(item.keyPoints.length)} />
                      <MiniStat label="Actions" value={String(item.actions.length)} />
                      <MiniStat label="Transcript lines" value={String(item.transcript.length)} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </RequireAuth>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
