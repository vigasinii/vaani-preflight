# Vaani Preflight — 90-Second Demo Script

## Setup
- Browser open at localhost:3000
- No preflight run yet — empty results panel visible

---

## [0:00 – 0:10] Open with the problem

> "During testing, a real estate agent called Riya failed to handle a simple customer request — 'Can I speak to a real estate agent?' I watched it happen. The agent had no path to complete the request. transfer_call was disabled and no destination was configured. There was no warning before launch."

_Point to the amber notice in the empty results panel._

---

## [0:10 – 0:25] Show the broken config

> "This is the exact configuration that failed. You can see transfer_call is disabled, destination is empty. The objective says 'transfer to a human agent when requested' — but there's no tool to do it."

_Scroll through the left config panel. Show tools section. Show objective text._

---

## [0:25 – 0:40] Run Preflight

> "Let me run the preflight check."

_Click **Run Preflight**. Wait for the 800ms animation._

> "Score: 22. Not Ready. Two critical issues, two warnings. The top finding: No handoff tool enabled. The agent's objective requires transfer but no compatible tool exists."

_Click the first finding to expand it. Show evidence, why it matters, recommended action._

---

## [0:40 – 0:55] Fix and re-run

> "Let me fix it. Enable transfer_call, add a phone number."

_Toggle transfer_call on. Type +919876543210 in the destination field._

_Click **Run Preflight** again._

> "Score jumps from 22 to 78. The blocking issue is gone. Delta shows 22 → 78."

---

## [0:55 – 1:10] Run Simulation

> "Now let's simulate the same scenario that failed."

_Click **Run Simulation**._

> "With the transfer configured, the simulated response is: 'Of course! Let me connect you with one of our real estate representatives.' Before, it had nothing to say."

_Point to the limitations disclaimer: 'Configuration simulation — not a live Vaani call.'_

---

## [1:10 – 1:20] Export and close

> "Export downloads a redacted JSON report — phone numbers are masked — suitable for sharing with a client or logging pre-launch state."

_Click **Export Report**. Show filename in downloads._

> "That's Vaani Preflight. A pre-deployment safety net for voice agent builders."

---

## Recording notes
- Record at 1280×800 or 1440×900
- Use a clean browser profile with no extensions visible
- Keep the left panel scrolled to show the Tools section during fix
- Do not record personal phone numbers — use +919876543210 (the demo number)
