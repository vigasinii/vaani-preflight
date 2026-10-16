# Vaani Preflight — Agent Launch Readiness Checker

An independent product concept built for the Vaani AI Research hiring submission.

## Problem

Voice agents built on no-code platforms can be misconfigured in ways that silently break critical user flows. During real-world testing of an Amaze Developers real estate agent, a customer said: _"Can I speak to a real estate agent?"_ — the agent had no path to fulfill this request because `transfer_call` was disabled with no destination configured.

The agent couldn't help. There was no warning before launch.

## What Vaani Preflight Does

Vaani Preflight is a pre-deployment configuration audit tool that catches critical issues before the first customer call:

- **Handoff Availability** — detects when an agent's objective requires human transfer but no tool is enabled
- **Transfer Destination** — validates E.164 phone number format when transfer_call is enabled
- **Prompt/Action Mismatch** — flags when the system prompt references a disabled tool
- **Escalation Priority** — checks whether the prompt makes escalation timing explicit
- **Unresolved Variables** — catches `{{placeholder}}` text that would appear in live calls

Each finding includes severity, evidence, why it matters, and a recommended action.

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS v4
- Zod for validation
- Vitest for unit tests

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test
```

15 unit tests covering all 5 rules, scoring, simulation, and export redaction.

## Typecheck

```bash
npm run typecheck
```

## Build

```bash
npm run build
```

## Architecture

```
types/agent.ts          — Zod schemas and TypeScript types
lib/
  demo-fixtures.ts      — Broken and fixed agent config fixtures
  export.ts             — JSON export with phone number redaction
  preflight/
    rules.ts            — 5 lint rules, each returns RuleResult
    scoring.ts          — Weighted score computation
    variables.ts        — Greeting preview with variable resolution
    simulation.ts       — Handoff scenario simulation
    engine.ts           — Orchestrates rules → PreflightResult
app/
  page.tsx              — Full interactive UI
  layout.tsx            — Root layout with metadata
__tests__/
  preflight.test.ts     — 15 unit tests
```

## Demo Flow

1. Page loads with the broken Amaze Developers fixture (transfer_call disabled, no destination)
2. Click **Run Preflight** — score renders with critical and warning findings
3. Enable transfer_call in the Tools panel, enter a phone number
4. Run Preflight again — score improves, score delta shown
5. Click **Run Simulation** — see simulated agent response for the handoff scenario
6. Click **Export Report** — downloads redacted JSON

## Disclaimer

This tool performs local configuration analysis only. It does not connect to the Vaani platform, does not read live agent data, and does not simulate a real phone call. Scores and findings are based on static rule evaluation of the loaded configuration.

---

Independent product concept by Vigasini · For Vaani AI Research
