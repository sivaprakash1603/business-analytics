# Copilot instructions for this repo

Project type: Next.js 14 (App Router) + Tailwind + shadcn/ui. Data in MongoDB; auth via Supabase (client-side); AI via Google Gemini with offline fallbacks.

Big picture architecture
- UI lives under `app/**` and `components/**`; API routes live under `app/api/**` (serverless handlers).
- Auth: `components/auth-provider.tsx` uses Supabase; on sign-in/up it mirrors a user record to Mongo (`app/api/users/*`). All other collections are keyed by `userId` (Supabase user id).
- Data flow (AI Insights): `app/ai-insights/page.tsx` fetches `/api/{income,spending,loans,clients}`, computes analytics via `lib/advanced-analytics.ts`, then calls `POST /api/ai-chat` with `{ message, businessData, context }`. The API uses `@google/genai` and falls back to rule‑based responses if the key is missing.
- Real-time dashboard: `hooks/use-realtime-data.ts` polls `GET /api/dashboard/realtime` and exposes connection state; `components/realtime-data-provider.tsx` displays status.

Developer workflows
- Run dev: `npm run dev` (Next.js). Build/start: `npm run build` → `npm start`. Lint: `npm run lint`. No test runner present.
- Environment: create `.env.local` with at least:
  - `MONGODB_URI` (and optional `MONGODB_DB`)
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `GEMINI_API_KEY` (for `/api/ai-chat`)
  - `GMAIL_USER`, `GMAIL_APP_PASSWORD` (for `/api/send-email`)
  - `NEXT_PUBLIC_NEWS_API_KEY` (news; mocked if missing)
  - `CRON_SECRET`, `EMAIL_API_URL` (for `/api/todo-reminder` + GitHub Action)
- Docs: see `docs/GEMINI_SETUP.md` and `docs/ADVANCED_ANALYTICS.md` for model and analytics details.

API conventions and collections
- Mongo connection: `lib/mongo.js` (`connectToDatabase()`); collections used: `user`, `income`, `spending`, `loans`, `clients`, `todos`.
- Request/response shapes (keep stable for pages):
  - GET `/api/income|spending|loans|todos` → `{ entries: [...] }`
  - GET `/api/clients` → `{ clients: [...] }`
  - POST create requires `userId`; typical fields include `createdAt` ISO string. Amounts are numbers (spending GET normalizes legacy strings).
  - Clients POST accepts encrypted payloads: when `__encrypted: true`, server stores `encrypted` blob as-is (no server decryption). See `app/api/clients/route.js`.
- Realtime route returns: `{ summary, recentActivity, latestTransactions, trends }` with small capped lists; follow that shape for consumers.

AI integration
- Gemini model: default `gemini-2.0-flash-exp`. System prompt and history are built in `app/api/ai-chat/route.ts` (see the first `history` entry). Change model/persona there. If `GEMINI_API_KEY` is absent or API fails, code falls back to `generateEnhancedResponse()`.
- Client sends last 6 messages as context; keep responses short, actionable, and markdown-friendly.

Patterns and examples to follow
- New API handlers: mirror existing files (e.g., `app/api/income/route.js`), use `connectToDatabase()`, validate inputs, return `NextResponse.json(...)` with consistent shapes.
- Analytics: prefer computing client/trend/risk metrics via `lib/advanced-analytics.ts` and `lib/business-data.ts` to keep logic centralized.
- Real-time: use `useRealTimeData({ enabled, interval, onDataUpdate })` and surface status via `RealTimeDataProvider`.

Integration notes and gotchas
- Supabase env vars are required at import time in `lib/supabase.ts` (throws if missing) — guard client-only usage in browser code.
- Email and cron: `app/api/todo-reminder/route.js` authorizes via `Authorization: Bearer ${CRON_SECRET}`; GH Actions call this endpoint on a schedule (`.github/workflows/*`).
- News API gracefully falls back to mock data if `NEXT_PUBLIC_NEWS_API_KEY` is absent.
- When touching data models, preserve field names used in pages (e.g., `amount`, `date`, `userId`, `clientId`).

If anything here is unclear or you need deeper examples (e.g., adding a secured route, extending the AI prompt, or data model changes), ask which area to expand and I’ll augment this file.