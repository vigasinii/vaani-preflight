import type { AgentConfig, PreflightResult } from "@/types/agent";
import { runRules } from "./rules";
import { computeScore, scoreLabel } from "./scoring";

export function runPreflight(config: AgentConfig): PreflightResult {
  const ruleResults = runRules(config);

  const findings = ruleResults
    .map((r, i) => ({
      id: `finding-${i}`,
      ruleId: r.ruleId,
      severity: r.severity,
      title: r.title,
      evidence: r.evidence,
      whyItMatters: r.whyItMatters,
      recommendedAction: r.recommendedAction,
      affectedField: r.affectedField,
    }));

  const score = computeScore(ruleResults);
  const label = scoreLabel(score);
  const blockingIssues = ruleResults
    .filter((r) => r.severity === "critical" && !r.passed)
    .map((r) => r.title);

  return {
    findings,
    score,
    scoreLabel: label,
    blockingIssues,
    timestamp: new Date().toISOString(),
  };
}
