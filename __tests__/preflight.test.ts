import { describe, it, expect } from "vitest";
import { runRules } from "@/lib/preflight/rules";
import { computeScore } from "@/lib/preflight/scoring";
import { runSimulation } from "@/lib/preflight/simulation";
import { buildExportData } from "@/lib/export";
import { DEMO_FIXTURE, FIXED_FIXTURE } from "@/lib/demo-fixtures";
import { runPreflight } from "@/lib/preflight/engine";
import type { AgentConfig } from "@/types/agent";

function base(): AgentConfig {
  return JSON.parse(JSON.stringify(DEMO_FIXTURE));
}

describe("Rule: HANDOFF_AVAILABILITY", () => {
  it("flags critical when objective needs handoff but no tool enabled", () => {
    const c = base();
    const results = runRules(c);
    const r = results.find((x) => x.ruleId === "HANDOFF_AVAILABILITY")!;
    expect(r.severity).toBe("critical");
    expect(r.passed).toBe(false);
  });

  it("passes when transfer_call is enabled with valid destination", () => {
    const c = base();
    c.tools.find((t) => t.name === "transfer_call")!.enabled = true;
    c.tools.find((t) => t.name === "transfer_call")!.destination = "+919876543210";
    const results = runRules(c);
    const r = results.find((x) => x.ruleId === "HANDOFF_AVAILABILITY")!;
    expect(r.passed).toBe(true);
  });
});

describe("Rule: TRANSFER_DESTINATION", () => {
  it("flags critical when transfer enabled but destination missing", () => {
    const c = base();
    c.tools.find((t) => t.name === "transfer_call")!.enabled = true;
    c.tools.find((t) => t.name === "transfer_call")!.destination = "";
    const results = runRules(c);
    const r = results.find((x) => x.ruleId === "TRANSFER_DESTINATION")!;
    expect(r.severity).toBe("critical");
    expect(r.passed).toBe(false);
  });

  it("flags warning for invalid E.164 number", () => {
    const c = base();
    c.tools.find((t) => t.name === "transfer_call")!.enabled = true;
    c.tools.find((t) => t.name === "transfer_call")!.destination = "12345";
    const results = runRules(c);
    const r = results.find((x) => x.ruleId === "TRANSFER_DESTINATION")!;
    expect(r.severity).toBe("warning");
  });

  it("passes for valid E.164 number", () => {
    const c = base();
    c.tools.find((t) => t.name === "transfer_call")!.enabled = true;
    c.tools.find((t) => t.name === "transfer_call")!.destination = "+919876543210";
    const results = runRules(c);
    const r = results.find((x) => x.ruleId === "TRANSFER_DESTINATION")!;
    expect(r.passed).toBe(true);
  });

  it("is always emitted even when transfer is disabled (stable denominator)", () => {
    const c = base();
    // transfer_call is disabled in base
    const results = runRules(c);
    const r = results.find((x) => x.ruleId === "TRANSFER_DESTINATION");
    expect(r).toBeDefined();
    expect(r!.passed).toBe(true);
  });
});

describe("Rule: PROMPT_ACTION_MISMATCH", () => {
  it("flags warning when prompt references @transfer_call but tool disabled", () => {
    const c = base();
    c.systemPrompt = "Use @transfer_call when needed.";
    const results = runRules(c);
    const r = results.find((x) => x.ruleId === "PROMPT_ACTION_MISMATCH")!;
    expect(r.severity).toBe("warning");
    expect(r.passed).toBe(false);
  });
});

describe("Rule: ESCALATION_PRIORITY", () => {
  it("flags warning when no escalation priority language in prompt", () => {
    const c = base();
    const results = runRules(c);
    const r = results.find((x) => x.ruleId === "ESCALATION_PRIORITY")!;
    expect(r.severity).toBe("warning");
  });

  it("passes when prompt includes 'immediately'", () => {
    const c = base();
    c.systemPrompt = "If the customer requests a human, immediately use @transfer_call.";
    c.tools.find((t) => t.name === "transfer_call")!.enabled = true;
    c.tools.find((t) => t.name === "transfer_call")!.destination = "+919876543210";
    const results = runRules(c);
    const r = results.find((x) => x.ruleId === "ESCALATION_PRIORITY")!;
    expect(r.passed).toBe(true);
  });
});

describe("Rule: UNRESOLVED_VARIABLES", () => {
  it("flags warning for unresolved variable in greeting", () => {
    const c = base();
    c.greeting = "Hello {{unknown_var}}";
    const results = runRules(c);
    const r = results.find((x) => x.ruleId === "UNRESOLVED_VARIABLES")!;
    expect(r.severity).toBe("warning");
    expect(r.passed).toBe(false);
  });

  it("does not flag runtime variables as missing", () => {
    const c = base();
    const results = runRules(c);
    const r = results.find((x) => x.ruleId === "UNRESOLVED_VARIABLES")!;
    expect(r.passed).toBe(true);
  });
});

describe("Scoring", () => {
  it("score is lower for broken config than fixed config", () => {
    const brokenRules = runRules(base());
    const fixedRules = runRules(JSON.parse(JSON.stringify(FIXED_FIXTURE)));
    const brokenScore = computeScore(brokenRules);
    const fixedScore = computeScore(fixedRules);
    expect(fixedScore).toBeGreaterThanOrEqual(brokenScore);
  });
});

describe("Simulation", () => {
  it("returns no_tool when no handoff tool enabled", () => {
    const result = runSimulation(base());
    expect(result.status).toBe("no_tool");
  });

  it("returns incomplete when transfer enabled but no valid destination", () => {
    const c = base();
    c.tools.find((t) => t.name === "transfer_call")!.enabled = true;
    c.tools.find((t) => t.name === "transfer_call")!.destination = "";
    const result = runSimulation(c);
    expect(result.status).toBe("incomplete");
  });

  it("returns ready_transfer when transfer fully configured", () => {
    const c = base();
    c.tools.find((t) => t.name === "transfer_call")!.enabled = true;
    c.tools.find((t) => t.name === "transfer_call")!.destination = "+919876543210";
    const result = runSimulation(c);
    expect(result.status).toBe("ready_transfer");
  });

  it("returns ready_callback when only callback enabled", () => {
    const c = base();
    c.tools.find((t) => t.name === "schedule_callback")!.enabled = true;
    const result = runSimulation(c);
    expect(result.status).toBe("ready_callback");
  });

  it("does not claim live transfer success", () => {
    const c = base();
    c.tools.find((t) => t.name === "transfer_call")!.enabled = true;
    c.tools.find((t) => t.name === "transfer_call")!.destination = "+919876543210";
    const result = runSimulation(c);
    expect(result.limitations.some((l) => l.toLowerCase().includes("configuration simulation"))).toBe(true);
  });
});

describe("Export redaction", () => {
  it("redacts phone numbers from export", () => {
    const c = base();
    c.tools.find((t) => t.name === "transfer_call")!.enabled = true;
    c.tools.find((t) => t.name === "transfer_call")!.destination = "+919876543210";
    const preflight = runPreflight(c);
    const data = buildExportData(c, preflight, null);
    const json = JSON.stringify(data);
    expect(json).not.toContain("919876543210");
  });
});

describe("Bug fix: enabled-but-unconfigured transfer is not treated as ready", () => {
  it("HANDOFF_AVAILABILITY is critical when transfer is enabled but destination is empty", () => {
    const c = base();
    c.tools.find((t) => t.name === "transfer_call")!.enabled = true;
    c.tools.find((t) => t.name === "transfer_call")!.destination = "";
    const results = runRules(c);
    const r = results.find((x) => x.ruleId === "HANDOFF_AVAILABILITY")!;
    expect(r.severity).toBe("critical");
    expect(r.passed).toBe(false);
  });

  it("HANDOFF_AVAILABILITY passes when callback is enabled (callback is a valid fallback)", () => {
    const c = base();
    c.tools.find((t) => t.name === "schedule_callback")!.enabled = true;
    const results = runRules(c);
    const r = results.find((x) => x.ruleId === "HANDOFF_AVAILABILITY")!;
    expect(r.passed).toBe(true);
  });
});

describe("Bug fix: stable scoring denominator", () => {
  it("TRANSFER_DESTINATION always appears in rule results", () => {
    const withTransfer = base();
    withTransfer.tools.find((t) => t.name === "transfer_call")!.enabled = true;
    withTransfer.tools.find((t) => t.name === "transfer_call")!.destination = "+919876543210";
    withTransfer.systemPrompt = "immediately offer a transfer if customer requests a human.";

    const withoutTransfer = base();
    withoutTransfer.objective = "Qualify leads only, no human handoff needed.";
    withoutTransfer.systemPrompt = "Ask questions only.";

    const r1 = runRules(withTransfer);
    const r2 = runRules(withoutTransfer);
    // TRANSFER_DESTINATION must always appear
    expect(r1.find((x) => x.ruleId === "TRANSFER_DESTINATION")).toBeDefined();
    expect(r2.find((x) => x.ruleId === "TRANSFER_DESTINATION")).toBeDefined();
  });
});

describe("Bug fix: simulation does not promise follow-up when no mechanism exists", () => {
  it("no_tool response does not promise follow-up", () => {
    const result = runSimulation(base());
    expect(result.status).toBe("no_tool");
    expect(result.agentResponse.toLowerCase()).not.toContain("ensure someone follows up");
    expect(result.agentResponse.toLowerCase()).not.toContain("make sure your request is noted");
  });

  it("incomplete response does not promise follow-up", () => {
    const c = base();
    c.tools.find((t) => t.name === "transfer_call")!.enabled = true;
    c.tools.find((t) => t.name === "transfer_call")!.destination = "";
    const result = runSimulation(c);
    expect(result.status).toBe("incomplete");
    expect(result.agentResponse.toLowerCase()).not.toContain("ensure someone follows up");
  });
});
