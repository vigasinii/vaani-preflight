"use client";
import { useState } from "react";
import type { PreflightResult, SimulationResult, Finding } from "@/types/agent";
import { RefObject } from "react";

function ScoreDisplay({ score, label }: { score: number; label: string }) {
  const color = score >= 90 ? "var(--color-success)" : score >= 70 ? "var(--color-warning)" : "var(--color-danger)";
  const segments = 10;
  const filled = Math.round(score / 10);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, fontWeight: 700, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>/ 100</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
          {Array.from({ length: segments }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 6, borderRadius: 3,
              background: i < filled ? color : "var(--color-border)",
              transition: "background 300ms",
            }} />
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color }}>{label}</div>
        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
          Configuration readiness estimate, not a prediction of live call success.
        </div>
      </div>
    </div>
  );
}

function Badge({ severity }: { severity: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    critical: { bg: "var(--color-danger-bg)", color: "var(--color-danger)", label: "Critical" },
    warning: { bg: "var(--color-warning-bg)", color: "var(--color-warning)", label: "Warning" },
    passed: { bg: "var(--color-success-bg)", color: "var(--color-success)", label: "Passed" },
  };
  const s = map[severity] ?? map.passed;
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 100, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
}

function FindingItem({ finding, onFix }: { finding: Finding; onFix: () => void }) {
  const [open, setOpen] = useState(finding.severity === "critical");
  const borderColor = finding.severity === "critical" ? "var(--color-danger)" : finding.severity === "warning" ? "var(--color-warning)" : "var(--color-border)";
  return (
    <div style={{
      borderLeft: `2px solid ${borderColor}`,
      paddingLeft: 12, paddingTop: 10, paddingBottom: 10,
      borderBottom: "1px solid var(--color-border)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", cursor: "pointer", gap: 8 }}
        onClick={() => setOpen(o => !o)}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <Badge severity={finding.severity} />
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{finding.title}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{finding.evidence}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2"
          style={{ flexShrink: 0, marginTop: 2, transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {open && (
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: 8 }}>
          <div><strong style={{ color: "var(--color-text-primary)" }}>Why it matters:</strong> {finding.whyItMatters}</div>
          <div><strong style={{ color: "var(--color-text-primary)" }}>Fix:</strong> {finding.recommendedAction}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <code style={{ fontSize: 11, background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 4, padding: "2px 6px" }}>
              {finding.affectedField}
            </code>
            {finding.severity !== "passed" && (
              <button onClick={onFix} style={{
                fontSize: 11, color: "var(--color-accent)", background: "var(--color-accent-tint)",
                border: "1px solid #c4b5fd", borderRadius: "var(--radius-sm)", padding: "3px 10px", cursor: "pointer",
              }}>
                Go to field →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const simColors: Record<string, { border: string; bg: string; label: string }> = {
  ready_transfer: { border: "var(--color-success)", bg: "var(--color-success-bg)", label: "Transfer path ready" },
  ready_callback: { border: "#3b82f6", bg: "#eff6ff", label: "Callback path available" },
  incomplete: { border: "var(--color-warning)", bg: "var(--color-warning-bg)", label: "Incomplete configuration" },
  no_tool: { border: "var(--color-danger)", bg: "var(--color-danger-bg)", label: "No handoff path" },
};

interface ResultsPanelProps {
  preflight: PreflightResult | null;
  prevPreflight: PreflightResult | null;
  simulation: SimulationResult | null;
  onRunSimulation: () => void;
  toolsRef: RefObject<HTMLDivElement | null>;
  promptRef: RefObject<HTMLTextAreaElement | null>;
}

export function ResultsPanel({ preflight, prevPreflight, simulation, onRunSimulation, toolsRef, promptRef }: ResultsPanelProps) {
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "passed">("all");

  function handleFix(finding: Finding) {
    if (finding.affectedField === "tools" || finding.affectedField.startsWith("tools.")) {
      toolsRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (finding.affectedField === "systemPrompt") {
      promptRef.current?.scrollIntoView({ behavior: "smooth" });
      promptRef.current?.focus();
    }
  }

  if (!preflight) {
    return (
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)", padding: 32, textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--color-accent-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>Run Preflight to analyze this configuration</div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
            Validates tools, variables, prompt consistency, and handoff readiness
          </div>
        </div>
        <div style={{
          padding: "10px 14px", background: "var(--color-warning-bg)", border: "1px solid #fde68a",
          borderRadius: "var(--radius-md)", fontSize: 12, color: "var(--color-warning)", textAlign: "left", maxWidth: 360,
        }}>
          <strong>Observed issue:</strong> Customer requested a human agent at ~01:26. Agent responded with a qualification question.
        </div>
      </div>
    );
  }

  const criticalCount = preflight.findings.filter(f => f.severity === "critical").length;
  const warningCount = preflight.findings.filter(f => f.severity === "warning").length;
  const passedCount = preflight.findings.filter(f => f.severity === "passed").length;
  const filtered = filter === "all" ? preflight.findings : preflight.findings.filter(f => f.severity === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Score card */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "12px 16px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
          Preflight Report
        </div>
        <ScoreDisplay score={preflight.score} label={preflight.scoreLabel} />
        {prevPreflight && (
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", paddingTop: 8, borderTop: "1px solid var(--color-border)" }}>
            Previous: <strong style={{ color: preflight.score > prevPreflight.score ? "var(--color-success)" : "var(--color-danger)" }}>
              {prevPreflight.score} → {preflight.score}
            </strong>
            {preflight.score > prevPreflight.score && ` (+${preflight.score - prevPreflight.score} after fixes)`}
          </div>
        )}
      </div>

      {/* Findings */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>Findings</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["all", "critical", "warning", "passed"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 100, cursor: "pointer", fontWeight: 500,
                background: filter === f ? "var(--color-accent-tint)" : "transparent",
                color: filter === f ? "var(--color-accent)" : "var(--color-text-secondary)",
                border: filter === f ? "1px solid #c4b5fd" : "1px solid transparent",
                transition: "all 150ms",
              }}>
                {f === "all" ? `All (${preflight.findings.length})` : f === "critical" ? `Critical (${criticalCount})` : f === "warning" ? `Warning (${warningCount})` : `Passed (${passedCount})`}
              </button>
            ))}
          </div>
        </div>
        <div>
          {filtered.map(finding => (
            <FindingItem key={finding.id} finding={finding} onFix={() => handleFix(finding)} />
          ))}
        </div>
      </div>

      {/* Simulation */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>Handoff Simulation</div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>Deterministic simulation - no live Vaani call executed</div>
          </div>
          <button onClick={onRunSimulation} style={{
            fontSize: 12, padding: "5px 12px", borderRadius: "var(--radius-sm)", cursor: "pointer",
            background: "var(--color-accent-tint)", color: "var(--color-accent)", border: "1px solid #c4b5fd", fontWeight: 500,
          }}>
            Run Simulation
          </button>
        </div>

        {simulation ? (() => {
          const s = simColors[simulation.status] ?? simColors.no_tool;
          return (
            <div style={{ padding: 16 }}>
              <div style={{ border: `1px solid ${s.border}`, background: s.bg, borderRadius: "var(--radius-md)", padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: s.border, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                  {s.label}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                  <div>
                    <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 600 }}>CUSTOMER</span>
                    <p style={{ margin: "2px 0 0", fontStyle: "italic", color: "var(--color-text-primary)" }}>&quot;Can I speak to a real estate agent?&quot;</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 600 }}>SIMULATED AGENT</span>
                    <p style={{ margin: "2px 0 0", fontStyle: "italic", color: "var(--color-text-primary)" }}>&quot;{simulation.agentResponse}&quot;</p>
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "var(--color-text-secondary)" }}>{simulation.message}</div>
                <ul style={{ marginTop: 8, fontSize: 11, color: "var(--color-text-secondary)", listStyle: "none", padding: 0 }}>
                  {simulation.limitations.map((l, i) => <li key={i} style={{ marginTop: 2 }}>⚠ {l}</li>)}
                </ul>
              </div>
            </div>
          );
        })() : (
          <div style={{ padding: 16, fontSize: 13, color: "var(--color-text-secondary)" }}>
            Run the simulation to test how the current configuration handles a human handoff request.
          </div>
        )}
      </div>
    </div>
  );
}
