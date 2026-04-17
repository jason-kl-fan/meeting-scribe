# Meeting Scribe

A private MVP for a meeting recording web app.

## Current scope

- Next.js app router frontend
- Prisma schema v2 for meetings / speakers / transcript / summary
- Demo homepage
- New meeting page UI
- Demo meeting detail page

## Planned next steps

- Connect PostgreSQL + Prisma migrations
- Add audio upload flow
- Add recording flow with MediaRecorder
- Connect transcription provider
- Connect summary generation

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000
