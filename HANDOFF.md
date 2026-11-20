# CadetSlate session handoff

CadetSlate is a UPSC CAPF (Assistant Commandant) study app for both written papers. The workspace is `D:\prep`, on branch `main` of `Yadavamarjit/prepapp`. The owner has asked for completed app changes to be pushed and made live. Start by checking `git status --short --branch` and the latest commits.

## Where to start

| Area | Production route | Source |
| --- | --- | --- |
| Public homepage and guest entry | [Homepage](https://prepapp-five.vercel.app/) | `src/components/HomePage.tsx`, `src/App.tsx` |
| Daily study plan | [Today](https://prepapp-five.vercel.app/dashboard) | `src/components/DailyPlan.tsx`, `src/utils/dailyPlan.ts`, `server/aiDailyPlan.ts` |
| Official exam scope and chapter catalog | [CAPF syllabus](https://prepapp-five.vercel.app/capf-syllabus#complete-syllabus) | `src/components/CapfSyllabus.tsx`, `src/data/syllabusCatalog.ts` |
| Chapter study and notes | [Learning](https://prepapp-five.vercel.app/learning) | `src/components/LearningHub.tsx`, `src/context/SyllabusContext.tsx` |
| Paper I previous-year question trends | [PYQ subject trends](https://prepapp-five.vercel.app/capf-syllabus#pyq-trends) | `src/data/capfSyllabus.ts`, `src/components/CapfSyllabus.tsx` |
| Timed Paper I practice and attempt reports | [CAPF Analytica](https://prepapp-five.vercel.app/practice/capf-analytica) | `src/components/CapfAnalytica.tsx`, `src/utils/capfAttempt.ts` |
| Paper II writing practice | [Paper II lab](https://prepapp-five.vercel.app/paper-2) | `src/components/Paper2Lab.tsx` |

The public homepage is at `/` and **Start studying** opens `/dashboard`. Study routes and direct links are available without an account, with progress saved in the browser. Optional Google sign-in at `/login` enables the AI tools. `/login?for=ai` opens the AI tutor after sign-in.

## Data and known gaps

- The tracked chapter catalog is [`public/upsc_capf_complete_syllabus.json`](public/upsc_capf_complete_syllabus.json). The root syllabus JSON copies and audit output are ignored. Edit the tracked public copy to update the catalog used by the web app and the backend planner.
- The syllabus page shows the UPSC notice summary and labels the chapter breakdown as a study guide. The daily planner uses unfinished catalog chapters, priorities, topics and references. Chapter completion and daily plans are stored in the browser. The chapter reader links to the matching tutor topic.
- PYQ coverage currently consists of provisional subject totals from an independent index of 620 of 625 Paper I questions from 2022 to 2026. Analytica reports performance on the app's timed sectional. A full, sourced question-by-question PYQ library is still open work.
- This rename updates the visible app name and metadata. The React name comes from `src/data/brand.ts`. Existing `dutydeck_*` browser storage keys, the guest cookie and API request header deliberately retain their original names so existing progress and sessions carry over.

## Build and release

- The frontend is Vite, React and TypeScript. The API is Express. `npm.cmd run lint` checks types, `npm.cmd run build` builds the frontend, and `npm.cmd run build:server` bundles the API on Windows. See `AGENTS.md` for repository instructions.
- Pushing `main` triggers the Vercel production build for project `prepapp`. Check the Vercel status on the exact GitHub commit and confirm the public domain serves the result.
- Vercel proxies `/api/*` to the separate Oracle Cloud backend managed by systemd and Caddy. API changes need a separate release. See [the backend runbook](scripts/deploy/README.md). Keep environment files, credentials, databases and private SSH keys out of Git and handoff messages.
