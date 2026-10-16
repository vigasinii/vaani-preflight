"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { loadConfig, saveConfig } from "@/lib/store";
import { runPreflight } from "@/lib/preflight/engine";
import type { AgentConfig, PreflightResult, Finding } from "@/types/agent";

interface FixAction {
  label: string;
  apply: (cfg: AgentConfig) => AgentConfig;
}

interface FixItem {
  finding: Finding;
  fix: FixAction | null;
  requiresInput?: { type: "phone" | "text"; label: string; placeholder: string };
  inputValue?: string;
}

function buildFix(finding: Finding): FixAction | null {
  switch (finding.ruleId) {
    case "HANDOFF_AVAILABILITY":
      if (!finding.passed) {
        return {
          label: "Enable transfer_call tool",
          apply: (cfg) => ({
            ...cfg,
            tools: cfg.tools.map(t =>
              t.name === "transfer_call" ? { ...t, enabled: true } : t
            ),
          }),
        };
      }
      return null;
    case "PROMPT_ACTION_MISMATCH":
      if (!finding.passed) {
        return {
          label: "Enable transfer_call to match prompt",
          apply: (cfg) => ({
            ...cfg,
            tools: cfg.tools.map(t =>
              t.name === "transfer_call" ? { ...t, enabled: true } : t
            ),
          }),
        };
      }
      return null;
    case "ESCALATION_PRIORITY":
      if (!finding.passed) {
        return {
          label: "Add escalation-priority language to system prompt",
          apply: (cfg) => ({
            ...cfg,
            systemPrompt: cfg.systemPrompt +
              "\n\nIf at any point the customer requests to speak with a human agent, immediately offer a transfer or callback - do not continue qualification.",
          }),
        };
      }
      return null;
    default:
      return null;
  }
}

function requiresInput(finding: Finding): FixItem["requiresInput"] | undefined {
  if ((finding.ruleId === "TRANSFER_DESTINATION" || finding.ruleId === "TRANSFER_ENABLED_INCOMPLETE") && !finding.passed) {
    return { type: "phone", label: "Enter valid transfer destination (E.164 format)", placeholder: "+910000000000" };
  }
  if (finding.ruleId === "UNRESOLVED_VARIABLES" && !finding.passed) {
    const match = finding.title.match(/Unresolved variable\(s\): (.+)/);
    const varName = match?.[1]?.split(",")[0]?.trim() ?? "variable";
    return { type: "text", label: `Define value for {{${varName}}}`, placeholder: `e.g. Amaze Developers` };
  }
  return undefined;
}

const E164 = /^\+[1-9]\d{7,14}$/;

function severityColor(s: string) {
  if (s === "critical") return "var(--color-danger)";
  if (s === "warning") return "var(--color-warning)";
  return "var(--color-success)";
}

function severityBg(s: string) {
  if (s === "critical") return "var(--color-danger-bg)";
  if (s === "warning") return "var(--color-warning-bg)";
  return "var(--color-success-bg)";
}

export default function FixStudioPage() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [undoStack, setUndoStack] = useState<AgentConfig[]>([]);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const cfg = loadConfig();
    setConfig(cfg);
    setPreflight(runPreflight(cfg));
  }, []);

  function rerun(cfg: AgentConfig) {
    const result = runPreflight(cfg);
    setPreflight(result);
    saveConfig(cfg);
    setConfig(cfg);
  }

  function applyFix(finding: Finding, fixFn: (cfg: AgentConfig) => AgentConfig) {
    if (!config) return;
    setUndoStack(prev => [...prev, config]);
    const next = fixFn(config);
    setApplied(prev => new Set([...prev, finding.id]));
    rerun(next);
    setSuccessMsg(`Fix applied: ${finding.title}. Score updated.`);
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  function applyInputFix(finding: Finding) {
    if (!config) return;
    const val = inputValues[finding.id] ?? "";
    if (finding.ruleId === "TRANSFER_DESTINATION" || finding.ruleId === "TRANSFER_ENABLED_INCOMPLETE") {
      if (!E164.test(val.trim())) {
        alert("Enter a valid E.164 phone number, e.g. +919876543210");
        return;
      }
      setUndoStack(prev => [...prev, config]);
      const next: AgentConfig = {
        ...config,
        tools: config.tools.map(t =>
          t.name === "transfer_call" ? { ...t, enabled: true, destination: val.trim() } : t
        ),
      };
      setApplied(prev => new Set([...prev, finding.id]));
      rerun(next);
      setSuccessMsg("Transfer destination set and validated.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } else if (finding.ruleId === "UNRESOLVED_VARIABLES") {
      const match = finding.title.match(/Unresolved variable\(s\): (.+)/);
      const varNames = match?.[1]?.split(",").map(s => s.trim()) ?? [];
      const firstName = varNames[0];
      if (!firstName) return;
      setUndoStack(prev => [...prev, config]);
      const exists = config.variables.find(v => v.name === firstName);
      const next: AgentConfig = {
        ...config,
        variables: exists
          ? config.variables.map(v => v.name === firstName ? { ...v, value: val } : v)
          : [...config.variables, { name: firstName, value: val, isRuntime: false }],
      };
      setApplied(prev => new Set([...prev, finding.id]));
      rerun(next);
      setSuccessMsg(`Variable {{${firstName}}} defined.`);
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  }

  function undo() {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(s => s.slice(0, -1));
    setApplied(new Set());
    rerun(prev);
    setSuccessMsg("Change reverted.");
    setTimeout(() => setSuccessMsg(""), 2000);
  }

  if (!config || !preflight) {
    return (
      <AppShell breadcrumb="Fix Studio">
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-secondary)" }}>Loading…</div>
      </AppShell>
    );
  }

  const actionable = preflight.findings.filter(f => !f.passed);
  const passed = preflight.findings.filter(f => f.passed);

  const scoreColor = preflight.score >= 90 ? "var(--color-success)"
    : preflight.score >= 70 ? "var(--color-warning)" : "var(--color-danger)";

  return (
    <AppShell breadcrumb="Fix Studio">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Fix Studio
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
            Guided Issue Resolution
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
            Each fix is derived from actual validation rules. Applying a fix updates the shared config and reruns the preflight check.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {undoStack.length > 0 && (
            <button onClick={undo} style={{
              padding: "6px 14px", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 500,
              background: "transparent", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)",
              cursor: "pointer",
            }}>
              ↩ Undo
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid #6ee7b7", color: "var(--color-success)", fontSize: 13 }}>
          {successMsg}
        </div>
      )}

      {/* Score summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }} className="fix-stats">
        {[
          { label: "Readiness Score", value: `${preflight.score}/100`, color: scoreColor },
          { label: "Status", value: preflight.scoreLabel, color: scoreColor },
          { label: "Issues to Fix", value: String(actionable.length), color: actionable.length > 0 ? "var(--color-danger)" : "var(--color-success)" },
          { label: "Undo Levels", value: String(undoStack.length), color: "var(--color-text-primary)" },
        ].map((stat, i) => (
          <div key={i} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {actionable.length === 0 ? (
        <div style={{ background: "var(--color-success-bg)", border: "1px solid #6ee7b7", borderRadius: "var(--radius-lg)", padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-success)" }}>All checks passed</div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
            This configuration scores {preflight.score}/100 with no actionable issues.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
            {actionable.length} issue{actionable.length !== 1 ? "s" : ""} to resolve
          </div>
          {actionable.map(finding => {
            const fix = buildFix(finding);
            const inputSpec = requiresInput(finding);
            const inputVal = inputValues[finding.id] ?? "";
            const wasApplied = applied.has(finding.id);

            return (
              <div key={finding.id} style={{
                background: "var(--color-surface)", border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)", overflow: "hidden",
                borderLeft: `3px solid ${severityColor(finding.severity)}`,
              }}>
                {/* Finding header */}
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100,
                        background: severityBg(finding.severity), color: severityColor(finding.severity),
                        textTransform: "capitalize",
                      }}>
                        {finding.severity}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{finding.title}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{finding.evidence}</div>
                  </div>
                  {wasApplied && (
                    <span style={{ fontSize: 11, color: "var(--color-success)", fontWeight: 600, whiteSpace: "nowrap" }}>Applied ✓</span>
                  )}
                </div>

                <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Why it matters */}
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                    <strong style={{ color: "var(--color-text-primary)" }}>Why it matters: </strong>
                    {finding.whyItMatters}
                  </div>

                  {/* Affected field */}
                  <code style={{ fontSize: 11, background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 4, padding: "2px 8px", display: "inline-block", width: "fit-content" }}>
                    {finding.affectedField}
                  </code>

                  {/* Fix actions */}
                  {fix && !inputSpec && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-accent-tint)", border: "1px solid #c4b5fd" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-accent)", marginBottom: 2 }}>Automated Fix Available</div>
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{fix.label}</div>
                      </div>
                      <button
                        onClick={() => applyFix(finding, fix.apply)}
                        disabled={wasApplied}
                        style={{
                          padding: "5px 14px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 600,
                          background: wasApplied ? "var(--color-success)" : "var(--color-accent)", color: "#fff", border: "none", cursor: wasApplied ? "default" : "pointer",
                        }}
                      >
                        {wasApplied ? "Applied" : "Apply Fix"}
                      </button>
                    </div>
                  )}

                  {inputSpec && (
                    <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-accent-tint)", border: "1px solid #c4b5fd" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-accent)", marginBottom: 8 }}>{inputSpec.label}</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="text"
                          value={inputVal}
                          onChange={e => setInputValues(prev => ({ ...prev, [finding.id]: e.target.value }))}
                          placeholder={inputSpec.placeholder}
                          style={{
                            flex: 1, padding: "6px 10px", borderRadius: "var(--radius-sm)", fontSize: 13,
                            border: "1px solid var(--color-border)", background: "var(--color-surface)",
                            color: "var(--color-text-primary)", outline: "none",
                          }}
                        />
                        <button
                          onClick={() => applyInputFix(finding)}
                          disabled={!inputVal.trim() || wasApplied}
                          style={{
                            padding: "6px 14px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 600,
                            background: "var(--color-accent)", color: "#fff", border: "none",
                            cursor: !inputVal.trim() || wasApplied ? "not-allowed" : "pointer",
                            opacity: !inputVal.trim() || wasApplied ? 0.5 : 1,
                          }}
                        >
                          Apply
                        </button>
                      </div>
                      {inputSpec.type === "phone" && inputVal && !E164.test(inputVal.trim()) && (
                        <div style={{ fontSize: 11, color: "var(--color-danger)", marginTop: 4 }}>
                          Must match E.164 format: +[country code][number], e.g. +919876543210
                        </div>
                      )}
                    </div>
                  )}

                  {!fix && !inputSpec && (
                    <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg)", border: "1px solid var(--color-border)", fontSize: 12, color: "var(--color-text-secondary)" }}>
                      <strong>Manual fix required:</strong> {finding.recommendedAction}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Passing checks */}
      {passed.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>
            Passing checks ({passed.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {passed.map(finding => (
              <div key={finding.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid #6ee7b7" }}>
                <span style={{ color: "var(--color-success)", fontWeight: 700 }}>✓</span>
                <span style={{ fontSize: 12, color: "var(--color-text-primary)" }}>{finding.title}</span>
                <span style={{ fontSize: 11, color: "var(--color-text-secondary)", marginLeft: "auto" }}>{finding.ruleId}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .fix-stats { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </AppShell>
  );
}
