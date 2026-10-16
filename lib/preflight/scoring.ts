import type { RuleResult } from "./rules";

const WEIGHTS: Record<string, number> = {
  HANDOFF_AVAILABILITY: 35,
  TRANSFER_DESTINATION: 25,
  PROMPT_ACTION_MISMATCH: 15,
  ESCALATION_PRIORITY: 15,
  UNRESOLVED_VARIABLES: 10,
};

export function computeScore(results: RuleResult[]): number {
  let total = 0;
  let earned = 0;
  for (const result of results) {
    const weight = WEIGHTS[result.ruleId] ?? 10;
    total += weight;
    if (result.passed) earned += weight;
    else if (result.severity === "warning") earned += weight * 0.4;
  }
  return total === 0 ? 100 : Math.round((earned / total) * 100);
}

export function scoreLabel(score: number): string {
  if (score >= 90) return "Ready";
  if (score >= 70) return "Needs Review";
  if (score >= 40) return "At Risk";
  return "Not Ready";
}
