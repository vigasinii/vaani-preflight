"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { loadConfig, loadHistory, appendHistory, type ValidationRun } from "@/lib/store";
import { runPreflight } from "@/lib/preflight/engine";
import type { AgentConfig, PreflightResult } from "@/types/agent";

function ScoreArc({ score }: { score: number }) {
  const color = score >= 90 ? "#16815D" : score >= 70 ? "#B7791F" : "#D14343";
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={130} height={130} viewBox="0 0 130 130">
      <circle cx={65} cy={65} r={r} fill="none" stroke="#E6E8EF" strokeWidth={10} />
      <circle
        cx={65} cy={65} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 65 65)"
        style={{ transition: "stroke-dasharray 600ms ease" }}
      />
      <text x="65" y="62" textAnchor="middle" fontSize="26" fontWeight="700" fill={color}>{score}</text>
      <text x="65" y="78" textAnchor="middle" fontSize="11" fill="#667085">/100</text>
    </svg>
  );
}

interface QuickLink {
  label: string;
  href: string;
  description: string;
  icon: string;
}

const LINKS: QuickLink[] = [
  { label: "Agent Workspace", href: "/preflight", description: "Edit configuration and run the preflight check", icon: "⚙" },
  { label: "Fix Studio", href: "/fix", description: "Guided resolution for each open finding", icon: "🔧" },
  { label: "Scenario Lab", href: "/scenario", description: "Nine deterministic call scenarios", icon: "🧪" },
  { label: "Before / After", href: "/compare", description: "Score delta between observed and fixed state", icon: "⚖" },
  { label: "Investigation", href: "/case-study", description: "Evidence-led case study with nine screenshots", icon: "📋" },
  { label: "Connect", href: "/connect", description: "Live Vaani API integration and WebRTC sessions", icon: "⚡" },
];

export default function MissionControlPage() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [history, setHistory] = useState<ValidationRun[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const cfg = loadConfig();
    setConfig(cfg);
    setHistory(loadHistory());
  }, []);

  function runCheck() {
    if (!config) return;
    setRunning(true);
    setTimeout(() => {
      const result = runPreflight(config);
      setPreflight(result);
      appendHistory({
        timestamp: result.timestamp,
        score: result.score,
        scoreLabel: result.scoreLabel,
        criticalCount: result.findings.filter(f => f.severity === "critical").length,
        warningCount: result.findings.filter(f => f.severity === "warning").length,
      });
      setHistory(loadHistory());
      setRunning(false);
    }, 400);
  }

  const scoreColor = !preflight ? "#667085"
    : preflight.score >= 90 ? "#16815D"
    : preflight.score >= 70 ? "#B7791F" : "#D14343";

  const critical = preflight?.findings.filter(f => f.severity === "critical") ?? [];
  const warnings = preflight?.findings.filter(f => f.severity === "warning") ?? [];

  return (
    <AppShell breadcrumb="Mission Control">
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Vaani Preflight · Voice Agent Reliability Studio
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
            Mission Control
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
            {config?.name ?? "Loading agent…"} · Amaze Developers · Independent prototype
          </p>
        </div>

        {/* Main readiness panel */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, marginBottom: 20 }} className="mc-top">
          {/* Score ring */}
          <div style={{
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)", padding: 20, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {preflight ? (
              <>
                <ScoreArc score={preflight.score} />
                <div style={{ fontSize: 14, fontWeight: 600, color: scoreColor }}>{preflight.scoreLabel}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", textAlign: "center" }}>
                  Configuration readiness
                </div>
              </>
            ) : (
              <>
                <div style={{ width: 130, height: 130, borderRadius: "50%", border: "10px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>—</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Not yet run</div>
              </>
            )}
          </div>

          {/* Summary + actions */}
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 12 }}>READINESS SUMMARY</div>
              {!preflight ? (
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                  Run a preflight check to see what is blocking this agent from safe launch.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {critical.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-danger)", marginBottom: 4 }}>
                        {critical.length} Critical Blocker{critical.length !== 1 ? "s" : ""}
                      </div>
                      {critical.map(f => (
                        <div key={f.id} style={{ fontSize: 12, color: "var(--color-text-primary)", padding: "3px 0", borderLeft: "2px solid var(--color-danger)", paddingLeft: 8, marginBottom: 2 }}>
                          {f.title}
                        </div>
                      ))}
                    </div>
                  )}
                  {warnings.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-warning)", marginBottom: 4 }}>
                        {warnings.length} Warning{warnings.length !== 1 ? "s" : ""}
                      </div>
                      {warnings.map(f => (
                        <div key={f.id} style={{ fontSize: 12, color: "var(--color-text-primary)", padding: "3px 0", borderLeft: "2px solid var(--color-warning)", paddingLeft: 8, marginBottom: 2 }}>
                          {f.title}
                        </div>
                      ))}
                    </div>
                  )}
                  {critical.length === 0 && warnings.length === 0 && (
                    <div style={{ color: "var(--color-success)", fontSize: 13, fontWeight: 500 }}>
                      ✓ No blockers — agent is ready for launch
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              <button
                onClick={runCheck}
                disabled={running || !config}
                style={{
                  padding: "7px 16px", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600,
                  background: "var(--color-accent)", color: "#fff", border: "none",
                  cursor: running || !config ? "not-allowed" : "pointer", opacity: running ? 0.7 : 1,
                }}
              >
                {running ? "Analyzing…" : "Run Preflight Check"}
              </button>
              {preflight && critical.length > 0 && (
                <Link href="/fix" style={{
                  padding: "7px 16px", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600,
                  background: "var(--color-danger-bg)", color: "var(--color-danger)", border: "1px solid #fca5a5",
                  textDecoration: "none", display: "inline-flex", alignItems: "center",
                }}>
                  Fix {critical.length} Blocker{critical.length !== 1 ? "s" : ""} →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Config completeness */}
        {config && (
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 10 }}>CONFIGURATION COMPLETENESS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }} className="config-grid">
              {[
                { label: "Agent name", ok: !!config.name },
                { label: "Objective", ok: !!config.objective },
                { label: "System prompt", ok: config.systemPrompt.length > 20 },
                { label: "Variables", ok: config.variables.every(v => v.isRuntime || !!v.value) },
                { label: "Handoff tool", ok: config.tools.some(t => (t.name === "transfer_call" || t.name === "schedule_callback") && t.enabled) },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: item.ok ? "var(--color-success)" : "var(--color-text-secondary)" }}>
                  <span style={{ fontSize: 14 }}>{item.ok ? "✓" : "○"}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }} className="nav-grid">
          {LINKS.map(link => (
            <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
              <div style={{
                background: "var(--color-surface)", border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)", padding: "16px", cursor: "pointer",
                transition: "border-color 150ms, box-shadow 150ms",
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-accent)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 3px var(--color-accent-tint)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 6 }}>{link.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>{link.label}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{link.description}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Validation history */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>Recent Validation Runs</div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>Stored locally in this browser</div>
          </div>
          {history.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "var(--color-text-secondary)" }}>
              No validation history yet. Run a preflight check to start.
            </div>
          ) : (
            <div>
              {history.slice(0, 8).map((run, i) => {
                const rc = run.score >= 90 ? "#16815D" : run.score >= 70 ? "#B7791F" : "#D14343";
                return (
                  <div key={run.id} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                    borderBottom: i < Math.min(history.length, 8) - 1 ? "1px solid var(--color-border)" : "none",
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: rc, minWidth: 36 }}>{run.score}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: rc }}>{run.scoreLabel}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                        {run.criticalCount > 0 && `${run.criticalCount} critical`}
                        {run.criticalCount > 0 && run.warningCount > 0 && " · "}
                        {run.warningCount > 0 && `${run.warningCount} warning`}
                        {run.criticalCount === 0 && run.warningCount === 0 && "All clear"}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                      {new Date(run.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: "var(--color-text-secondary)", textAlign: "center" }}>
          Vaani Preflight is an independent product concept. Not affiliated with or endorsed by Vaani AI Research.
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .mc-top { grid-template-columns: 1fr !important; }
          .nav-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .nav-grid { grid-template-columns: 1fr !important; }
          .config-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </AppShell>
  );
}
