import { z } from "zod";

export const ToolSchema = z.object({
  name: z.string(),
  enabled: z.boolean(),
  destination: z.string().optional(),
  instructions: z.string().optional(),
});
export type Tool = z.infer<typeof ToolSchema>;

export const VariableSchema = z.object({
  name: z.string(),
  value: z.string().optional(),
  isRuntime: z.boolean().default(false),
});
export type Variable = z.infer<typeof VariableSchema>;

export const AgentConfigSchema = z.object({
  name: z.string(),
  objective: z.string(),
  systemPrompt: z.string(),
  greeting: z.string(),
  variables: z.array(VariableSchema),
  tools: z.array(ToolSchema),
});
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export type Severity = "critical" | "warning" | "passed";

export interface Finding {
  id: string;
  ruleId: string;
  severity: Severity;
  title: string;
  evidence: string;
  whyItMatters: string;
  recommendedAction: string;
  affectedField: string;
  passed: boolean;
}

export interface PreflightResult {
  findings: Finding[];
  score: number;
  scoreLabel: string;
  blockingIssues: string[];
  timestamp: string;
}

export type SimulationStatus = "no_tool" | "incomplete" | "ready_transfer" | "ready_callback";

export interface SimulationResult {
  status: SimulationStatus;
  message: string;
  agentResponse: string;
  limitations: string[];
}
