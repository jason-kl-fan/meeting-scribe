export const sampleMeeting = {
  title: "產品週會 Demo",
  status: "處理完成",
  duration: "32 分鐘",
  speakers: ["JJ", "產品經理", "工程師 A"],
  summary:
    "本次會議確認先做中階版本：支援錄音 / 上傳、逐字稿、說話者辨識與會議摘要。第一階段聚焦可用 demo，之後再串接真實語音轉錄服務。",
  keyPoints: [
    "第一版採用 Next.js + Prisma + PostgreSQL",
    "語音辨識優先考慮 Deepgram",
    "逐字稿需支援 speaker labels 與時間戳",
  ],
  actions: [
    "建立專案骨架與首頁",
    "完成 Prisma schema v2",
    "準備錄音 / 上傳流程 UI",
  ],
  transcript: [
    {
      speaker: "JJ",
      time: "00:00:08",
      text: "我想先做一個中階版本，重點是可以真的拿來測試。",
    },
    {
      speaker: "產品經理",
      time: "00:00:21",
      text: "那我們先把錄音、逐字稿、摘要、說話者辨識放進第一版。",
    },
    {
      speaker: "工程師 A",
      time: "00:00:42",
      text: "技術上沒問題，先用現成 API 串接，速度會最快。",
    },
  ],
};
