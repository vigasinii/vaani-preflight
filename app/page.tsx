"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { loadConfig, loadHistory, appendHistory, type ValidationRun } from "@/lib/store";
import { runPreflight } from "@/lib/preflight/engine";
import type { AgentConfig, PreflightResult } from "@/types/agent";

/* ─── Score arc ──────────────────────────────────────────────────────────────── */
function ScoreArc({ score }: { score: number }) {
  const isGood = score >= 90;
  const isOk = score >= 70;
  const color = isGood ? "#0C8A5E" : isOk ? "#B87318" : "#D13B3B";
  const trackColor = isGood ? "#D1FAE5" : isOk ? "#FDE68A" : "#FECACA";
  const r = 62;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <svg width={156} height={156} viewBox="0 0 156 156" aria-label={`Readiness score: ${score} out of 100`}>
      <circle cx={78} cy={78} r={r} fill="none" stroke={trackColor} strokeWidth={9} />
      <motion.circle
        cx={78} cy={78} r={r}
        fill="none"
        stroke={color}
        strokeWidth={9}
        strokeLinecap="round"
        transform="rotate(-90 78 78)"
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${dash} ${circ - dash}` }}
        transition={{ duration: 1.0, ease: [0.22, 1.0, 0.36, 1.0], delay: 0.15 }}
      />
      <motion.text
        x="78" y="72"
        textAnchor="middle"
        fontSize="34"
        fontWeight="800"
        fill={color}
        fontFamily="Inter, sans-serif"
        letterSpacing="-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        {score}
      </motion.text>
      <text x="78" y="90" textAnchor="middle" fontSize="11.5" fontWeight="500" fill="#97A0B4" fontFamily="Inter, sans-serif">/100</text>
    </svg>
  );
}

/* ─── Finding row ────────────────────────────────────────────────────────────── */
function FindingRow({ severity, title, evidence, idx }: {
  severity: "critical" | "warning" | "passed";
  title: string;
  evidence: string;
  idx: number;
}) {
  const isCrit = severity === "critical";
  const isWarn = severity === "warning";
  const dotColor = isCrit ? "#D13B3B" : isWarn ? "#B87318" : "#0C8A5E";
  const bg = isCrit ? "var(--color-danger-bg)" : isWarn ? "var(--color-warning-bg)" : "transparent";
  const border = isCrit ? "var(--color-danger-border)" : isWarn ? "var(--color-warning-border)" : "var(--color-border)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + idx * 0.05, duration: 0.3 }}
      style={{
        display: "flex",
        gap: 12,
        padding: "12px 14px",
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: "var(--radius-lg)",
        marginBottom: 8,
      }}
    >
      <div style={{ paddingTop: 3, flexShrink: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{evidence}</div>
      </div>
    </motion.div>
  );
}

/* ─── Tool card ──────────────────────────────────────────────────────────────── */
function ToolCard({ href, label, description, tag }: {
  href: string; label: string; description: string; tag?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        animate={{ y: hovered ? -2 : 0, boxShadow: hovered ? "var(--shadow-md)" : "var(--shadow-xs)" }}
        transition={{ duration: 0.15 }}
        style={{
          background: "var(--color-surface)",
          border: `1px solid ${hovered ? "var(--color-accent)" : "var(--color-border)"}`,
          borderRadius: "var(--radius-lg)",
          padding: "16px 18px",
          cursor: "pointer",
          height: "100%",
          transition: "border-color 150ms",
        }}
      >
        {tag && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
            color: "var(--color-accent)", background: "var(--color-accent-tint)",
            borderRadius: "var(--radius-sm)", padding: "2px 7px", marginBottom: 10,
          }}>
            {tag}
          </div>
        )}
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.55 }}>{description}</div>
      </motion.div>
    </Link>
  );
}

/* ─── Completeness pill ──────────────────────────────────────────────────────── */
function CheckPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      fontSize: 12, color: ok ? "var(--color-success)" : "var(--color-text-tertiary)",
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {ok
          ? <><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>
          : <circle cx="12" cy="12" r="9" strokeDasharray="4 3" />
        }
      </svg>
      {label}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */
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
    }, 600);
  }

  const critical = preflight?.findings.filter(f => f.severity === "critical") ?? [];
  const warnings = preflight?.findings.filter(f => f.severity === "warning") ?? [];
  const passed = preflight?.findings.filter(f => f.severity === "passed") ?? [];

  const scoreColor = !preflight ? "var(--color-text-tertiary)"
    : preflight.score >= 90 ? "var(--color-success)"
    : preflight.score >= 70 ? "var(--color-warning)" : "var(--color-danger)";

  return (
    <AppShell breadcrumb="Mission Control">

      {/* ── Agent context bar ── */}
      {config && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "10px 16px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            marginBottom: 20,
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: "var(--radius-md)",
            background: "var(--color-accent-tint)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 00-3 3v4a3 3 0 006 0V5a3 3 0 00-3-3z" />
              <path d="M19 10a7 7 0 01-14 0" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="8" y1="22" x2="16" y2="22" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{config.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--color-text-secondary)" }}>Amaze Developers · Real-estate lead qualification</div>
          </div>
          <div style={{ display: "flex", gap: 20 }} className="completeness-row">
            {[
              { label: "Name", ok: !!config.name },
              { label: "Objective", ok: !!config.objective },
              { label: "Prompt", ok: config.systemPrompt.length > 20 },
              { label: "Variables", ok: config.variables.every(v => v.isRuntime || !!v.value) },
              { label: "Handoff", ok: config.tools.some(t => (t.name === "transfer_call" || t.name === "schedule_callback") && t.enabled) },
            ].map((c, i) => <CheckPill key={i} ok={c.ok} label={c.label} />)}
          </div>
        </motion.div>
      )}

      {/* ── Main readiness panel ── */}
      <AnimatePresence mode="wait">
        {!preflight ? (
          /* Unrun state */
          <motion.div
            key="unrun"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              padding: "48px 40px",
              marginBottom: 20,
              textAlign: "center",
              boxShadow: "var(--shadow-sm)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Atmospheric tint */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(74,100,255,0.05) 0%, transparent 70%)",
            }} />

            <div style={{ position: "relative" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "var(--radius-xl)",
                background: "var(--color-accent-tint)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>

              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8, letterSpacing: "-0.02em" }}>
                Know if your agent is ready.
              </div>
              <p style={{ fontSize: 14, color: "var(--color-text-secondary)", maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.65 }}>
                Run a preflight check to surface configuration gaps before your first real customer conversation.
              </p>

              <motion.button
                onClick={runCheck}
                disabled={running || !config}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: "11px 28px",
                  borderRadius: "var(--radius-lg)",
                  fontSize: 14,
                  fontWeight: 600,
                  background: "var(--color-accent)",
                  color: "#fff",
                  border: "none",
                  cursor: running || !config ? "not-allowed" : "pointer",
                  opacity: running ? 0.7 : 1,
                  boxShadow: "var(--shadow-accent)",
                  letterSpacing: "-0.01em",
                }}
              >
                {running ? "Analyzing…" : "Run Preflight Check"}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* Result state */
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ marginBottom: 20 }}
          >
            <div style={{
              display: "grid",
              gridTemplateColumns: "220px 1fr",
              gap: 16,
              alignItems: "stretch",
            }} className="result-grid">

              {/* Score card */}
              <div style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-xl)",
                padding: "28px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: "var(--shadow-sm)",
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  background: `radial-gradient(ellipse 120% 80% at 50% 110%, ${
                    preflight.score >= 90 ? "rgba(12,138,94,0.06)" :
                    preflight.score >= 70 ? "rgba(184,115,24,0.06)" : "rgba(209,59,59,0.06)"
                  } 0%, transparent 70%)`,
                }} />
                <ScoreArc score={preflight.score} />
                <div style={{ textAlign: "center", position: "relative" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor, letterSpacing: "-0.01em" }}>
                    {preflight.scoreLabel}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>
                    Configuration readiness
                  </div>
                </div>
                <motion.button
                  onClick={runCheck}
                  disabled={running}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    marginTop: 8,
                    padding: "7px 18px",
                    borderRadius: "var(--radius-md)",
                    fontSize: 12,
                    fontWeight: 600,
                    background: "var(--color-accent)",
                    color: "#fff",
                    border: "none",
                    cursor: running ? "not-allowed" : "pointer",
                    opacity: running ? 0.6 : 1,
                    position: "relative",
                  }}
                >
                  {running ? "Re-analyzing…" : "Re-check"}
                </motion.button>
              </div>

              {/* Findings card */}
              <div style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-xl)",
                padding: "20px 20px",
                boxShadow: "var(--shadow-sm)",
                overflow: "hidden",
              }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: 2 }}>
                      Readiness Report
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
                      {critical.length === 0 && warnings.length === 0
                        ? "Agent is ready for launch"
                        : `${critical.length + warnings.length} issue${critical.length + warnings.length !== 1 ? "s" : ""} found`}
                    </div>
                  </div>
                  {critical.length > 0 && (
                    <Link href="/fix" style={{ textDecoration: "none" }}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        style={{
                          padding: "7px 14px",
                          borderRadius: "var(--radius-md)",
                          fontSize: 12,
                          fontWeight: 600,
                          background: "var(--color-danger-bg)",
                          color: "var(--color-danger)",
                          border: "1px solid var(--color-danger-border)",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Fix {critical.length} blocker{critical.length !== 1 ? "s" : ""} →
                      </motion.div>
                    </Link>
                  )}
                </div>

                {/* Stats row */}
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Critical", count: critical.length, color: "var(--color-danger)", bg: "var(--color-danger-bg)" },
                    { label: "Warnings", count: warnings.length, color: "var(--color-warning)", bg: "var(--color-warning-bg)" },
                    { label: "Passed", count: passed.length, color: "var(--color-success)", bg: "var(--color-success-bg)" },
                  ].map((s, i) => (
                    <div key={i} style={{
                      flex: 1, padding: "10px 12px",
                      background: s.bg,
                      borderRadius: "var(--radius-md)",
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>{s.count}</div>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: s.color, opacity: 0.8, letterSpacing: "0.04em" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Findings list */}
                <div style={{ maxHeight: 240, overflowY: "auto" }}>
                  {[...critical, ...warnings].slice(0, 6).map((f, i) => (
                    <FindingRow
                      key={f.id}
                      severity={f.severity}
                      title={f.title}
                      evidence={f.evidence}
                      idx={i}
                    />
                  ))}
                  {critical.length === 0 && warnings.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "var(--color-success)",
                        fontSize: 13,
                        fontWeight: 500,
                        background: "var(--color-success-bg)",
                        borderRadius: "var(--radius-lg)",
                        border: "1px solid var(--color-success-border)",
                      }}
                    >
                      ✓ All checks passed — agent is configured for launch
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tool navigation ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase",
          color: "var(--color-text-tertiary)", marginBottom: 12,
        }}>
          Tools
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }} className="tools-grid">
          <ToolCard href="/preflight" label="Inspect" description="Review agent configuration" />
          <ToolCard href="/fix" label="Fix Studio" description="Guided resolution for each finding" tag="Action" />
          <ToolCard href="/scenario" label="Scenario Lab" description="Nine deterministic conversation tests" />
          <ToolCard href="/compare" label="Before / After" description="Score delta across changes" />
          <ToolCard href="/connect" label="Connect" description="Live WebRTC voice session" tag="Live" />
        </div>
      </div>

      {/* ── Validation history ── */}
      {history.length > 0 && (
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-xs)",
        }}>
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)" }}>
              Recent Runs
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
              Stored locally
            </div>
          </div>
          <div>
            {history.slice(0, 5).map((run, i) => {
              const rc = run.score >= 90 ? "var(--color-success)"
                : run.score >= 70 ? "var(--color-warning)" : "var(--color-danger)";
              return (
                <div
                  key={run.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "10px 16px",
                    borderBottom: i < Math.min(history.length, 5) - 1 ? "1px solid var(--color-border)" : "none",
                  }}
                >
                  <div style={{
                    fontSize: 17, fontWeight: 800, color: rc,
                    minWidth: 34, letterSpacing: "-0.03em",
                  }}>
                    {run.score}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: rc }}>{run.scoreLabel}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                      {run.criticalCount > 0 ? `${run.criticalCount} critical` : ""}
                      {run.criticalCount > 0 && run.warningCount > 0 ? " · " : ""}
                      {run.warningCount > 0 ? `${run.warningCount} warning` : ""}
                      {run.criticalCount === 0 && run.warningCount === 0 ? "All clear" : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                    {new Date(run.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .result-grid { grid-template-columns: 1fr !important; }
          .tools-grid { grid-template-columns: 1fr 1fr !important; }
          .completeness-row { display: none !important; }
        }
        @media (max-width: 600px) {
          .tools-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppShell>
  );
}
