import type { AgentConfig } from "@/types/agent";

export function resolveGreeting(config: AgentConfig): string {
  let text = config.greeting;
  for (const v of config.variables) {
    const display = v.isRuntime ? `[${v.name} - provided at runtime]` : v.value || `[${v.name}]`;
    text = text.replaceAll(`{{${v.name}}}`, display);
  }
  return text;
}
