import { sampleMeeting } from "@/lib/sample-data";

export default function DemoMeetingPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-cyan-300">Meeting Detail Demo</p>
            <h1 className="mt-2 text-4xl font-bold">{sampleMeeting.title}</h1>
            <p className="mt-3 text-slate-300">{sampleMeeting.duration} · {sampleMeeting.status}</p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-xl border border-white/15 px-4 py-2">匯出 Markdown</button>
            <button className="rounded-xl bg-cyan-400 px-4 py-2 font-medium text-slate-950">重新生成摘要</button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 text-2xl font-semibold">逐字稿</h2>
            <div className="space-y-4">
              {sampleMeeting.transcript.map((item) => (
                <article key={`${item.time}-${item.speaker}`} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
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
              <p className="leading-8 text-slate-200">{sampleMeeting.summary}</p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-xl font-semibold">重點整理</h3>
              <ul className="space-y-3 text-slate-200">
                {sampleMeeting.keyPoints.map((point) => (
                  <li key={point} className="rounded-2xl bg-slate-950/50 px-4 py-3">{point}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-xl font-semibold">待辦事項</h3>
              <ul className="space-y-3 text-slate-200">
                {sampleMeeting.actions.map((action) => (
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
