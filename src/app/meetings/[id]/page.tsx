"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, FileText } from "lucide-react";
import { getMeetingHistoryItem, type MeetingHistoryItem } from "@/lib/meeting-history";

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

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<MeetingHistoryItem | null | undefined>(undefined);

  useEffect(() => {
    setMeeting(getMeetingHistoryItem(params.id));
  }, [params.id]);

  if (meeting === undefined) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white lg:px-8">
        <div className="mx-auto max-w-6xl">Loading...</div>
      </main>
    );
  }

  if (!meeting) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/meetings" className="inline-flex items-center gap-2 text-sm text-cyan-300">
              <ArrowLeft className="h-4 w-4" />
              Back to history
            </Link>
            <p className="mt-4 text-sm text-cyan-300">Meeting Detail</p>
            <h1 className="mt-2 text-4xl font-bold">{meeting.title}</h1>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(meeting.createdAt)}</span>
              <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" />{meeting.duration}</span>
              <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" />{meeting.sourceLabel}</span>
            </div>
          </div>
          <span className="w-fit rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-300">
            {meeting.status}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 text-2xl font-semibold">Transcript</h2>
            {meeting.transcript.length > 0 ? (
              <div className="space-y-4">
                {meeting.transcript.map((item, index) => (
                  <article key={`${item.time}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                      <span className="font-medium text-cyan-300">{item.speaker}</span>
                      <span>{item.time}</span>
                    </div>
                    <p className="leading-7 text-slate-100">{item.text}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-5 text-slate-400">
                No structured transcript segments were saved for this item yet.
              </div>
            )}

            {meeting.transcriptText ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                <h3 className="mb-3 text-lg font-semibold text-cyan-200">Full transcript text</h3>
                <p className="whitespace-pre-wrap leading-7 text-slate-200">{meeting.transcriptText}</p>
              </div>
            ) : null}
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-2xl font-semibold">Meeting summary</h2>
              <p className="leading-8 text-slate-200">{meeting.summary}</p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-xl font-semibold">Key points</h3>
              <ul className="space-y-3 text-slate-200">
                {meeting.keyPoints.map((point) => (
                  <li key={point} className="rounded-2xl bg-slate-950/50 px-4 py-3">{point}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-xl font-semibold">Action items</h3>
              <ul className="space-y-3 text-slate-200">
                {meeting.actions.map((action) => (
                  <li key={action} className="rounded-2xl bg-slate-950/50 px-4 py-3">{action}</li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
