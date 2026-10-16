"use client";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DEMO_FIXTURE, FIXED_FIXTURE } from "@/lib/demo-fixtures";
import { runSimulation } from "@/lib/preflight/simulation";
import type { AgentConfig, SimulationResult } from "@/types/agent";

function cloneConfig(c: AgentConfig): AgentConfig { return JSON.parse(JSON.stringify(c)); }

const SCENARIOS = [
  { id: "human_request", label: "Customer requests a human", utterance: "Can I speak to a real estate agent?", category: "Escalation" },
  { id: "budget_mismatch", label: "Budget below minimum", utterance: "My budget is 65 lakhs. Do you have anything?", category: "Qualification" },
];

const simColors: Record<string, { border: string; bg: string }> = {
  ready_transfer: { border: "var(--color-success)", bg: "var(--color-success-bg)" },
  ready_callback: { border: "#3b82f6", bg: "#eff6ff" },
  incomplete: { border: "var(--color-warning)", bg: "var(--color-warning-bg)" },
  no_tool: { border: "var(--color-danger)", bg: "var(--color-danger-bg)" },
};

export default function ScenarioPage() {
  const [config, setConfig] = useState<AgentConfig>(cloneConfig(DEMO_FIXTURE));
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);
  const [result, setResult] = useState<SimulationResult | null>(null);

  function runTest() {
    setResult(runSimulation(config));
  }

  const actions = (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => { setConfig(cloneConfig(DEMO_FIXTURE)); setResult(null); }} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, cursor: "pointer", background: "transparent", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>Load Broken</button>
      <button onClick={() => { setConfig(cloneConfig(FIXED_FIXTURE)); setResult(null); }} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, cursor: "pointer", background: "var(--color-accent-tint)", border: "1px solid #c4b5fd", color: "var(--color-accent)", fontWeight: 500 }}>Load Fixed</button>
    </div>
  );

  return (
    <AppShell breadcrumb="Scenario Lab" actions={actions}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Scenario Lab</div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Deterministic Scenario Testing</h1>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>Test how your agent configuration handles specific customer utterances. No live call is executed.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border)", fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Scenarios</div>
          {SCENARIOS.map(s => (
            <div key={s.id} onClick={() => { setActiveScenario(s); setResult(null); }} style={{
              padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--color-border)",
              background: activeScenario.id === s.id ? "var(--color-accent-tint)" : "transparent",
              borderLeft: activeScenario.id === s.id ? "2px solid var(--color-accent)" : "2px solid transparent",
            }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: activeScenario.id === s.id ? "var(--color-accent)" : "var(--color-text-primary)" }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{s.category}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: 10 }}>Customer Utterance</div>
            <div style={{ fontStyle: "italic", fontSize: 16, color: "var(--color-text-primary)", padding: "10px 14px", background: "var(--color-bg)", borderRadius: "var(--radius-md)", borderLeft: "3px solid var(--color-border)" }}>
              &quot;{activeScenario.utterance}&quot;
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button onClick={runTest} style={{ fontSize: 13, padding: "7px 16px", borderRadius: "var(--radius-md)", background: "var(--color-accent)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 500 }}>
                Run Test
              </button>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)", alignSelf: "center" }}>
                Deterministic simulation — no live Vaani call executed
              </div>
            </div>
          </div>

          {result && (
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: 10 }}>Result</div>
              <div style={{ border: `1px solid ${simColors[result.status]?.border ?? "var(--color-border)"}`, background: simColors[result.status]?.bg ?? "var(--color-bg)", borderRadius: "var(--radius-md)", padding: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 600 }}>AGENT RESPONSE</span>
                    <p style={{ margin: "4px 0 0", fontStyle: "italic", fontSize: 14 }}>&quot;{result.agentResponse}&quot;</p>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", borderTop: "1px solid var(--color-border)", paddingTop: 10 }}>{result.message}</div>
                  <ul style={{ fontSize: 11, color: "var(--color-text-secondary)", listStyle: "none", padding: 0, margin: 0 }}>
                    {result.limitations.map((l, i) => <li key={i}>⚠ {l}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
