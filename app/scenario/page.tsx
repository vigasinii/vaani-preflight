"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { loadConfig } from "@/lib/store";
import type { AgentConfig } from "@/types/agent";
import { runRules } from "@/lib/preflight/rules";

interface Scenario {
  id: string;
  title: string;
  objective: string;
  utterance: string;
  requiredCapability: string;
  prerequisites: string[];
  evaluate: (cfg: AgentConfig) => ScenarioResult;
}

interface ScenarioResult {
  outcome: "pass" | "fail" | "warn";
  label: string;
  trace: string[];
  correction?: string;
}

const E164 = /^\+[1-9]\d{7,14}$/;

function hasTool(cfg: AgentConfig, name: string) {
  return cfg.tools.find(t => t.name === name);
}

function hasEnabledTool(cfg: AgentConfig, name: string) {
  return cfg.tools.find(t => t.name === name && t.enabled);
}

function hasReadyTransfer(cfg: AgentConfig) {
  const t = hasTool(cfg, "transfer_call");
  return t?.enabled && !!t.destination && E164.test(t.destination.trim());
}

const SCENARIOS: Scenario[] = [
  {
    id: "s1",
    title: "Immediate human request",
    objective: "Customer requests a human agent at the very start of the call.",
    utterance: "Can I speak to a real estate agent?",
    requiredCapability: "Enabled handoff tool with valid destination",
    prerequisites: ["transfer_call enabled with E.164 destination, OR schedule_callback enabled"],
    evaluate(cfg) {
      const trace: string[] = [];
      const transfer = hasTool(cfg, "transfer_call");
      const callback = hasTool(cfg, "schedule_callback");
      trace.push(`transfer_call: enabled=${transfer?.enabled ?? false}, destination="${transfer?.destination ?? ""}"`);
      trace.push(`schedule_callback: enabled=${callback?.enabled ?? false}`);
      const ready = hasReadyTransfer(cfg) || !!callback?.enabled;
      const escalation = cfg.systemPrompt.toLowerCase().includes("immediately") || cfg.systemPrompt.toLowerCase().includes("if at any point");
      trace.push(`Escalation priority language in prompt: ${escalation}`);
      if (!ready) {
        return { outcome: "fail", label: "No handoff path available", trace, correction: "Enable transfer_call with a valid E.164 destination, or enable schedule_callback." };
      }
      if (!escalation) {
        return { outcome: "warn", label: "Handoff available but may be delayed", trace, correction: "Add explicit escalation priority: 'If at any point the customer requests a human, immediately offer a transfer.'" };
      }
      return { outcome: "pass", label: "Agent can immediately offer transfer", trace };
    },
  },
  {
    id: "s2",
    title: "Human request after qualification begins",
    objective: "Customer interrupts mid-qualification to request a human.",
    utterance: "Actually, can I just talk to a person?",
    requiredCapability: "Escalation priority language in system prompt",
    prerequisites: ["System prompt contains 'immediately' or 'if at any point' for escalation", "Handoff tool enabled"],
    evaluate(cfg) {
      const trace: string[] = [];
      const escalation = cfg.systemPrompt.toLowerCase().includes("immediately") || cfg.systemPrompt.toLowerCase().includes("if at any point");
      trace.push(`Escalation priority language: ${escalation}`);
      const ready = hasReadyTransfer(cfg) || !!hasEnabledTool(cfg, "schedule_callback");
      trace.push(`Handoff tool ready: ${ready}`);
      if (!ready) return { outcome: "fail", label: "No handoff tool configured", trace, correction: "Enable transfer_call or schedule_callback." };
      if (!escalation) return { outcome: "warn", label: "Agent may finish qualification first", trace, correction: "Add explicit escalation rule to system prompt." };
      return { outcome: "pass", label: "Agent will honor request immediately", trace };
    },
  },
  {
    id: "s3",
    title: "Repeated human request",
    objective: "Customer asks multiple times — agent keeps qualifying instead.",
    utterance: "I said I want to talk to a human! Please!",
    requiredCapability: "Escalation priority that overrides qualification flow",
    prerequisites: ["Escalation priority language", "No loop-back to qualification after escalation"],
    evaluate(cfg) {
      const trace: string[] = [];
      const escalation = cfg.systemPrompt.toLowerCase().includes("immediately") || cfg.systemPrompt.toLowerCase().includes("do not continue");
      trace.push(`Strong escalation language: ${escalation}`);
      const ready = hasReadyTransfer(cfg) || !!hasEnabledTool(cfg, "schedule_callback");
      trace.push(`Handoff ready: ${ready}`);
      if (!ready) return { outcome: "fail", label: "No handoff path — repeated requests will be ignored", trace, correction: "Enable a handoff tool." };
      if (!escalation) return { outcome: "warn", label: "Agent may re-qualify after first escalation", trace, correction: "Add 'do not continue qualification' language to the prompt." };
      return { outcome: "pass", label: "Agent will transfer without re-qualifying", trace };
    },
  },
  {
    id: "s4",
    title: "Transfer disabled",
    objective: "transfer_call is disabled — what happens when a human is requested?",
    utterance: "Can you transfer me to someone?",
    requiredCapability: "transfer_call enabled",
    prerequisites: ["transfer_call.enabled = true"],
    evaluate(cfg) {
      const trace: string[] = [];
      const t = hasTool(cfg, "transfer_call");
      trace.push(`transfer_call found: ${!!t}, enabled: ${t?.enabled ?? false}`);
      const callback = hasEnabledTool(cfg, "schedule_callback");
      trace.push(`schedule_callback fallback: ${!!callback}`);
      if (!t?.enabled) {
        if (callback) return { outcome: "warn", label: "Transfer disabled — callback fallback available", trace, correction: "Enable transfer_call for synchronous handoff." };
        return { outcome: "fail", label: "Transfer disabled and no fallback", trace, correction: "Enable transfer_call and configure a destination." };
      }
      return { outcome: "pass", label: "Transfer is enabled", trace };
    },
  },
  {
    id: "s5",
    title: "Missing transfer destination",
    objective: "transfer_call is enabled but no destination phone number is set.",
    utterance: "Please transfer me.",
    requiredCapability: "transfer_call with valid E.164 destination",
    prerequisites: ["transfer_call.enabled = true", "transfer_call.destination matches E.164"],
    evaluate(cfg) {
      const trace: string[] = [];
      const t = hasTool(cfg, "transfer_call");
      trace.push(`transfer_call enabled: ${t?.enabled ?? false}`);
      trace.push(`destination: "${t?.destination ?? ""}"`);
      if (!t?.enabled) return { outcome: "fail", label: "transfer_call not enabled", trace, correction: "Enable transfer_call first." };
      if (!t.destination || !t.destination.trim()) return { outcome: "fail", label: "Destination field is empty", trace, correction: "Enter a valid E.164 phone number." };
      if (!E164.test(t.destination.trim())) return { outcome: "fail", label: `Destination "${t.destination}" is not valid E.164`, trace, correction: "Format: +[country code][number], e.g. +919876543210" };
      return { outcome: "pass", label: "Transfer destination is valid", trace };
    },
  },
  {
    id: "s6",
    title: "Invalid destination format",
    objective: "Destination is set but doesn't match E.164 — what happens at runtime?",
    utterance: "Transfer me to your sales team.",
    requiredCapability: "E.164-formatted destination",
    prerequisites: ["transfer_call.destination matches /^\\+[1-9]\\d{7,14}$/"],
    evaluate(cfg) {
      const trace: string[] = [];
      const t = hasTool(cfg, "transfer_call");
      const dest = t?.destination ?? "";
      trace.push(`destination: "${dest}"`);
      const valid = E164.test(dest.trim());
      trace.push(`E.164 match: ${valid}`);
      if (!t?.enabled) return { outcome: "warn", label: "transfer_call is disabled — destination not tested", trace };
      if (!valid && dest) return { outcome: "fail", label: "Destination format is invalid", trace, correction: "Use E.164 format: +[country][number]." };
      if (!dest) return { outcome: "fail", label: "No destination configured", trace, correction: "Set a phone number." };
      return { outcome: "pass", label: "Destination format is valid E.164", trace };
    },
  },
  {
    id: "s7",
    title: "Callback without immediate transfer",
    objective: "schedule_callback is available, but no direct transfer is configured.",
    utterance: "I'd like to speak with someone — can you call me back?",
    requiredCapability: "schedule_callback enabled (transfer optional)",
    prerequisites: ["schedule_callback.enabled = true"],
    evaluate(cfg) {
      const trace: string[] = [];
      const cb = hasTool(cfg, "schedule_callback");
      const transfer = hasReadyTransfer(cfg);
      trace.push(`schedule_callback enabled: ${cb?.enabled ?? false}`);
      trace.push(`transfer_call ready: ${transfer}`);
      if (!cb?.enabled) return { outcome: "fail", label: "schedule_callback is disabled", trace, correction: "Enable schedule_callback to offer a callback option." };
      if (!transfer) return { outcome: "warn", label: "Callback available — no synchronous transfer", trace, correction: "Enable transfer_call for immediate handoff when the customer needs it now." };
      return { outcome: "pass", label: "Both callback and transfer are available", trace };
    },
  },
  {
    id: "s8",
    title: "Budget below minimum",
    objective: "Customer budget is ₹65 lakhs; properties start at ₹80 lakhs.",
    utterance: "My budget is 65 lakhs.",
    requiredCapability: "Budget mismatch handling in system prompt",
    prerequisites: ["systemPrompt mentions starting price", "systemPrompt handles mismatch"],
    evaluate(cfg) {
      const trace: string[] = [];
      const mentionsPrice = cfg.systemPrompt.includes("80") || cfg.systemPrompt.toLowerCase().includes("lakh");
      trace.push(`Starting price mentioned in prompt: ${mentionsPrice}`);
      const handlesMismatch = cfg.systemPrompt.toLowerCase().includes("mismatch") || cfg.systemPrompt.toLowerCase().includes("below") || cfg.systemPrompt.toLowerCase().includes("note");
      trace.push(`Mismatch handling mentioned: ${handlesMismatch}`);
      if (!mentionsPrice) return { outcome: "warn", label: "Price threshold not in system prompt", trace, correction: "Add starting price (₹80 lakhs) to system prompt so agent can flag budget mismatches." };
      if (!handlesMismatch) return { outcome: "warn", label: "No explicit mismatch handling", trace, correction: "Instruct agent how to handle budgets below the minimum." };
      return { outcome: "pass", label: "Budget mismatch guidance is present", trace };
    },
  },
  {
    id: "s9",
    title: "Unresolved greeting variable",
    objective: "Greeting references {{Company Name}} but variable has no value.",
    utterance: "(Call connects — agent speaks greeting with literal placeholder)",
    requiredCapability: "All {{variables}} in greeting resolved at runtime",
    prerequisites: ["All variables referenced in greeting have defined values"],
    evaluate(cfg) {
      const trace: string[] = [];
      const varPattern = /\{\{([^}]+)\}\}/g;
      const refs: string[] = [];
      let m: RegExpExecArray | null;
      const greetingCopy = cfg.greeting;
      const matcher = new RegExp(varPattern.source, varPattern.flags);
      while ((m = matcher.exec(greetingCopy)) !== null) refs.push(m[1].trim());
      trace.push(`Variables in greeting: ${refs.length > 0 ? refs.join(", ") : "none"}`);
      const defined = new Map(cfg.variables.map(v => [v.name, v]));
      const missing = refs.filter(r => {
        const v = defined.get(r);
        return !v || (!v.value && !v.isRuntime);
      });
      trace.push(`Unresolved (non-runtime): ${missing.length > 0 ? missing.join(", ") : "none"}`);
      if (missing.length > 0) return { outcome: "fail", label: `Unresolved: ${missing.map(v => `{{${v}}}`).join(", ")}`, trace, correction: "Define values for all non-runtime variables." };
      return { outcome: "pass", label: "All greeting variables are resolved", trace };
    },
  },
];

const outcomeStyle: Record<string, { bg: string; border: string; color: string; label: string }> = {
  pass: { bg: "var(--color-success-bg)", border: "#6ee7b7", color: "var(--color-success)", label: "Pass" },
  warn: { bg: "var(--color-warning-bg)", border: "#fde68a", color: "var(--color-warning)", label: "Warning" },
  fail: { bg: "var(--color-danger-bg)", border: "#fca5a5", color: "var(--color-danger)", label: "Fail" },
};

function ScenarioCard({ s, cfg }: { s: Scenario; cfg: AgentConfig }) {
  const [expanded, setExpanded] = useState(false);
  const result = s.evaluate(cfg);
  const style = outcomeStyle[result.outcome];

  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div
        style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
        onClick={() => setExpanded(e => !e)}
      >
        <span style={{ padding: "2px 8px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: style.bg, color: style.color, border: `1px solid ${style.border}`, whiteSpace: "nowrap" }}>
          {style.label}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{s.title}</div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{result.label}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2"
          style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 150ms" }}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--color-border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }} className="sc-detail-grid">
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: 4 }}>Objective</div>
              <div style={{ fontSize: 12, color: "var(--color-text-primary)" }}>{s.objective}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: 4 }}>Required Capability</div>
              <div style={{ fontSize: 12, color: "var(--color-text-primary)" }}>{s.requiredCapability}</div>
            </div>
          </div>

          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 4 }}>CUSTOMER UTTERANCE</div>
            <div style={{ fontSize: 13, fontStyle: "italic", color: "var(--color-text-primary)" }}>&ldquo;{s.utterance}&rdquo;</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Evaluation Trace</div>
            {result.trace.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 3 }}>
                <span style={{ color: "var(--color-border)", flexShrink: 0 }}>{i + 1}.</span>
                <code style={{ color: "var(--color-text-primary)" }}>{step}</code>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: "var(--radius-md)", background: style.bg, border: `1px solid ${style.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: style.color, marginBottom: 4 }}>
              {result.outcome === "pass" ? "RESULT" : "RESULT · CORRECTION NEEDED"}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-primary)" }}>{result.label}</div>
            {result.correction && (
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 6 }}>
                <strong>Fix: </strong>{result.correction}
              </div>
            )}
          </div>

          <div style={{ marginTop: 10, padding: "6px 12px", background: "var(--color-bg)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: 11, color: "var(--color-text-secondary)" }}>
            Configuration simulation only. No live Vaani call was executed.
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScenarioLabPage() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "pass" | "warn" | "fail">("all");

  useEffect(() => {
    setConfig(loadConfig());
  }, []);

  if (!config) {
    return <AppShell breadcrumb="Scenario Lab"><div style={{ padding: 40, textAlign: "center", color: "var(--color-text-secondary)" }}>Loading…</div></AppShell>;
  }

  const results = SCENARIOS.map(s => ({ s, result: s.evaluate(config) }));
  const counts = { pass: results.filter(r => r.result.outcome === "pass").length, warn: results.filter(r => r.result.outcome === "warn").length, fail: results.filter(r => r.result.outcome === "fail").length };
  const filtered = activeFilter === "all" ? results : results.filter(r => r.result.outcome === activeFilter);

  return (
    <AppShell breadcrumb="Scenario Lab">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
          Scenario Lab
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
          Nine Deterministic Call Scenarios
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, maxWidth: 560 }}>
          Each scenario evaluates the current agent configuration against a specific call situation.
          Results update live as you edit configuration in the Agent Workspace.
        </p>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }} className="sc-summary">
        {[
          { label: "Total Scenarios", value: SCENARIOS.length, color: "var(--color-text-primary)" },
          { label: "Passing", value: counts.pass, color: "var(--color-success)" },
          { label: "Warnings", value: counts.warn, color: "var(--color-warning)" },
          { label: "Failing", value: counts.fail, color: "var(--color-danger)" },
        ].map((s, i) => (
          <div key={i} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["all", "pass", "warn", "fail"] as const).map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} style={{
            fontSize: 12, padding: "4px 12px", borderRadius: 100, cursor: "pointer", fontWeight: 500,
            background: activeFilter === f ? "var(--color-accent-tint)" : "transparent",
            color: activeFilter === f ? "var(--color-accent)" : "var(--color-text-secondary)",
            border: activeFilter === f ? "1px solid #c4b5fd" : "1px solid transparent",
          }}>
            {f === "all" ? `All (${SCENARIOS.length})` : f === "pass" ? `Pass (${counts.pass})` : f === "warn" ? `Warn (${counts.warn})` : `Fail (${counts.fail})`}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(({ s }) => (
          <ScenarioCard key={s.id} s={s} cfg={config} />
        ))}
      </div>

      <style>{`
        @media (max-width: 700px) {
          .sc-summary { grid-template-columns: 1fr 1fr !important; }
          .sc-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppShell>
  );
}
