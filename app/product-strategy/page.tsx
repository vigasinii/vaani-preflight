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

function EvidenceBlock({ step, label, caption, img, alt, highlight, highlightColor }: {
  step: string; label: string; caption: string; img: string; alt: string;
  highlight?: boolean; highlightColor?: "amber" | "red";
}) {
  const borderColor = highlight
    ? highlightColor === "red" ? "#fca5a5" : "#fde68a"
    : "var(--color-border)";
  const bg = highlight
    ? highlightColor === "red" ? "var(--color-danger-bg)" : "var(--color-warning-bg)"
    : "var(--color-surface)";
  return (
    <div style={{ border: `1px solid ${borderColor}`, borderRadius: "var(--radius-lg)", overflow: "hidden", background: bg }}>
      <div style={{ padding: "10px 16px", borderBottom: `1px solid ${borderColor}`, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", flexShrink: 0 }}>Step {step}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{label}</span>
        {highlight && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: highlightColor === "red" ? "var(--color-danger-bg)" : "var(--color-warning-bg)", color: highlightColor === "red" ? "var(--color-danger)" : "var(--color-warning)", border: `1px solid ${highlightColor === "red" ? "#fca5a5" : "#fde68a"}` }}>KEY FINDING</span>}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={alt} style={{ width: "100%", display: "block", maxHeight: 420, objectFit: "cover", objectPosition: "top" }} />
      <div style={{ padding: "10px 16px", fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.65, borderTop: `1px solid ${borderColor}` }}>{caption}</div>
    </div>
  );
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
  const cfg = {
    implemented: { dot: "#16815D", labelColor: "#16815D" },
    planned:     { dot: "#2563eb", labelColor: "#2563eb" },
    exploratory: { dot: "#94a3b8", labelColor: "#94a3b8" },
  }[status];
  return (
    <div style={{ padding: "16px 0", borderTop: "1px solid var(--color-border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot, flexShrink: 0, display: "inline-block" }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.labelColor, textTransform: "uppercase", letterSpacing: "0.07em" }}>{status}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>{title}</span>
      </div>
      <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.65, paddingLeft: 16 }}>{desc}</div>
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

  const currentIdx = sections.findIndex(s => s.id === activeSection);
  const prev = sections[currentIdx - 1];
  const next = sections[currentIdx + 1];

  return (
    <AppShell breadcrumb="Product Strategy">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 4px" }}>
          Product Strategy
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
          What exists, what's next, and what's exploratory.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 28, borderBottom: "1px solid var(--color-border)", paddingBottom: 0 }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              padding: "7px 14px", fontSize: 12, fontWeight: activeSection === s.id ? 600 : 400,
              color: activeSection === s.id ? "var(--color-accent)" : "var(--color-text-secondary)",
              background: "none", border: "none",
              borderBottom: activeSection === s.id ? "2px solid var(--color-accent)" : "2px solid transparent",
              cursor: "pointer", marginBottom: -1, borderRadius: 0, whiteSpace: "nowrap",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Content - single section at a time */}
      <div style={{ maxWidth: 800 }}>

          {/* A. Opportunity */}
          {activeSection === "opportunity" && <Section id="opportunity">
            <SectionHead label="A · Product Opportunity" title="From creation to launch confidence" />
            <Card accent>
              <p style={{ fontSize: 15, fontWeight: 500, color: "var(--color-accent)", margin: "0 0 12px", lineHeight: 1.6 }}>
                "Vaani makes voice agents accessible to everyone. Preflight explores how to make launching those agents with confidence equally accessible."
              </p>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>Core product thesis · Independent exploration</p>
            </Card>

            <div style={{ marginTop: 20, fontSize: 14, color: "var(--color-text-primary)", lineHeight: 1.75 }}>
              <p>
                Low-code and no-code platforms have fundamentally changed who can build software. Vaani extends this to voice AI - a solo founder can design, configure, and publish a voice agent without writing a single line of code.
              </p>
              <p>
                This accessibility shift creates a natural next challenge: builders who can create agents quickly may lack the tools, experience, or dedicated QA support to evaluate whether an agent is ready for real customer conversations. The gap between <em>built</em> and <em>confidently deployed</em> is worth investigating.
              </p>
              <p style={{ margin: 0 }}>
                <strong>Hypothesis:</strong> An optional readiness layer - one that surfaces configuration gaps, offers guided recommendations, and enables controlled testing - could improve first-deployment confidence without adding friction to the core creation flow. This prototype explores what that experience might look like.
              </p>
            </div>
          </Section>}

          {/* B. Persona */}
          {activeSection === "persona" && <Section id="persona">
            <SectionHead label="B · Target Persona" title="The first-time builder" sub="Primary persona for this exploration. Not based on conducted interviews." />

            <Grid cols={2}>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Profile</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>Solo Founder / Small-Business Operator</div>
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                  Creating a first voice agent for a specific business function - lead qualification, appointment booking, customer support intake - without a dedicated QA or engineering team.
                </div>
              </Card>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Job to Be Done</div>
                <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.6 }}>
                  "Help me know my agent is ready before a real customer talks to it - without needing to set up a full QA process."
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
          </Section>}

          {/* C. Journey */}
          {activeSection === "journey" && <Section id="journey">
            <SectionHead label="C · User Journey" title="Where Preflight fits" sub="The full builder journey, with opportunities for a readiness experience." />
            <Card>
              <JourneyStep step="Create" title="Build an agent on Vaani" desc="The builder designs the agent's objective, configures its voice, and writes the system prompt. Vaani makes this fast and accessible - often completed in a single session." />
              <JourneyStep step="Configure" title="Set tools, variables, and rules" desc="Transfer destinations, callback options, and dynamic variables are added. This is where most configuration errors are introduced - silently." preflightNote="Deterministic checks surface issues at configuration time, before any call is attempted." />
              <JourneyStep step="Test" title="Evaluate readiness" desc="Without a structured tool, the builder might call their own agent number or share it with a friend. Coverage is limited and findings are informal." preflightNote="Scenario Lab runs deterministic conversation simulations. Connect enables a real WebRTC session against the live agent." />
              <JourneyStep step="Launch" title="Expose to real customers" desc="The agent goes live. Issues that weren't caught in testing appear in real conversations - often identified through customer complaints or missed leads." preflightNote="The readiness score and blocking issue list provide a structured launch gate the builder can apply on their own terms." />
              <JourneyStep step="Learn" title="Improve based on outcomes" desc="Call data, transcripts, and customer feedback inform the next iteration. Without tooling, this loop is slow and reactive." preflightNote="Transcript retrieval and before/after comparison surface evidence for improvement decisions." />
            </Card>
          </Section>}

          {/* D. Evidence */}
          {activeSection === "evidence" && <Section id="evidence">
            <SectionHead label="D · Discovery Evidence" title="One exploratory session" sub="Screenshots from a real Vaani platform session. Single data point - not representative of platform behavior broadly." />
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid #fde68a", fontSize: 12, color: "var(--color-text-primary)", marginBottom: 20, lineHeight: 1.6 }}>
              <strong>Context:</strong> A real-estate lead qualification agent was built and tested on the Vaani platform. The session surfaced two observable gaps that informed the Preflight hypothesis. No causal claims are made about Vaani's defaults.
            </div>

            {/* Step-by-step evidence gallery */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Step 1: Onboarding */}
              <EvidenceBlock
                step="1"
                label="Platform onboarding"
                caption="Vaani's guided setup promises agent creation in 90 seconds. The speed is a strength - but it means configuration gaps are easy to miss before going live."
                img="/evidence/01-onboarding.png"
                alt="Vaani platform onboarding screen: Let's Build Your AI Voice Agent in 90 Seconds"
              />

              {/* Step 2: Template selection */}
              <EvidenceBlock
                step="2"
                label="Template selection"
                caption="The Real Estate – Lead Qualification template was selected. Templates pre-fill the persona and system prompt but leave tool configuration and business-rule variables to the builder."
                img="/evidence/02-agent-templates.png"
                alt="Vaani suggested agent templates: E-com, Real Estate, Fintech"
              />

              {/* Step 3: Persona setup */}
              <EvidenceBlock
                step="3"
                label="Persona configuration"
                caption="Agent name 'Lead Qualification', voice 'Palak' (cartesia sonic-3.5). The greeting uses {{Company Name}} and {{name}} template variables - unresolved variables at call time would break the opening line."
                img="/evidence/03-persona.png"
                alt="Vaani persona setup screen showing agent name, voice, and greeting message with template variables"
              />

              {/* Step 4: Variables */}
              <EvidenceBlock
                step="4"
                label="Variable values set"
                caption="Variables assigned: Company Name = Amaze Developers, City/Region = Delhi NCR, starting_price = 80 Lakhs. This is the business rule the agent will use when discussing property pricing with leads."
                img="/evidence/04-variables.png"
                alt="Vaani Set Variables panel: Company Name=Amaze Developers, City/Region=Delhi NCR, starting_price=80 Lakhs"
                highlight
              />

              {/* Step 5: Live test */}
              <EvidenceBlock
                step="5"
                label="Live test session initiated"
                caption="The agent was tested live (00:16 elapsed). In the test conversation, the simulated buyer stated a budget of ₹65 lakhs - below the ₹80 lakh starting price."
                img="/evidence/05-live-test.png"
                alt="Vaani live session running for 00:16 seconds"
              />

              {/* Step 6: Call summary - the finding */}
              <EvidenceBlock
                step="6"
                label="Call summary - the finding"
                caption="Vaani's own call summary confirms: the customer had a budget of 65 lakhs, requested to speak with a real estate agent, and the call ended without a clear resolution or next steps. Two gaps in one session."
                img="/evidence/06-call-summary.png"
                alt="Vaani call summary: customer budget 65 lakhs, requested human agent, call ended without resolution"
                highlight
                highlightColor="amber"
              />

              {/* Step 7: Root cause - tools disabled */}
              <EvidenceBlock
                step="7"
                label="Root cause: all handoff tools disabled"
                caption="In the Agent Builder, hold_call, transfer_call, schedule_callback, and agent_transfer are all toggled off. The agent had no mechanism to act on the escalation request - because the tools were never enabled."
                img="/evidence/07-disabled-tools.png"
                alt="Vaani system tools panel: hold_call, transfer_call, schedule_callback, agent_transfer all disabled"
                highlight
                highlightColor="red"
              />

              {/* Step 8: Transfer config - no phone number */}
              <EvidenceBlock
                step="8"
                label="transfer_call - unconfigured"
                caption="Opening the transfer_call tool reveals an empty Phone Number field and no prompt. Even if the tool were enabled, it would have no destination to transfer to. This is the specific gap Preflight's handoff check detects."
                img="/evidence/08-transfer-config.png"
                alt="Vaani transfer_call configuration with empty phone number and no prompt"
              />

              {/* Step 9: Advanced transfer settings */}
              <EvidenceBlock
                step="9"
                label="Advanced transfer settings - all defaults"
                caption="Play Dial Tone, Interrupt Permission, Speak Summary To Agent - all disabled. A builder who doesn't know these exist would have no way to discover they're relevant until a real customer request goes unhandled."
                img="/evidence/09-advanced-transfer.png"
                alt="Vaani transfer_call advanced settings: all options disabled"
              />

            </div>

            <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-accent-tint)", border: "1px solid #c4b5fd", fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.65 }}>
              <strong style={{ color: "var(--color-accent)" }}>What this session surfaced:</strong> A first-time builder, following Vaani's standard setup flow, can publish a live agent that has no functional path for escalation - because the relevant tools are off by default and the configuration screen doesn't surface the gap until you look for it. Preflight is designed to catch exactly this before the first real call.
            </div>
          </Section>}

          {/* E. Hypothesis */}
          {activeSection === "hypothesis" && <Section id="hypothesis">
            <SectionHead label="E · Opportunity Hypothesis" title="The specific bet" />
            <Card accent>
              <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-accent)", lineHeight: 1.65, margin: "0 0 12px" }}>
                "An optional readiness experience - surfacing actionable configuration risks before a first deployment - could help first-time builders identify and resolve the issues most likely to affect early customer conversations."
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
          </Section>}

          {/* F. Prioritization */}
          {activeSection === "prioritization" && <Section id="prioritization">
            <SectionHead label="F · Prioritization" title="What we built and why" sub="Impact vs. effort across candidate opportunities. Scores are directional, not measured." />
            <PriorityMatrix />

            <div style={{ marginTop: 20, fontSize: 14, color: "var(--color-text-primary)", lineHeight: 1.75 }}>
              <p style={{ margin: "0 0 10px" }}>
                The MVP focuses on the three highest-impact, lowest-effort opportunities. All three share a key property: they are <strong>deterministic to check</strong> - no inference, no LLM evaluation, no external call needed. A rule either passes or it does not.
              </p>
              <p style={{ margin: 0 }}>
                This keeps the experience fast, reliable, and explainable. A builder who sees a failing check can understand exactly why and act on it immediately.
              </p>
            </div>
          </Section>}

          {/* G. What we didn't build */}
          {activeSection === "not-built" && <Section id="not-built">
            <SectionHead label="G · What We Deliberately Did Not Build" title="Scope restraint as a product decision" />

            {[
              {
                title: "Mandatory deployment blockers",
                why: "A readiness tool that forces resolution before launch creates friction and positions Preflight as a gatekeeper. The right role for this tool - especially at this stage - is advisory, not mandatory. Builders decide when they're ready.",
              },
              {
                title: "Large autonomous conversation evaluation suites",
                why: "LLM-in-the-loop evaluation is high-cost, non-deterministic, and difficult to explain to a non-technical user. The reliability bar for an advisory tool needs to be very high - 'your agent failed scenario 12' without a clear, verifiable reason undermines trust.",
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
          </Section>}

          {/* H. Metrics */}
          {activeSection === "metrics" && <Section id="metrics">
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
          </Section>}

          {/* I. Experiment */}
          {activeSection === "experiment" && <Section id="experiment">
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
                  Stop the experiment early if: setup abandonment increases by more than 10% in the treatment group, or if median time-to-deploy in the treatment group exceeds 2× the control group's median. Neither outcome has been measured - these are proposed thresholds.
                </div>
              </Card>
            </div>
          </Section>}

          {/* J. Roadmap */}
          {activeSection === "roadmap" && <Section id="roadmap">
            <SectionHead label="J · Product Roadmap" title="What exists, what's next, and what's exploratory" />

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 10 }}>Now · In this prototype</div>
              <RoadmapItem status="implemented" title="Deterministic configuration checks" desc="Six rules covering handoff availability, transfer destination validity, capability alignment, variable resolution, and escalation language." />
              <RoadmapItem status="implemented" title="Guided one-click recommendations" desc="Fix Studio applies configuration changes locally with undo support and immediate re-validation." />
              <RoadmapItem status="implemented" title="Clear local-vs-live state labeling" desc="Every change is explicitly marked as affecting local configuration. No change is presented as saved to the real Vaani agent without confirmation." />
              <RoadmapItem status="implemented" title="Deterministic scenario evaluation" desc="Nine conversation scenarios run against the current configuration and return pass/warn/fail with an auditable trace." />
              <RoadmapItem status="implemented" title="Live WebRTC session" desc="Any visitor can initiate a real session with a Vaani agent directly in the browser - microphone capture, agent audio, live captions, and transcript retrieval via LiveKit." />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 10 }}>Next · Highest-confidence follow-on</div>
              <RoadmapItem status="planned" title="Real-session transcript evaluation" desc="After a live session, surface specific utterances that match known risk patterns - budget mismatches, unresolved escalation requests - directly from the transcript." />
              <RoadmapItem status="planned" title="Evidence-backed scenario retesting" desc="After a configuration change, flag which scenarios were previously failing and require a retest rather than showing 'Resolved' prematurely." />
              <RoadmapItem status="planned" title="Vaani configuration write-back" desc="Apply selected fixes directly to the configured agent via Vaani API, with explicit confirmation and clear labeling of what changed." />
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 10 }}>Later · Exploratory directions</div>
              <RoadmapItem status="exploratory" title="Industry-specific readiness templates" desc="Pre-built rule sets for common use cases - real estate, healthcare intake, e-commerce support - reducing setup time for the most common agent types." />
              <RoadmapItem status="exploratory" title="Aggregate insights from consenting users" desc="Anonymized signals across readiness reviews could surface which configuration gaps are most common, informing both the tool and Vaani's product direction." />
              <RoadmapItem status="exploratory" title="Collaborative review flows" desc="Allow a team member or advisor to review and comment on readiness findings before deployment - relevant for slightly larger organizations." />
            </div>
          </Section>}

        {/* Prev / Next navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--color-border)" }}>
          {prev ? (
            <button onClick={() => setActiveSection(prev.id)} style={{ padding: "7px 16px", fontSize: 12, fontWeight: 500, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)", cursor: "pointer" }}>
              ← {prev.label}
            </button>
          ) : <div />}
          {next ? (
            <button onClick={() => setActiveSection(next.id)} style={{ padding: "7px 16px", fontSize: 12, fontWeight: 600, background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", color: "#fff", cursor: "pointer" }}>
              {next.label} →
            </button>
          ) : <div />}
        </div>
      </div>
    </AppShell>
  );
}
