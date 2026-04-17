export const sampleMeeting = {
  title: "Product Weekly Demo",
  status: "Completed",
  duration: "32 min",
  speakers: ["JJ", "Product Manager", "Engineer A"],
  summary:
    "This meeting confirmed that the first milestone should focus on a mid-level MVP: recording, audio upload, transcript generation, speaker separation, and meeting summaries. The first phase is all about shipping a usable demo before connecting a production-grade speech pipeline.",
  keyPoints: [
    "Version one will use Next.js + Prisma + PostgreSQL",
    "Deepgram is the leading candidate for speech recognition in a later iteration",
    "The transcript should support speaker labels and timestamps",
  ],
  actions: [
    "Create the initial project structure and landing page",
    "Finish Prisma schema v2",
    "Prepare the recording and upload flow UI",
  ],
  transcript: [
    {
      speaker: "JJ",
      time: "00:00:08",
      text: "I want the first version to be a mid-level MVP, but it still needs to be something we can truly test.",
    },
    {
      speaker: "Product Manager",
      time: "00:00:21",
      text: "Then let's put recording, transcripts, summaries, and speaker identification into version one.",
    },
    {
      speaker: "Engineer A",
      time: "00:00:42",
      text: "Technically that's fine. We should connect to an existing API first so we can move faster.",
    },
  ],
};
