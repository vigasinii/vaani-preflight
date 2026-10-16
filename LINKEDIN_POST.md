# LinkedIn Post Draft

---

I watched a real estate voice agent fail in real time.

A customer said: "Can I speak to a real estate agent?"

The agent had no answer. `transfer_call` was disabled. No destination was configured. The objective said "transfer to a human agent when requested" — but the tool to do it didn't exist.

No warning. No error. Just a customer with nowhere to go.

---

So I built something.

**Vaani Preflight** is a pre-deployment configuration audit for voice agents. Before your agent goes live, it checks:

- Is your handoff tool actually enabled?
- Does your transfer destination exist and match E.164 format?
- Does your system prompt reference tools that are disabled?
- Will the agent immediately honor an escalation request — or finish a 5-question qualification flow first?
- Will your greeting include literal {{placeholder}} text?

Each finding comes with evidence, why it matters, and what to fix.

The broken config scores 56/100. The fixed config scores 100/100. You can watch the delta in real time — the Before/After page shows +44 points with a check-by-check breakdown.

---

This is an independent product concept I built as part of my application to Vaani AI Research.

It doesn't connect to the Vaani platform. It doesn't simulate a live call. It's a configuration linter — a pre-flight check for the class of silent failures that only show up when a real customer is on the line.

GitHub: https://github.com/vigasinii/vaani-preflight
Live demo: https://vaani-preflight.vercel.app

---

Tagging the team who's building this space: [Chandra] [Manjunath] and the Vaani Research Labs team.

Would love to hear whether this pattern resonates with what you're seeing in production.

---

#VoiceAI #ProductDesign #AIAgents #VaaniAI #BuildingInPublic
