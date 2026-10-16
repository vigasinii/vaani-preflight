"use client";
import { useState } from "react";
import Image from "next/image";
import { AppShell } from "@/components/AppShell";

const evidenceSteps = [
  {
    step: 1,
    title: "Onboarding",
    description: "Vaani invites builders to create a voice agent in 90 seconds.",
    image: "/evidence/01-onboarding.png",
    alt: "Vaani onboarding screen",
  },
  {
    step: 2,
    title: "Template selection",
    description: "Selected Real Estate Lead Qualification template.",
    image: "/evidence/02-agent-templates.png",
    alt: "Agent template selection screen",
  },
  {
    step: 3,
    title: "Persona configuration",
    description: 'Greeting referenced {{Company Name}} and {{name}}.',
    image: "/evidence/03-persona.png",
    alt: "Persona configuration screen",
  },
  {
    step: 4,
    title: "Variables",
    description: "Company Name set to Amaze Developers, Delhi NCR, starting price ₹80 lakhs.",
    image: "/evidence/04-variables.png",
    alt: "Variables configuration screen",
  },
  {
    step: 5,
    title: "Live test",
    description: "WebRTC session initiated.",
    image: "/evidence/05-live-test.png",
    alt: "Live test session screen",
  },
  {
    step: 6,
    title: "Call outcome",
    description: "Summary reported customer requested a human agent, call ended without clear next steps.",
    image: "/evidence/06-call-summary.png",
    alt: "Call summary screen",
  },
  {
    step: 7,
    title: "Actions panel",
    description: "Four system action switches observed as off.",
    image: "/evidence/07-disabled-tools.png",
    alt: "Disabled tools/actions panel",
  },
  {
    step: 8,
    title: "Transfer configuration",
    description: "@transfer_call invocation guidance, empty prompt, required phone number visible.",
    image: "/evidence/08-transfer-config.png",
    alt: "Transfer call configuration screen",
  },
  {
    step: 9,
    title: "Advanced transfer settings",
    description: "Dial tone, interruption, DTMF, spoken-summary options visible.",
    image: "/evidence/09-advanced-transfer.png",
    alt: "Advanced transfer settings screen",
  },
];

const transcript = [
  { time: "~00:56", speaker: "Customer", text: "My budget is 65 lakhs. Do you have anything?" },
  { time: "~01:04", speaker: "Agent", text: "Just to clarify, have you already finalized a property, or are you still actively looking?" },
  { time: "~01:26", speaker: "Customer", text: "Can I speak to a real estate agent", critical: true },
  { time: "~01:30", speaker: "Agent", text: "Like... a two B H K apartment, a villa, or maybe a commercial space?" },
];

const verifiedFacts = [
  "A human was explicitly requested",
  "The agent did not acknowledge that request in the transcript",
  "Vaani's summary noted no clear resolution",
  "The inspected transfer and callback tools were disabled",
  "Transfer configuration showed a required phone number field",
];

const hypotheses = [
  "Sequential qualification prompt may have deprioritized escalation",
  "Disabled tools may have prevented executable handoff",
  "No preflight check was encountered in this specific path",
  "We did NOT prove the platform has no such validation elsewhere",
  "We did NOT prove WebRTC supports live transfers in this context",
];

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}
    >
      <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
        <Image src={src} alt={alt} width={1200} height={800} style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: "var(--radius-md)" }} />
        <button
          onClick={onClose}
          style={{ position: "absolute", top: -12, right: -12, width: 28, height: 28, borderRadius: "50%", background: "var(--color-surface)", border: "none", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function CaseStudyPage() {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  return (
    <AppShell breadcrumb="Case Study">
      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}

      {/* Hero */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Product Investigation · October 2026
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1.25, margin: "0 0 12px", maxWidth: 640 }}>
          The agent was ready to talk. Was it ready to help?
        </h1>
        <p style={{ fontSize: 15, color: "var(--color-text-secondary)", lineHeight: 1.6, maxWidth: 600, margin: 0 }}>
          A real session with a Vaani-built real estate lead qualification agent.
          The agent failed to connect a customer who explicitly requested a human representative.
          All evidence below is based on direct observation during product research.
        </p>
        <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid #fde68a", fontSize: 12, color: "var(--color-warning)", maxWidth: 520 }}>
          <strong>Key moment:</strong> At ~01:26, the customer said "Can I speak to a real estate agent." The agent responded with a property type question.
        </div>
      </div>

      {/* Transcript - centrepiece */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>Conversation Transcript</div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>Reconstructed from call summary - approximate timestamps</div>
          </div>
          <span style={{ fontSize: 11, color: "var(--color-danger)", background: "var(--color-danger-bg)", padding: "2px 8px", borderRadius: 100, fontWeight: 600 }}>
            Escalation missed
          </span>
        </div>
        <div>
          {transcript.map((row, i) => (
            <div key={i} style={{
              display: "flex", gap: 12, padding: "14px 16px",
              borderBottom: i < transcript.length - 1 ? "1px solid var(--color-border)" : "none",
              background: (row as typeof row & { critical?: boolean }).critical ? "var(--color-danger-bg)" : "transparent",
              borderLeft: (row as typeof row & { critical?: boolean }).critical ? "3px solid var(--color-danger)" : "3px solid transparent",
            }}>
              <div style={{ width: 52, flexShrink: 0, fontSize: 11, color: "var(--color-text-secondary)", fontFamily: "monospace", paddingTop: 2 }}>{row.time}</div>
              <div style={{ width: 80, flexShrink: 0 }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100,
                  background: row.speaker === "Customer" ? "var(--color-warning-bg)" : "var(--color-bg)",
                  color: row.speaker === "Customer" ? "var(--color-warning)" : "var(--color-text-secondary)",
                  border: `1px solid ${row.speaker === "Customer" ? "#fde68a" : "var(--color-border)"}`,
                }}>
                  {row.speaker}
                </span>
              </div>
              <div style={{ flex: 1, fontSize: 14, color: (row as typeof row & { critical?: boolean }).critical ? "var(--color-danger)" : "var(--color-text-primary)", fontStyle: "italic", fontWeight: (row as typeof row & { critical?: boolean }).critical ? 500 : 400 }}>
                &quot;{row.text}&quot;
                {(row as typeof row & { critical?: boolean }).critical && (
                  <span style={{ marginLeft: 8, fontSize: 11, fontStyle: "normal", fontWeight: 600, background: "var(--color-danger)", color: "#fff", padding: "1px 6px", borderRadius: 4 }}>
                    unacknowledged
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verified vs Hypothesized */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }} className="facts-grid">
        <div style={{ background: "var(--color-success-bg)", border: "1px solid #6ee7b7", borderRadius: "var(--radius-lg)", padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-success)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
            Verified - directly observed
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {verifiedFacts.map((fact, i) => (
              <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--color-text-primary)", alignItems: "flex-start" }}>
                <span style={{ color: "var(--color-success)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                {fact}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ background: "var(--color-warning-bg)", border: "1px solid #fde68a", borderRadius: "var(--radius-lg)", padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-warning)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Hypotheses
          </div>
          <div style={{ fontSize: 11, color: "var(--color-warning)", fontStyle: "italic", marginBottom: 12 }}>Requires further testing</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {hypotheses.map((h, i) => (
              <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--color-text-primary)", alignItems: "flex-start" }}>
                <span style={{ color: "var(--color-warning)", fontWeight: 700, flexShrink: 0 }}>~</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Evidence Timeline */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>Evidence Timeline</div>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>Click any screenshot to enlarge.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {evidenceSteps.map((step) => (
            <div key={step.step} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--color-accent-tint)", color: "var(--color-accent)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {step.step}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{step.title}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{step.description}</div>
                </div>
              </div>
              <div style={{ padding: 12 }}>
                <div
                  style={{ borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--color-border)", cursor: "zoom-in", background: "var(--color-bg)" }}
                  onClick={() => setLightbox({ src: step.image, alt: step.alt })}
                >
                  <Image
                    src={step.image}
                    alt={step.alt}
                    width={900}
                    height={500}
                    style={{ width: "100%", height: "auto", objectFit: "contain", maxHeight: 360, display: "block" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proposed Solution */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 12 }}>Proposed Solution</div>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>
          A pre-deployment preflight check would validate agent configuration before live launch,
          surfacing issues like missing transfer destinations and unconfigured handoff tools before
          they affect real customers.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            "Validate all enabled tools are fully configured",
            "Detect prompt/tool mismatches before launch",
            "Flag missing escalation priority language",
            "Simulate human handoff request with current config",
          ].map((item, i) => (
            <div key={i} style={{ fontSize: 12, color: "var(--color-accent)", background: "var(--color-accent-tint)", border: "1px solid #c4b5fd", borderRadius: "var(--radius-sm)", padding: "8px 12px" }}>
              → {item}
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ padding: "12px 16px", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 8 }}>
        Screenshots are copies of original session captures. The session identifier visible in screenshot 06 was masked for sharing.
        This prototype is independent and has no authenticated integration with Vaani.
      </div>

      <style>{`
        @media (max-width: 700px) {
          .facts-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppShell>
  );
}
