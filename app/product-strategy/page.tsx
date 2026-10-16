"use client";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";

// ─── Tiny primitives ──────────────────────────────────────────────────────────

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return <section id={id} style={{ marginBottom: 48 }}>{children}</section>;
}

function SectionHead({ label, title, sub }: { label: string; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
        {label}
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 6px" }}>{title}</h2>
      {sub && <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{
      background: accent ? "var(--color-accent-tint)" : "var(--color-surface)",
      border: `1px solid ${accent ? "#c4b5fd" : "var(--color-border)"}`,
      borderRadius: "var(--radius-lg)", padding: "20px 24px",
    }}>
      {children}
    </div>
  );
}

function Grid({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
      {children}
    </div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: "green" | "amber" | "blue" | "grey" | "red" }) {
  const s = {
    green: { bg: "var(--color-success-bg)", cl: "var(--color-success)", br: "#6ee7b7" },
    amber: { bg: "var(--color-warning-bg)", cl: "var(--color-warning)", br: "#fde68a" },
    blue: { bg: "#eff6ff", cl: "#2563eb", br: "#bfdbfe" },
    grey: { bg: "var(--color-bg)", cl: "var(--color-text-secondary)", br: "var(--color-border)" },
    red: { bg: "var(--color-danger-bg)", cl: "var(--color-danger)", br: "#fca5a5" },
  }[color];
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: s.bg, color: s.cl, border: `1px solid ${s.br}`, whiteSpace: "nowrap" }}>{children}</span>;
}

function Divider() {
  return <div style={{ height: 1, background: "var(--color-border)", margin: "40px 0" }} />;
}

// ─── Priority matrix ──────────────────────────────────────────────────────────

interface Opportunity {
  title: string;
  impact: number; // 1-5
  effort: number; // 1-5
  inMVP: boolean;
  rationale: string;
}

const OPPORTUNITIES: Opportunity[] = [
  { title: "Escalation & handoff readiness", impact: 5, effort: 2, inMVP: true, rationale: "High-frequency failure mode. Deterministic to check. Directly recoverable by the builder." },
  { title: "Objective-to-capability alignment", impact: 4, effort: 2, inMVP: true, rationale: "Catches mismatches between what the agent is meant to do and what it can do. Low effort to surface." },
  { title: "Budget & business-rule handling", impact: 4, effort: 3, inMVP: true, rationale: "Relevant to real-estate and service-based use cases. Variable resolution is tractable to check." },
  { title: "Autonomous conversation evaluation", impact: 5, effort: 5, inMVP: false, rationale: "High value but requires LLM-in-the-loop evaluation. Significant reliability and cost concerns." },
  { title: "Analytics & performance reporting", impact: 3, effort: 4, inMVP: false, rationale: "Valuable post-launch, but depends on call volume. Premature before first deployment." },
];

function PriorityMatrix() {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
            {["Opportunity", "Impact", "Effort", "In MVP", "Rationale"].map(h => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {OPPORTUNITIES.map((o, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--color-border)", background: o.inMVP ? "var(--color-accent-tint)" : "transparent" }}>
              <td style={{ padding: "10px 12px", fontWeight: 500, color: "var(--color-text-primary)" }}>{o.title}</td>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1,2,3,4,5].map(n => <div key={n} style={{ width: 10, height: 10, borderRadius: 2, background: n <= o.impact ? "var(--color-accent)" : "var(--color-border)" }} />)}
                </div>
              </td>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1,2,3,4,5].map(n => <div key={n} style={{ width: 10, height: 10, borderRadius: 2, background: n <= o.effort ? "#f59e0b" : "var(--color-border)" }} />)}
                </div>
              </td>
              <td style={{ padding: "10px 12px" }}>{o.inMVP ? <Tag color="green">Yes</Tag> : <Tag color="grey">No</Tag>}</td>
              <td style={{ padding: "10px 12px", color: "var(--color-text-secondary)", maxWidth: 320 }}>{o.rationale}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 8, fontStyle: "italic" }}>
        Scores reflect directional product judgment, not measured research. Impact = user value if addressed. Effort = implementation complexity within this prototype scope.
      </div>
    </div>
  );
}

// ─── Journey step ─────────────────────────────────────────────────────────────

function JourneyStep({ step, title, desc, preflightNote }: { step: string; title: string; desc: string; preflightNote?: string }) {
  return (
    <div style={{ display: "flex", gap: 16, padding: "14px 0", borderTop: "1px solid var(--color-border)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", width: 60, flexShrink: 0, paddingTop: 2 }}>{step}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.55, marginBottom: preflightNote ? 8 : 0 }}>{desc}</div>
        {preflightNote && (
          <div style={{ fontSize: 12, color: "var(--color-accent)", padding: "5px 10px", background: "var(--color-accent-tint)", borderRadius: "var(--radius-sm)", borderLeft: "2px solid var(--color-accent)" }}>
            Preflight opportunity: {preflightNote}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Metric row ───────────────────────────────────────────────────────────────

function MetricRow({ label, metric, type }: { label: string; metric: string; type: "primary" | "secondary" | "guardrail" }) {
  const colors = { primary: "green", secondary: "blue", guardrail: "amber" } as const;
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "8px 0", borderTop: "1px solid var(--color-border)" }}>
      <Tag color={colors[type]}>{type}</Tag>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 1 }}>{metric}</div>
      </div>
    </div>
  );
}

// ─── Roadmap item ─────────────────────────────────────────────────────────────

function RoadmapItem({ title, desc, status }: { title: string; desc: string; status: "implemented" | "planned" | "exploratory" }) {
  const s = { implemented: "green", planned: "blue", exploratory: "grey" } as const;
  return (
    <div style={{ display: "flex", gap: 10, padding: "10px 0", borderTop: "1px solid var(--color-border)" }}>
      <Tag color={s[status]}>{status}</Tag>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{desc}</div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProductStrategyPage() {
  const [activeSection, setActiveSection] = useState("opportunity");

  const sections = [
    { id: "opportunity", label: "A. Opportunity" },
    { id: "persona", label: "B. Persona" },
    { id: "journey", label: "C. User Journey" },
    { id: "evidence", label: "D. Evidence" },
    { id: "hypothesis", label: "E. Hypothesis" },
    { id: "prioritization", label: "F. Prioritization" },
    { id: "not-built", label: "G. What We Didn't Build" },
    { id: "metrics", label: "H. Success Metrics" },
    { id: "experiment", label: "I. Experiment Design" },
    { id: "roadmap", label: "J. Roadmap" },
  ];

  return (
    <AppShell breadcrumb="Product Strategy">
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
          Independent Product Exploration · Not an official Vaani feature
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
          Product Strategy
        </h1>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: "0 0 4px", lineHeight: 1.6, maxWidth: 680 }}>
          Vaani makes building voice agents remarkably accessible. This exploration investigates what comes next in that journey — helping builders launch with confidence.
        </p>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, fontStyle: "italic" }}>
          All claims are clearly labeled as hypotheses, directional estimates, or observations from a single exploratory session.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 32, alignItems: "start" }} className="strategy-grid">

        {/* Sticky nav */}
        <nav style={{ position: "sticky", top: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Sections</div>
          {sections.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setActiveSection(s.id)}
              style={{
                display: "block", padding: "5px 10px", fontSize: 12, borderRadius: "var(--radius-sm)",
                color: activeSection === s.id ? "var(--color-accent)" : "var(--color-text-secondary)",
                background: activeSection === s.id ? "var(--color-accent-tint)" : "transparent",
                textDecoration: "none", marginBottom: 2,
              }}
            >
              {s.label}
            </a>
          ))}
        </nav>

        {/* Content */}
        <div>

          {/* A. Opportunity */}
          <Section id="opportunity">
            <SectionHead label="A · Product Opportunity" title="From creation to launch confidence" />
            <Card accent>
              <p style={{ fontSize: 15, fontWeight: 500, color: "var(--color-accent)", margin: "0 0 12px", lineHeight: 1.6 }}>
                "Vaani makes voice agents accessible to everyone. Preflight explores how to make launching those agents with confidence equally accessible."
              </p>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>Core product thesis · Independent exploration</p>
            </Card>

            <div style={{ marginTop: 20, fontSize: 14, color: "var(--color-text-primary)", lineHeight: 1.75 }}>
              <p>
                Low-code and no-code platforms have fundamentally changed who can build software. Vaani extends this to voice AI — a solo founder can design, configure, and publish a voice agent without writing a single line of code.
              </p>
              <p>
                This accessibility shift creates a natural next challenge: builders who can create agents quickly may lack the tools, experience, or dedicated QA support to evaluate whether an agent is ready for real customer conversations. The gap between <em>built</em> and <em>confidently deployed</em> is worth investigating.
              </p>
              <p style={{ margin: 0 }}>
                <strong>Hypothesis:</strong> An optional readiness layer — one that surfaces configuration gaps, offers guided recommendations, and enables controlled testing — could improve first-deployment confidence without adding friction to the core creation flow. This prototype explores what that experience might look like.
              </p>
            </div>
          </Section>

          <Divider />

          {/* B. Persona */}
          <Section id="persona">
            <SectionHead label="B · Target Persona" title="The first-time builder" sub="Primary persona for this exploration. Not based on conducted interviews." />

            <Grid cols={2}>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Profile</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>Solo Founder / Small-Business Operator</div>
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                  Creating a first voice agent for a specific business function — lead qualification, appointment booking, customer support intake — without a dedicated QA or engineering team.
                </div>
              </Card>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Job to Be Done</div>
                <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.6 }}>
                  "Help me know my agent is ready before a real customer talks to it — without needing to set up a full QA process."
                </div>
              </Card>
            </Grid>

            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Desired Outcome</div>
                <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.55 }}>Deploy with enough confidence to expose the agent to real customers within days of first creation.</div>
              </Card>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Friction Points</div>
                <ul style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.55, paddingLeft: 16, margin: 0 }}>
                  <li>Unsure which configuration gaps matter most</li>
                  <li>No easy way to test realistic conversation flows</li>
                  <li>No signal for what "good enough" looks like</li>
                </ul>
              </Card>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Constraints</div>
                <ul style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.55, paddingLeft: 16, margin: 0 }}>
                  <li>No dedicated QA team</li>
                  <li>Limited time before intended launch date</li>
                  <li>Low tolerance for false alarms or excessive setup</li>
                </ul>
              </Card>
            </div>

            <div style={{ marginTop: 12 }}>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-success)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Success Moment</div>
                <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.6 }}>
                  "I ran the checks, fixed the two things it flagged, tested a conversation, and deployed. It took 20 minutes. My agent is live."
                </div>
              </Card>
            </div>
          </Section>

          <Divider />

          {/* C. Journey */}
          <Section id="journey">
            <SectionHead label="C · User Journey" title="Where Preflight fits" sub="The full builder journey, with opportunities for a readiness experience." />
            <Card>
              <JourneyStep step="Create" title="Build an agent on Vaani" desc="The builder designs the agent's objective, configures its voice, and writes the system prompt. Vaani makes this fast and accessible — often completed in a single session." />
              <JourneyStep step="Configure" title="Set tools, variables, and rules" desc="Transfer destinations, callback options, and dynamic variables are added. This is where most configuration errors are introduced — silently." preflightNote="Deterministic checks surface issues at configuration time, before any call is attempted." />
              <JourneyStep step="Test" title="Evaluate readiness" desc="Without a structured tool, the builder might call their own agent number or share it with a friend. Coverage is limited and findings are informal." preflightNote="Scenario Lab runs deterministic conversation simulations. Connect enables a real WebRTC session against the live agent." />
              <JourneyStep step="Launch" title="Expose to real customers" desc="The agent goes live. Issues that weren't caught in testing appear in real conversations — often identified through customer complaints or missed leads." preflightNote="The readiness score and blocking issue list provide a structured launch gate the builder can apply on their own terms." />
              <JourneyStep step="Learn" title="Improve based on outcomes" desc="Call data, transcripts, and customer feedback inform the next iteration. Without tooling, this loop is slow and reactive." preflightNote="Transcript retrieval and before/after comparison surface evidence for improvement decisions." />
            </Card>
          </Section>

          <Divider />

          {/* D. Evidence */}
          <Section id="evidence">
            <SectionHead label="D · Discovery Evidence" title="One exploratory session" />
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid #fde68a", fontSize: 12, color: "var(--color-text-primary)", marginBottom: 16, lineHeight: 1.6 }}>
              <strong>Important:</strong> The following describes a single exploratory test session with one agent configuration. It is not representative of platform behavior broadly, and no causal claims are made about Vaani's architecture or defaults.
            </div>

            <Card>
              <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.75 }}>
                <p style={{ margin: "0 0 12px" }}>
                  A real-estate lead qualification agent was tested in a simulated buyer conversation. The session surfaced several observable patterns worth noting as potential configuration considerations:
                </p>
                <ul style={{ paddingLeft: 18, margin: "0 0 12px" }}>
                  <li style={{ marginBottom: 6 }}>The agent was configured with an advertised property starting at ₹80 lakh. When the test customer stated a budget of ₹65 lakh — below the starting price — the conversation continued without a clear resolution of this mismatch.</li>
                  <li style={{ marginBottom: 6 }}>The test customer explicitly requested to speak with a human agent. The conversation continued beyond this request without a documented transfer or callback outcome.</li>
                  <li style={{ marginBottom: 0 }}>The session ended before either of these situations reached a clear conclusion in the transcript.</li>
                </ul>
                <p style={{ margin: 0, fontStyle: "italic", color: "var(--color-text-secondary)" }}>
                  These observations informed the hypothesis that configuration checks for handoff readiness and business-rule handling could be valuable to first-time builders. They do not represent platform-wide behavior or verified failure modes.
                </p>
              </div>
            </Card>
          </Section>

          <Divider />

          {/* E. Hypothesis */}
          <Section id="hypothesis">
            <SectionHead label="E · Opportunity Hypothesis" title="The specific bet" />
            <Card accent>
              <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-accent)", lineHeight: 1.65, margin: "0 0 12px" }}>
                "An optional readiness experience — surfacing actionable configuration risks before a first deployment — could help first-time builders identify and resolve the issues most likely to affect early customer conversations."
              </div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                This is a hypothesis, not a proven outcome. Validation requires measuring actual deployment rates and customer experience signals.
              </div>
            </Card>

            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>If true</div>
                <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.55 }}>More first-time builders successfully deploy within days of creation. Early customer conversations are more likely to reach a useful outcome.</div>
              </Card>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Risks</div>
                <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.55 }}>Readiness checks add perceived friction. False positives or over-engineering warnings could delay deployments unnecessarily.</div>
              </Card>
            </div>
          </Section>

          <Divider />

          {/* F. Prioritization */}
          <Section id="prioritization">
            <SectionHead label="F · Prioritization" title="What we built and why" sub="Impact vs. effort across candidate opportunities. Scores are directional, not measured." />
            <PriorityMatrix />

            <div style={{ marginTop: 20, fontSize: 14, color: "var(--color-text-primary)", lineHeight: 1.75 }}>
              <p style={{ margin: "0 0 10px" }}>
                The MVP focuses on the three highest-impact, lowest-effort opportunities. All three share a key property: they are <strong>deterministic to check</strong> — no inference, no LLM evaluation, no external call needed. A rule either passes or it does not.
              </p>
              <p style={{ margin: 0 }}>
                This keeps the experience fast, reliable, and explainable. A builder who sees a failing check can understand exactly why and act on it immediately.
              </p>
            </div>
          </Section>

          <Divider />

          {/* G. What we didn't build */}
          <Section id="not-built">
            <SectionHead label="G · What We Deliberately Did Not Build" title="Scope restraint as a product decision" />

            {[
              {
                title: "Mandatory deployment blockers",
                why: "A readiness tool that forces resolution before launch creates friction and positions Preflight as a gatekeeper. The right role for this tool — especially at this stage — is advisory, not mandatory. Builders decide when they're ready.",
              },
              {
                title: "Large autonomous conversation evaluation suites",
                why: "LLM-in-the-loop evaluation is high-cost, non-deterministic, and difficult to explain to a non-technical user. The reliability bar for an advisory tool needs to be very high — 'your agent failed scenario 12' without a clear, verifiable reason undermines trust.",
              },
              {
                title: "Complex analytics dashboards",
                why: "Analytics require call volume to be meaningful. A first-time builder with 0–10 calls doesn't benefit from a performance dashboard. Building it now would be premature and misleading.",
              },
              {
                title: "AI-generated performance scores",
                why: "Unverified AI judgments presented as scores invite false confidence. The deterministic scoring model used here is explainable and consistent. Adding AI-generated signals would reduce auditability without a proportionate benefit.",
              },
              {
                title: "Enterprise workflow management",
                why: "Multi-user approval flows, role-based access, and integration with CI/CD pipelines are valid long-term directions. They are not the right first bet for a tool aimed at solo builders without a team.",
              },
            ].map((row, i) => (
              <div key={i} style={{ padding: "16px 0", borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 6 }}>{row.title}</div>
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{row.why}</div>
              </div>
            ))}
          </Section>

          <Divider />

          {/* H. Metrics */}
          <Section id="metrics">
            <SectionHead label="H · Success Metrics" title="How we'd know if this works" />
            <Card>
              <MetricRow
                type="primary"
                label="Successful first deployment within 7 days of agent creation"
                metric="The core activation moment. If Preflight improves this rate among builders who use it, the hypothesis has evidence."
              />
              <MetricRow
                type="secondary"
                label="Readiness review adoption rate"
                metric="What percentage of builders who create an agent run at least one readiness check before deploying."
              />
              <MetricRow
                type="secondary"
                label="Percentage of actionable findings addressed"
                metric="Among builders who see critical findings, how many apply at least one fix before deploying."
              />
              <MetricRow
                type="secondary"
                label="Time from creation to first deployment"
                metric="Does Preflight shorten this window (better confidence) or lengthen it (added friction)? Both are informative."
              />
              <MetricRow
                type="secondary"
                label="Early-session unresolved-request rate"
                metric="From real session transcripts: are customer requests reaching a clear resolution more often after a readiness review."
              />
              <MetricRow
                type="guardrail"
                label="Increased time to deploy"
                metric="If median time to deploy increases significantly for Preflight users, we are adding friction without sufficient value."
              />
              <MetricRow
                type="guardrail"
                label="Excessive warnings or false positives"
                metric="If more than 30% of Preflight sessions result in no actionable findings on an agent that later works well, the checks may be too aggressive."
              />
            </Card>
          </Section>

          <Divider />

          {/* I. Experiment */}
          <Section id="experiment">
            <SectionHead label="I · Experiment Design" title="How we'd test the hypothesis" sub="A proposed optional-exposure A/B test. Not yet run. No measured outcomes to report." />

            <Grid cols={2}>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Hypothesis</div>
                <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.6 }}>
                  Builders who complete a Preflight readiness review before their first deployment will have a higher 7-day activation rate than those who do not.
                </div>
              </Card>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Target Cohort</div>
                <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.6 }}>
                  Builders who have created their first agent but have not yet made it public or received inbound calls. Exclude builders with prior deployment history.
                </div>
              </Card>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Exposure Conditions</div>
                <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.6 }}>
                  <strong>Control:</strong> Current launch flow, no Preflight nudge.<br />
                  <strong>Treatment:</strong> Optional "Review readiness before launch" prompt on the agent detail page. Not modal, not blocking.
                </div>
              </Card>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Decision Framework</div>
                <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.6 }}>
                  Ship a non-blocking entry point if treatment shows improvement with no significant increase in time-to-deploy. Pause if abandonment increases or time-to-deploy worsens meaningfully.
                </div>
              </Card>
            </Grid>

            <div style={{ marginTop: 12 }}>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-warning)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Guardrails</div>
                <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.6 }}>
                  Stop the experiment early if: setup abandonment increases by more than 10% in the treatment group, or if median time-to-deploy in the treatment group exceeds 2× the control group's median. Neither outcome has been measured — these are proposed thresholds.
                </div>
              </Card>
            </div>
          </Section>

          <Divider />

          {/* J. Roadmap */}
          <Section id="roadmap">
            <SectionHead label="J · Product Roadmap" title="What exists, what's next, and what's exploratory" />

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 10 }}>Now · In this prototype</div>
              <RoadmapItem status="implemented" title="Deterministic configuration checks" desc="Six rules covering handoff availability, transfer destination validity, capability alignment, variable resolution, and escalation language." />
              <RoadmapItem status="implemented" title="Guided one-click recommendations" desc="Fix Studio applies configuration changes locally with undo support and immediate re-validation." />
              <RoadmapItem status="implemented" title="Clear local-vs-live state labeling" desc="Every change is explicitly marked as affecting local configuration. No change is presented as saved to the real Vaani agent without confirmation." />
              <RoadmapItem status="implemented" title="Deterministic scenario evaluation" desc="Nine conversation scenarios run against the current configuration and return pass/warn/fail with an auditable trace." />
              <RoadmapItem status="implemented" title="Live WebRTC session (owner only)" desc="Authenticated owner can initiate a real session with their Vaani agent, with microphone capture, agent audio, live captions, and transcript retrieval." />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 10 }}>Next · Highest-confidence follow-on</div>
              <RoadmapItem status="planned" title="Real-session transcript evaluation" desc="After a live session, surface specific utterances that match known risk patterns — budget mismatches, unresolved escalation requests — directly from the transcript." />
              <RoadmapItem status="planned" title="Evidence-backed scenario retesting" desc="After a configuration change, flag which scenarios were previously failing and require a retest rather than showing 'Resolved' prematurely." />
              <RoadmapItem status="planned" title="Vaani configuration write-back" desc="Apply selected fixes directly to the configured agent via Vaani API, with explicit confirmation and clear labeling of what changed." />
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 10 }}>Later · Exploratory directions</div>
              <RoadmapItem status="exploratory" title="Industry-specific readiness templates" desc="Pre-built rule sets for common use cases — real estate, healthcare intake, e-commerce support — reducing setup time for the most common agent types." />
              <RoadmapItem status="exploratory" title="Aggregate insights from consenting users" desc="Anonymized signals across readiness reviews could surface which configuration gaps are most common, informing both the tool and Vaani's product direction." />
              <RoadmapItem status="exploratory" title="Collaborative review flows" desc="Allow a team member or advisor to review and comment on readiness findings before deployment — relevant for slightly larger organizations." />
            </div>
          </Section>

        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .strategy-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 900px) nav[style*="sticky"] { position: static !important; }
      `}</style>
    </AppShell>
  );
}
