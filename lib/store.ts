import type { AgentConfig } from "@/types/agent";
import { DEMO_FIXTURE } from "./demo-fixtures";

const CONFIG_KEY = "vp_config_v1";
const HISTORY_KEY = "vp_history_v1";

export function loadConfig(): AgentConfig {
  if (typeof window === "undefined") return structuredClone(DEMO_FIXTURE);
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return structuredClone(DEMO_FIXTURE);
    return JSON.parse(raw) as AgentConfig;
  } catch {
    return structuredClone(DEMO_FIXTURE);
  }
}

export function saveConfig(config: AgentConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Storage unavailable - no-op
  }
}

export function resetConfig(): AgentConfig {
  const fresh = structuredClone(DEMO_FIXTURE);
  saveConfig(fresh);
  return fresh;
}

export interface ValidationRun {
  id: string;
  timestamp: string;
  score: number;
  scoreLabel: string;
  criticalCount: number;
  warningCount: number;
}

export function loadHistory(): ValidationRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ValidationRun[];
  } catch {
    return [];
  }
}

export function appendHistory(run: Omit<ValidationRun, "id">): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadHistory();
    const entry: ValidationRun = { id: `run_${Date.now()}`, ...run };
    const updated = [entry, ...existing].slice(0, 20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // no-op
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // no-op
  }
}
