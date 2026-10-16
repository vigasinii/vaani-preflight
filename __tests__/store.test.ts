import { describe, it, expect, beforeEach } from "vitest";
import { DEMO_FIXTURE, FIXED_FIXTURE } from "@/lib/demo-fixtures";
import { runRules } from "@/lib/preflight/rules";
import { computeScore } from "@/lib/preflight/scoring";
import type { AgentConfig } from "@/types/agent";

function base(): AgentConfig {
  return JSON.parse(JSON.stringify(DEMO_FIXTURE));
}

function fixed(): AgentConfig {
  return JSON.parse(JSON.stringify(FIXED_FIXTURE));
}

describe("Scoring stability across fixtures", () => {
  it("DEMO_FIXTURE scores below 70", () => {
    const rules = runRules(base());
    const score = computeScore(rules);
    expect(score).toBeLessThan(70);
  });

  it("FIXED_FIXTURE scores 90 or above", () => {
    const rules = runRules(fixed());
    const score = computeScore(rules);
    expect(score).toBeGreaterThanOrEqual(90);
  });

  it("FIXED_FIXTURE scores higher than DEMO_FIXTURE", () => {
    const demoScore = computeScore(runRules(base()));
    const fixedScore = computeScore(runRules(fixed()));
    expect(fixedScore).toBeGreaterThan(demoScore);
  });
});

describe("Scenario prerequisites", () => {
  it("enables transfer with valid destination: HANDOFF_AVAILABILITY passes", () => {
    const c = base();
    c.tools.find(t => t.name === "transfer_call")!.enabled = true;
    c.tools.find(t => t.name === "transfer_call")!.destination = "+919876543210";
    const rules = runRules(c);
    const ha = rules.find(r => r.ruleId === "HANDOFF_AVAILABILITY");
    expect(ha?.passed).toBe(true);
  });

  it("invalid E.164 destination fails TRANSFER_DESTINATION", () => {
    const c = base();
    c.tools.find(t => t.name === "transfer_call")!.enabled = true;
    c.tools.find(t => t.name === "transfer_call")!.destination = "9876543210";
    const rules = runRules(c);
    const td = rules.find(r => r.ruleId === "TRANSFER_DESTINATION");
    expect(td?.passed).toBe(false);
    expect(td?.severity).toBe("warning");
  });

  it("E.164 with + and country code passes TRANSFER_DESTINATION", () => {
    const c = base();
    c.tools.find(t => t.name === "transfer_call")!.enabled = true;
    c.tools.find(t => t.name === "transfer_call")!.destination = "+12025550001";
    const rules = runRules(c);
    const td = rules.find(r => r.ruleId === "TRANSFER_DESTINATION");
    expect(td?.passed).toBe(true);
  });

  it("unresolved variable in greeting is flagged", () => {
    const c = base();
    c.greeting = "Hello from {{UnknownVar}}";
    c.variables = [];
    const rules = runRules(c);
    const uv = rules.find(r => r.ruleId === "UNRESOLVED_VARIABLES");
    expect(uv?.passed).toBe(false);
    expect(uv?.title).toContain("UnknownVar");
  });

  it("runtime variable is not flagged as unresolved", () => {
    const c = base();
    c.greeting = "Hello, I am speaking with {{name}}?";
    c.variables = [{ name: "name", value: "", isRuntime: true }];
    const rules = runRules(c);
    const uv = rules.find(r => r.ruleId === "UNRESOLVED_VARIABLES");
    expect(uv?.passed).toBe(true);
  });
});

describe("Escalation priority rule", () => {
  it("flags warning when prompt lacks escalation language", () => {
    const c = base();
    c.systemPrompt = "Qualify leads by asking questions about property.";
    const rules = runRules(c);
    const ep = rules.find(r => r.ruleId === "ESCALATION_PRIORITY");
    expect(ep?.severity).toBe("warning");
    expect(ep?.passed).toBe(false);
  });

  it("passes when 'immediately' appears in prompt", () => {
    const c = base();
    c.systemPrompt = "If at any point the customer requests a human, immediately offer a transfer.";
    const rules = runRules(c);
    const ep = rules.find(r => r.ruleId === "ESCALATION_PRIORITY");
    expect(ep?.passed).toBe(true);
  });
});

describe("Fix application correctness", () => {
  it("enabling transfer_call resolves HANDOFF_AVAILABILITY", () => {
    const c = base();
    c.tools.find(t => t.name === "transfer_call")!.enabled = true;
    c.tools.find(t => t.name === "transfer_call")!.destination = "+910000000000";
    const rules = runRules(c);
    expect(rules.find(r => r.ruleId === "HANDOFF_AVAILABILITY")?.passed).toBe(true);
    expect(rules.find(r => r.ruleId === "TRANSFER_DESTINATION")?.passed).toBe(true);
  });

  it("adding escalation language to prompt resolves ESCALATION_PRIORITY", () => {
    const c = base();
    const extra = "\n\nIf at any point the customer requests a human, immediately offer a transfer.";
    c.systemPrompt = c.systemPrompt + extra;
    const rules = runRules(c);
    expect(rules.find(r => r.ruleId === "ESCALATION_PRIORITY")?.passed).toBe(true);
  });
});
