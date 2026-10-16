# Vaani Preflight - 75–90 Second Demo Script

**Presenter:** Vigasini K · vigasinimit@gmail.com  
**Format:** Screen recording with voiceover  
**Duration:** 75–90 seconds

---

## Script

### 0–15 s - Vaani's opportunity

*(Open the Vaani homepage or agent builder)*

> "Vaani lets anyone build a voice AI agent - you describe what you want, configure it, and it's ready to speak with customers. No engineering team required. That's a genuinely new kind of accessibility in voice AI."

---

### 15–30 s - The next question

*(Cut to Vaani Preflight - Mission Control, showing a below-70 score)*

> "But creating an agent quickly raises a different question: how does a first-time builder know it's actually ready? Without a QA team or a structured way to evaluate readiness, the agent goes live on hope. Preflight is an independent exploration of what a readiness experience might look like."

---

### 30–55 s - One real finding and a fix

*(Navigate to Fix Studio)*

> "Preflight runs deterministic checks against the agent's configuration. This one flagged a critical issue - the escalation rule is missing. When a customer asks to speak with a human, the agent has no clear instruction for how to respond."

*(Click 'Apply Fix')*

> "One click applies the recommended change. The rule re-runs immediately - now passing. The score updates. And if this change isn't right, undo brings it back. This is the full loop: identify the issue, understand why it matters, apply the fix, verify it resolved."

---

### 55–75 s - What changed, what's still needed

*(Navigate to Before / After or show the score delta)*

> "The before and after are visible side by side. The critical blocker is resolved. Two scenarios that were failing now pass. But Preflight is honest about what it can't verify deterministically - a real conversation retest would confirm the fix works in practice."

*(Brief cut to Connect page showing the session flow)*

> "For authenticated owners, Preflight can also initiate a real WebRTC session with the live Vaani agent - mic, speaker, live captions, transcript retrieval. All API credentials stay server-side."

---

### 75–90 s - The product vision

> "Vaani lowers the barrier to building a voice agent. Preflight explores whether an optional readiness experience - surfacing specific gaps, offering guided fixes, enabling real testing - could lower the barrier to deploying one with confidence. That's the bet."

---

## Recording checklist

- [ ] Vaani Preflight is deployed and accessible at the demo URL
- [ ] OWNER_SECRET is set in Vercel environment variables
- [ ] Login tested and session cookie working
- [ ] Mission Control showing demo fixture score (below 70, at least 2 critical blockers)
- [ ] Fix Studio: at least one critical finding with Apply button visible
- [ ] Apply Fix recorded with immediate score update visible
- [ ] Before / After comparison loaded with meaningful delta
- [ ] Connect page accessible (demo mode or owner mode depending on recording context)
- [ ] Audio levels checked before recording
- [ ] Screen resolution set to 1440×900 or similar - avoid ultra-wide
- [ ] Browser zoom at 100%
- [ ] Notifications and system alerts disabled

## What to label clearly in the recording

- Any data that is sample/illustrative: label it "sample data" visually or in voiceover
- Any live API interaction: label it "real Vaani API" or "live data"
- Any simulated result: label it "simulated" - do not imply it represents a real conversation outcome

---

## Storyboard

| Time | Screen | Voiceover focus |
|------|--------|-----------------|
| 0–15s | Vaani platform or agent builder | Vaani's accessibility message |
| 15–30s | Mission Control - low score | The "ready to deploy?" gap |
| 30–40s | Fix Studio - critical finding | Showing a specific, real issue |
| 40–55s | Fix Studio - apply fix, score updates | The fix-and-verify loop |
| 55–65s | Before / After comparison | Evidence of what changed |
| 65–75s | Connect page | Live integration capability |
| 75–90s | Product Strategy page or Mission Control | Vision statement |
