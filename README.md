# Vaani Preflight

**From zero code to launch confidence.**

An independent exploration of what a readiness experience for Vaani voice agents might look like - built as a product management portfolio project by Vigasini K.

> This is not an official Vaani product or feature. It is an independent prototype that uses the Vaani API to demonstrate a product concept.

---

## What this is

Vaani makes building voice agents accessible to anyone. This project investigates the question that naturally follows: how do builders know their agent is ready for real customer conversations?

Preflight is a tool that helps first-time builders:

- **Inspect** their agent configuration against a set of deterministic readiness rules
- **Diagnose** potential customer-experience risks before a live deployment
- **Improve** their configuration with guided, one-click recommendations
- **Validate** using scenario simulations against their current settings
- **Compare** before-and-after states to see exactly what changed
- **Connect** to a real WebRTC session with their live Vaani agent (owner-authenticated)

---

## Live demo

The public demo runs entirely on sample data - no Vaani API credentials required to explore the product.

Owner-authenticated features (real agent listing, live WebRTC sessions, transcript retrieval) require setting `OWNER_SECRET` in your environment and logging in at `/login`.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` at the project root:

```
VAANI_API_KEY=your_vaani_api_key_here
OWNER_SECRET=a_long_random_string_you_choose
```

`VAANI_API_KEY` - your Vaani account API key. Never exposed to the browser.  
`OWNER_SECRET` - a secret you choose that protects owner-only routes. Set this to any long random string (e.g. generate one with `openssl rand -hex 32`).

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture

| Layer | Detail |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + inline styles for responsive layout |
| API | Next.js route handlers (server-side only) |
| Audio | LiveKit client SDK for WebRTC |
| Validation | Zod for request body parsing |
| State | localStorage (`vp_config_v1`, `vp_history_v1`) |
| Auth | HTTP-only session cookie validated server-side |
| Tests | Vitest |

### Security design

- `VAANI_API_KEY` is accessed only in server-side route handlers - never in browser JavaScript, `NEXT_PUBLIC_` variables, or client-side storage.
- All `/api/vaani/*` routes require a valid session cookie. Unauthenticated requests receive a 401.
- The LiveKit JWT forwarded to the browser for WebRTC is short-lived and scoped to a single room.
- The `/api/vaani/webrtc` endpoint is rate-limited to 5 sessions per 10 minutes per IP.
- `call_id` values in transcript requests are validated against a strict format before being passed upstream.

---

## Project structure

```
app/
  page.tsx              - Mission Control (readiness score overview)
  login/page.tsx        - Owner authentication
  connect/page.tsx      - Live Vaani integration (public demo + owner mode)
  preflight/page.tsx    - Agent configuration workspace
  fix/page.tsx          - Fix Studio (guided recommendations)
  scenario/page.tsx     - Scenario Lab (deterministic simulations)
  compare/page.tsx      - Before / After comparison
  product-strategy/     - PM case study
  api/
    auth/               - Login, logout, status endpoints
    vaani/              - Authenticated proxy routes to Vaani API

lib/
  auth.ts               - Session cookie validation
  rate-limit.ts         - In-memory rate limiting
  vaani/client.ts       - Server-side Vaani API client
  preflight/rules.ts    - Deterministic readiness rules
  preflight/scoring.ts  - Weighted scoring model
  store.ts              - localStorage state management
  demo-fixtures.ts      - Sample agent configurations

__tests__/
  preflight.test.ts     - Rule and scoring tests
  store.test.ts         - Fixture and fix-application tests
```

---

## Running tests

```bash
npm test
```

35 tests across 2 files. All deterministic - no mocks of the Vaani API.

---

## Deploying

This project is designed for Vercel. After connecting the repository:

1. Add `VAANI_API_KEY` as a Vercel Secret (Environment Variable).
2. Add `OWNER_SECRET` as a Vercel Secret - use a strong random value, not the placeholder from `.env.local`.
3. Deploy. The public demo works immediately; owner mode requires logging in at `/login`.

Do not commit `.env.local` to version control.

---

## Disclaimer

Vaani Preflight is an independent product exploration. It is not affiliated with, endorsed by, or officially connected to Vaani AI Research. The Vaani API is used with a personal account for demonstration purposes only.

---

*Built by Vigasini K · vigasinimit@gmail.com*
