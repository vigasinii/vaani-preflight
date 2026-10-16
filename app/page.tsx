"use client";
import { useState, useRef } from "react";
import type { AgentConfig, PreflightResult, SimulationResult } from "@/types/agent";
import { DEMO_FIXTURE } from "@/lib/demo-fixtures";
import { runPreflight } from "@/lib/preflight/engine";
import { runSimulation } from "@/lib/preflight/simulation";
import { buildExportData, downloadJSON } from "@/lib/export";
import { AppShell } from "@/components/AppShell";
import { ConfigPanel } from "@/components/preflight/ConfigPanel";
import { ResultsPanel } from "@/components/preflight/ResultsPanel";

function cloneConfig(c: AgentConfig): AgentConfig {
  return JSON.parse(JSON.stringify(c));
}

function Btn({ onClick, variant = "ghost", children, disabled }: { onClick?: () => void; variant?: "primary" | "ghost" | "outline"; children: React.ReactNode; disabled?: boolean }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: "var(--color-accent)", color: "#fff", border: "none" },
    ghost: { background: "transparent", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" },
    outline: { background: "var(--color-accent-tint)", color: "var(--color-accent)", border: "1px solid #c4b5fd" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        padding: "6px 14px", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
        transition: "all 150ms", display: "inline-flex", alignItems: "center", gap: 6,
      }}
    >
      {children}
    </button>
  );
}

export default function PreflightPage() {
  const [config, setConfig] = useState<AgentConfig>(cloneConfig(DEMO_FIXTURE));
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [prevPreflight, setPrevPreflight] = useState<PreflightResult | null>(null);
  const [running, setRunning] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  function resetDemo() {
    setConfig(cloneConfig(DEMO_FIXTURE));
    setPreflight(null);
    setSimulation(null);
    setPrevPreflight(null);
  }

  function runPreflightCheck() {
    setRunning(true);
    setTimeout(() => {
      const result = runPreflight(config);
      setPrevPreflight(preflight);
      setPreflight(result);
      setSimulation(null);
      setRunning(false);
    }, 600);
  }

  function handleExport() {
    if (!preflight) return;
    downloadJSON(buildExportData(config, preflight, simulation), `vaani-preflight-${Date.now()}.json`);
  }

  const breadcrumb = <span>Preflight <span style={{ color: "var(--color-border)" }}>·</span> {config.name}</span>;
  const actions = (
    <>
      <Btn onClick={resetDemo} variant="ghost">Reset Demo</Btn>
      {preflight && <Btn onClick={handleExport} variant="outline">Export Report</Btn>}
      <Btn onClick={runPreflightCheck} variant="primary" disabled={running}>
        {running ? "Analyzing…" : "Run Preflight"}
      </Btn>
    </>
  );

  return (
    <AppShell breadcrumb={breadcrumb} actions={actions}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
          Preflight Checker
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
          {config.name}
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
          Amaze Developers · Delhi NCR · Observed case loaded
        </p>
        {!preflight && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: "var(--radius-md)",
            background: "var(--color-warning-bg)", border: "1px solid #fde68a",
            fontSize: 12, color: "var(--color-warning)", maxWidth: 520,
          }}>
            <strong>Observed:</strong> Customer requested a human agent at ~01:26. Agent continued qualification. transfer_call was disabled with no destination configured.
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "55% 1fr", gap: 16, alignItems: "start" }} className="preflight-grid">
        <ConfigPanel config={config} setConfig={setConfig} toolsRef={toolsRef} promptRef={promptRef} />
        <ResultsPanel
          preflight={preflight}
          prevPreflight={prevPreflight}
          simulation={simulation}
          onRunSimulation={() => setSimulation(runSimulation(config))}
          toolsRef={toolsRef}
          promptRef={promptRef}
        />
      </div>

      <style>{`
        @media (max-width: 900px) {
          .preflight-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppShell>
  );
}
