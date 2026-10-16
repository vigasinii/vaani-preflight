# Product Rationale - Vaani Preflight

## Why this is a high-leverage problem

No-code voice agent builders are often non-technical. They configure an agent's objective, write a system prompt, and enable tools - but the relationship between these three things is not enforced by the platform at build time. An agent can be published in a state where:

- The objective says "transfer to a human agent when requested"
- The system prompt says "use @transfer_call"
- The transfer_call tool is disabled and has no destination

The agent goes live. A customer asks for a human. Nothing works. The builder finds out from a complaint or a lost lead, not from the platform.

## The gap

Most agent builders only discover misconfigurations after a bad call. Vaani Preflight moves the discovery forward to before launch - at the moment the builder is still in the configuration UI, before any customer has been affected.

## Why configuration audits have leverage here specifically

Voice agents have asymmetric failure modes. A bad email can be corrected. A bad voice call creates:

- Customer frustration in real time
- An agent that can't gracefully exit the failed state
- A lost lead with no record of what went wrong

A pre-deployment check catches the class of errors that produce these outcomes - specifically, the mismatch between what an agent is supposed to do and what it is actually equipped to do.

## What the audit checks

Five rules, each with a specific failure mode in mind:

| Rule | Failure it prevents |
|------|---------------------|
| HANDOFF_AVAILABILITY | Agent has no tool for a task its objective promises |
| TRANSFER_DESTINATION | Transfer tool enabled but will fail at runtime (no destination) |
| PROMPT_ACTION_MISMATCH | Prompt instructs agent to call a disabled tool |
| ESCALATION_PRIORITY | Agent completes sequential qualification before honoring explicit human request |
| UNRESOLVED_VARIABLES | Customer hears literal {{placeholder}} text |

## Proposed metrics

If Vaani were to ship a version of this, the metrics that would tell you it's working:

- **% of agents launched with zero critical config issues** - should trend toward 100%
- **Time to first configuration-ready agent** - an indicator of builder confidence
- **Support tickets citing "agent couldn't transfer"** - should fall after preflight ships
- **% of human handoff requests that result in a completed transfer** - platform-level, requires call data

## What this is not

This prototype does not:
- Connect to the Vaani platform API
- Read real agent data
- Simulate a live call
- Make any guarantees about runtime behavior

It is a configuration analysis tool - a linter for voice agent setup - that demonstrates the pattern.

## Design principle

The tool surfaces findings in the same UI where the builder can fix them, with a "Go to field" shortcut that scrolls directly to the affected configuration. The assumption is that the faster a builder can see the problem and reach the fix, the more likely they are to fix it before publishing.
