import Link from "next/link";
import { Mic, FileAudio, FileText, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { sampleMeeting } from "@/lib/sample-data";

const features = [
  {
    title: "Record directly in the browser",
    description: "Start, pause, and stop recording to quickly capture a meeting.",
    icon: Mic,
  },
  {
    title: "Upload meeting audio",
    description: "Use existing recordings to test historical meeting data.",
    icon: FileAudio,
  },
  {
    title: "Transcript + summary",
    description: "Generate transcripts, key points, and action items after recording.",
    icon: FileText,
  },
  {
    title: "Speaker identification",
    description: "Separate speakers and leave room for future manual renaming.",
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
              Turn meeting audio into transcripts, summaries, and action items.
            </h1>
            <p className="text-lg leading-8 text-slate-300">
              This is an MVP meeting assistant web app focused on the core workflow first: recording,
              uploading, speaker separation, transcription, summarization, and meeting review pages.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/meetings/demo"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300"
            >
              View demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/meetings/new"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
            >
              Create new meeting
            </Link>
            <Link
              href="/meetings"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 font-medium text-cyan-100 transition hover:bg-cyan-400/15"
            >
              Review history
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
                <p className="text-sm text-slate-400">Latest demo meeting</p>
                <h3 className="text-2xl font-semibold">{sampleMeeting.title}</h3>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-300">
                {sampleMeeting.status}
              </span>
            </div>
            <p className="mb-6 text-slate-300">{sampleMeeting.summary}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoCard label="Duration" value={sampleMeeting.duration} />
              <InfoCard label="Speakers" value={`${sampleMeeting.speakers.length}`} />
              <InfoCard label="Actions" value={`${sampleMeeting.actions.length}`} />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
            <h3 className="mb-4 text-lg font-semibold">Currently included</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <Bullet text="Prisma schema v2" />
              <Bullet text="Landing page and demo UI" />
              <Bullet text="Data structure that can grow into a real transcription flow" />
              <Bullet text="History page prototype (browser local storage)" />
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
