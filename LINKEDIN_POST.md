# LinkedIn Post

---

Vaani makes it genuinely easy to build a voice AI agent. You describe what you want, configure a few settings, and you have something ready to talk to customers — no engineering required.

Which made me curious about what comes next in that journey.

When creation is this accessible, the limiting factor shifts from "can I build it?" to "how do I know it's ready?" A first-time builder deploying their first agent doesn't have a QA team, a staging environment, or a way to systematically evaluate whether their configuration will hold up in a real conversation.

So I built Preflight — an independent exploration of what a launch-readiness experience for Vaani agents might look like.

The core idea: run deterministic checks against an agent's configuration, surface specific gaps with evidence, and offer guided recommendations the builder can apply and immediately re-validate.

A few things I learned building it:

**Deterministic checks beat AI evaluation for first-pass readiness.** A rule that verifies whether a transfer destination is in E.164 format is fast, consistent, and explainable. An LLM that evaluates conversation quality is none of those things at this stage.

**Local vs. live state matters more than I expected.** Making it obvious that a change exists only in the tool — not in the real Vaani agent — turned out to be one of the more important design decisions. "Locally applied" and "saved to agent" are very different things.

**Restraint is a product decision.** The most useful version of this tool does three things well, not ten things adequately.

The prototype includes a real Vaani API integration: authenticated agent listing, WebRTC sessions via LiveKit, live captions, and transcript retrieval. Everything privileged runs server-side — the API key never touches the browser.

I wrote up the full product strategy in the app, including the opportunity framing, prioritization decisions, success metrics, and an experiment design.

GitHub: https://github.com/vigasinii/vaani-preflight  
Live demo: https://vaani-preflight.vercel.app

*Independent exploration — not an official Vaani product.*

---

*Author: Vigasini K · vigasinimit@gmail.com*
