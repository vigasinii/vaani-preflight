"use client";
import { AppShell } from "@/components/AppShell";
import { DEMO_FIXTURE, FIXED_FIXTURE } from "@/lib/demo-fixtures";
import { runPreflight } from "@/lib/preflight/engine";

const before = runPreflight(DEMO_FIXTURE);
const after = runPreflight(FIXED_FIXTURE);
const delta = after.score - before.score;

export default function ComparePage() {
  const beforeColor = before.score >= 70 ? "var(--color-warning)" : "var(--color-danger)";
  const afterColor = after.score >= 90 ? "var(--color-success)" : after.score >= 70 ? "var(--color-warning)" : "var(--color-danger)";

  return (
    <AppShell breadcrumb="Before / After">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Before / After</div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Configuration Comparison</h1>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>Original observed configuration vs. proposed fixed configuration. All values from the validation engine.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "16px 20px" }}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 8, textTransform: "uppercase", fontWeight: 600 }}>Before (Observed)</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: beforeColor }}>{before.score}</div>
          <div style={{ fontSize: 13, color: beforeColor, fontWeight: 500 }}>{before.scoreLabel}</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-danger)" }}>
            {before.findings.filter(f => f.severity === "critical").length} critical · {before.findings.filter(f => f.severity === "warning").length} warnings
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: delta > 0 ? "var(--color-success)" : "var(--color-danger)" }}>
              {delta > 0 ? "+" : ""}{delta}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>points</div>
          </div>
        </div>

        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "16px 20px" }}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 8, textTransform: "uppercase", fontWeight: 600 }}>After (Proposed Fix)</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: afterColor }}>{after.score}</div>
          <div style={{ fontSize: 13, color: afterColor, fontWeight: 500 }}>{after.scoreLabel}</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-success)" }}>
            {after.findings.filter(f => f.severity === "critical").length} critical · {after.findings.filter(f => f.severity === "warning").length} warnings
          </div>
        </div>
      </div>

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--color-border)", fontSize: 13, fontWeight: 600 }}>Check-by-check Comparison</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
              <th style={{ padding: "8px 16px", textAlign: "left", fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Check</th>
              <th style={{ padding: "8px 16px", textAlign: "center", fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Before</th>
              <th style={{ padding: "8px 16px", textAlign: "center", fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>After</th>
            </tr>
          </thead>
          <tbody>
            {before.findings.map((bf) => {
              const af = after.findings.find(f => f.ruleId === bf.ruleId);
              const improved = af && bf.severity !== "passed" && af.severity === "passed";
              return (
                <tr key={bf.ruleId} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "10px 16px", color: "var(--color-text-primary)" }}>
                    <div style={{ fontWeight: 500 }}>{bf.ruleId.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{bf.affectedField}</div>
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                      background: bf.severity === "critical" ? "var(--color-danger-bg)" : bf.severity === "warning" ? "var(--color-warning-bg)" : "var(--color-success-bg)",
                      color: bf.severity === "critical" ? "var(--color-danger)" : bf.severity === "warning" ? "var(--color-warning)" : "var(--color-success)",
                    }}>{bf.severity}</span>
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>
                    {af && (
                      <span style={{
                        padding: "2px 8px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                        background: af.severity === "critical" ? "var(--color-danger-bg)" : af.severity === "warning" ? "var(--color-warning-bg)" : "var(--color-success-bg)",
                        color: af.severity === "critical" ? "var(--color-danger)" : af.severity === "warning" ? "var(--color-warning)" : "var(--color-success)",
                      }}>{af.severity}{improved ? " ✓" : ""}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: "10px 16px", fontSize: 11, color: "var(--color-text-secondary)", borderTop: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
          All values derived from the validation engine. The FIXED_FIXTURE uses an illustrative destination (+910000000000) - replace with a real number before production use.
        </div>
      </div>
    </AppShell>
  );
}
