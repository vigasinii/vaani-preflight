import type { AgentConfig, PreflightResult, SimulationResult } from "@/types/agent";

function redact(value: string | undefined): string {
  if (!value) return "";
  // Redact phone numbers
  return value.replace(/\+?[0-9]{10,15}/g, "[REDACTED]");
}

export function buildExportData(
  config: AgentConfig,
  preflight: PreflightResult,
  simulation: SimulationResult | null
) {
  return {
    agentName: config.name,
    exportedAt: preflight.timestamp,
    configurationReadinessScore: preflight.score,
    scoreLabel: preflight.scoreLabel,
    blockingIssues: preflight.blockingIssues,
    findings: preflight.findings.map((f) => ({
      ...f,
      evidence: redact(f.evidence),
      recommendedAction: redact(f.recommendedAction),
    })),
    simulation: simulation
      ? {
          status: simulation.status,
          message: simulation.message,
          limitations: simulation.limitations,
        }
      : null,
    tools: config.tools.map((t) => ({
      name: t.name,
      enabled: t.enabled,
      destination: t.destination ? redact(t.destination) : undefined,
    })),
    disclaimer:
      "This report is generated from local configuration analysis only. It does not represent live Vaani platform data or guarantee call success.",
  };
}

export function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
