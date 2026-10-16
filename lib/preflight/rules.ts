import type { AgentConfig, Severity } from "@/types/agent";

export interface RuleResult {
  ruleId: string;
  severity: Severity;
  title: string;
  evidence: string;
  whyItMatters: string;
  recommendedAction: string;
  affectedField: string;
  passed: boolean;
}

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

function detectsHumanHandoff(config: AgentConfig): boolean {
  const text = (config.objective + " " + config.systemPrompt).toLowerCase();
  return (
    text.includes("human agent") ||
    text.includes("transfer") ||
    text.includes("handoff") ||
    text.includes("human representative") ||
    text.includes("speak to a")
  );
}

function getTool(config: AgentConfig, name: string) {
  return config.tools.find((t) => t.name === name);
}

function hasReadyHandoffTool(config: AgentConfig): boolean {
  const E164 = /^\+[1-9]\d{7,14}$/;
  const transfer = getTool(config, "transfer_call");
  const transferReady = transfer?.enabled && !!transfer.destination && E164.test(transfer.destination.trim());
  const agentTransfer = getTool(config, "agent_transfer");
  const agentTransferEnabled = agentTransfer?.enabled ?? false;
  const callback = getTool(config, "schedule_callback");
  const callbackEnabled = callback?.enabled ?? false;
  return !!(transferReady || agentTransferEnabled || callbackEnabled);
}

export function runRules(config: AgentConfig): RuleResult[] {
  const results: RuleResult[] = [];
  const needsHandoff = detectsHumanHandoff(config);

  // Rule 1: handoff tool availability
  {
    const hasHandoff = hasReadyHandoffTool(config);
    results.push({
      ruleId: "HANDOFF_AVAILABILITY",
      severity: needsHandoff && !hasHandoff ? "critical" : "passed",
      title: needsHandoff && !hasHandoff ? "No handoff tool enabled" : "Handoff tool available",
      evidence: needsHandoff
        ? hasHandoff
          ? "Objective requires human handoff and a compatible tool is enabled."
          : "Objective requires human handoff but no fully configured handoff tool (transfer_call with destination, agent_transfer, or schedule_callback) is enabled."
        : "Objective does not appear to require human handoff.",
      whyItMatters: "Without an enabled handoff tool, the agent cannot fulfill explicit customer requests to speak with a human.",
      recommendedAction: "Enable transfer_call or schedule_callback and configure the required destination.",
      affectedField: "tools",
      passed: !needsHandoff || hasHandoff,
    });
  }

  // Rule 1b: transfer enabled but incomplete (always runs)
  {
    const transfer = getTool(config, "transfer_call");
    const transferEnabled = transfer?.enabled ?? false;
    const hasDestination = transferEnabled && !!transfer?.destination && transfer.destination.trim().length > 0;
    const isValid = hasDestination && E164_REGEX.test(transfer!.destination!.trim());
    if (transferEnabled && !isValid) {
      results.push({
        ruleId: "TRANSFER_ENABLED_INCOMPLETE",
        severity: "critical",
        title: !hasDestination ? "Transfer destination missing" : "Transfer destination invalid",
        evidence: !hasDestination
          ? "transfer_call is enabled but no destination phone number is configured."
          : `Destination "${transfer!.destination}" does not match E.164 format (+countrycode number).`,
        whyItMatters: "A transfer without a valid destination will fail at runtime, leaving the caller without a resolution path.",
        recommendedAction: "Set a valid E.164 phone number (e.g. +910000000000) as the transfer destination.",
        affectedField: "tools.transfer_call.destination",
        passed: false,
      });
    }
  }

  // Rule 2: transfer destination - always emitted for stable denominator
  {
    const transfer = getTool(config, "transfer_call");
    if (transfer?.enabled) {
      const hasDestination = !!transfer.destination && transfer.destination.trim().length > 0;
      const isValid = hasDestination && E164_REGEX.test(transfer.destination!.trim());
      results.push({
        ruleId: "TRANSFER_DESTINATION",
        severity: !hasDestination ? "critical" : !isValid ? "warning" : "passed",
        title: !hasDestination
          ? "Transfer destination missing"
          : !isValid
          ? "Transfer destination may be invalid"
          : "Transfer destination configured",
        evidence: !hasDestination
          ? "transfer_call is enabled but no destination phone number is configured."
          : !isValid
          ? `Destination "${transfer.destination}" does not match E.164 format (+countrycode number).`
          : `Destination is set and matches E.164 format.`,
        whyItMatters: "A transfer without a valid destination will fail at runtime, leaving the caller without a resolution path.",
        recommendedAction: "Set a valid E.164 phone number (e.g. +910000000000) as the transfer destination.",
        affectedField: "tools.transfer_call.destination",
        passed: isValid,
      });
    } else {
      // Always emit TRANSFER_DESTINATION for stable denominator
      results.push({
        ruleId: "TRANSFER_DESTINATION",
        severity: "passed",
        title: "Transfer not configured - not required by current tools",
        evidence: "transfer_call is not enabled; destination check does not apply.",
        whyItMatters: "A transfer without a valid destination will fail at runtime, leaving the caller without a resolution path.",
        recommendedAction: "No action required unless you enable transfer_call.",
        affectedField: "tools.transfer_call.destination",
        passed: true,
      });
    }
  }

  // Rule 3: prompt/action mismatch
  {
    const promptMentionsTransfer = config.systemPrompt.includes("@transfer_call");
    const transfer = getTool(config, "transfer_call");
    const transferDisabled = !transfer?.enabled;
    if (promptMentionsTransfer && transferDisabled) {
      results.push({
        ruleId: "PROMPT_ACTION_MISMATCH",
        severity: "warning",
        title: "Prompt references disabled tool",
        evidence: "System prompt references @transfer_call but the tool is disabled.",
        whyItMatters: "The agent may attempt to invoke @transfer_call but the action will not execute.",
        recommendedAction: "Either enable transfer_call or remove the @transfer_call reference from the prompt.",
        affectedField: "systemPrompt",
        passed: false,
      });
    } else {
      results.push({
        ruleId: "PROMPT_ACTION_MISMATCH",
        severity: "passed",
        title: "No prompt/action mismatch detected",
        evidence: "System prompt references are consistent with enabled tools.",
        whyItMatters: "Consistency between prompt instructions and enabled tools reduces runtime failures.",
        recommendedAction: "No action required.",
        affectedField: "systemPrompt",
        passed: true,
      });
    }
  }

  // Rule 4: escalation priority
  {
    const hasEscalation =
      config.systemPrompt.toLowerCase().includes("immediately") ||
      config.systemPrompt.toLowerCase().includes("if at any point") ||
      config.systemPrompt.toLowerCase().includes("do not continue");
    results.push({
      ruleId: "ESCALATION_PRIORITY",
      severity: !hasEscalation && needsHandoff ? "warning" : "passed",
      title: !hasEscalation && needsHandoff ? "Escalation priority may be unclear" : "Escalation priority appears set",
      evidence: !hasEscalation && needsHandoff
        ? "Prompt does not include explicit priority instructions for immediate escalation when a customer requests a human."
        : "Prompt includes priority language for human escalation.",
      whyItMatters: "Without clear escalation priority, the agent may complete sequential qualification before offering a transfer, frustrating customers who explicitly asked for a human.",
      recommendedAction: 'Add an explicit rule: "If the customer requests a human agent at any point, immediately offer @transfer_call before continuing qualification."',
      affectedField: "systemPrompt",
      passed: hasEscalation || !needsHandoff,
    });
  }

  // Rule 5: unresolved variables
  {
    const varPattern = /\{\{([^}]+)\}\}/g;
    const allText = config.greeting + " " + config.systemPrompt;
    const referenced = new Set<string>();
    let match;
    while ((match = varPattern.exec(allText)) !== null) {
      referenced.add(match[1].trim());
    }
    const defined = new Map(config.variables.map((v) => [v.name, v]));
    const unresolved: string[] = [];
    for (const varName of referenced) {
      const v = defined.get(varName);
      if (!v) {
        unresolved.push(varName);
      }
    }
    results.push({
      ruleId: "UNRESOLVED_VARIABLES",
      severity: unresolved.length > 0 ? "warning" : "passed",
      title: unresolved.length > 0 ? `Unresolved variable(s): ${unresolved.join(", ")}` : "All variables resolved",
      evidence:
        unresolved.length > 0
          ? `Variables referenced but not defined: ${unresolved.map((v) => `{{${v}}}`).join(", ")}`
          : "All {{variable}} references match defined variables.",
      whyItMatters: "Unresolved variables may appear as literal {{placeholder}} text in live calls.",
      recommendedAction: `Define variables: ${unresolved.join(", ")} in the Variables panel.`,
      affectedField: "variables",
      passed: unresolved.length === 0,
    });
  }

  return results;
}
