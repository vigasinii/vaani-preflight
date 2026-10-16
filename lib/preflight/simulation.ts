import type { AgentConfig, SimulationResult, SimulationStatus } from "@/types/agent";

export function runSimulation(config: AgentConfig): SimulationResult {
  const transfer = config.tools.find((t) => t.name === "transfer_call");
  const callback = config.tools.find((t) => t.name === "schedule_callback");
  const E164 = /^\+[1-9]\d{7,14}$/;

  const transferEnabled = transfer?.enabled ?? false;
  const transferComplete = transferEnabled && !!transfer?.destination && E164.test(transfer.destination.trim());
  const callbackEnabled = callback?.enabled ?? false;

  let status: SimulationStatus;
  let message: string;
  let agentResponse: string;

  if (transferComplete) {
    status = "ready_transfer";
    message = "Transfer path is configured. Agent can attempt a handoff.";
    agentResponse =
      "Of course! Let me connect you with one of our real estate representatives right away. Please hold for a moment.";
  } else if (callbackEnabled) {
    status = "ready_callback";
    message = "No transfer configured, but callback is available.";
    agentResponse =
      "I'd love to connect you with a real estate specialist. I can schedule a callback for you at a convenient time - would that work?";
  } else if (transferEnabled) {
    status = "incomplete";
    message = "transfer_call is enabled but destination is not configured. Transfer cannot complete.";
    agentResponse =
      "I'd like to connect you with a real estate agent, but the transfer isn't set up correctly on my end. I'm unable to complete that request right now.";
  } else {
    status = "no_tool";
    message = "No handoff tool is enabled. The agent has no path to fulfil this request.";
    agentResponse =
      "I understand you'd like to speak with a real estate agent. I'm not set up to connect you right now and I can't guarantee a follow-up. I'm sorry I can't help further with this request.";
  }

  return {
    status,
    message,
    agentResponse,
    limitations: [
      "Configuration simulation - not a live Vaani call.",
      "Actual call success depends on network, carrier, and platform runtime.",
      "This simulation evaluates configuration readiness only.",
    ],
  };
}
