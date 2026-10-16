import type { AgentConfig } from "@/types/agent";

export const DEMO_FIXTURE: AgentConfig = {
  name: "Riya — Real Estate Lead Qualifier",
  objective: "Qualify inbound real estate leads, capture budget and property preferences, and transfer to a human agent when requested or when budget is outside range.",
  systemPrompt: `You are Riya, a voice assistant for Amaze Developers in Delhi NCR.

Your role is to qualify real estate leads by asking the following questions in order:
1. Confirm the caller's name.
2. Ask about their property interest: apartment, villa, or commercial space.
3. Ask about their budget range.
4. Ask about preferred location within Delhi NCR.
5. Ask about timeline for purchase.

Properties start at ₹80 lakhs. If a customer's budget is significantly below this, note the mismatch.

After collecting all information, summarize and confirm details with the caller.

If the customer requests to speak with a human agent, complete qualification first before offering a transfer.`,
  greeting: "Hi, this is Riya from {{Company Name}}. Am I speaking with {{name}}?",
  variables: [
    { name: "Company Name", value: "Amaze Developers", isRuntime: false },
    { name: "name", value: "", isRuntime: true },
  ],
  tools: [
    {
      name: "hold_call",
      enabled: false,
      instructions: "Use @hold_call to place caller on hold.",
    },
    {
      name: "transfer_call",
      enabled: false,
      destination: "", // broken fixture: no destination configured
      instructions: "Use @transfer_call to transfer to a human agent when requested.",
    },
    {
      name: "schedule_callback",
      enabled: false,
      instructions: "Use @schedule_callback to arrange a follow-up call.",
    },
    {
      name: "agent_transfer",
      enabled: false,
      instructions: "Use @agent_transfer to route to specialized agent.",
    },
  ],
};

// NOTE: FIXED_FIXTURE uses an illustrative phone number (+910000000000).
// Replace it with a real destination number before deploying to production.
export const FIXED_FIXTURE: AgentConfig = {
  ...DEMO_FIXTURE,
  systemPrompt: `You are Riya, a voice assistant for Amaze Developers in Delhi NCR.

Your role is to qualify real estate leads. If at any point the customer explicitly requests to speak with a human agent, immediately offer a transfer or callback — do not continue qualification.

Ask in order:
1. Confirm the caller's name.
2. Property interest: apartment, villa, or commercial space.
3. Budget range.
4. Preferred location within Delhi NCR.
5. Timeline for purchase.

Properties start at ₹80 lakhs. Note budget mismatches.`,
  tools: [
    { name: "hold_call", enabled: false, instructions: "Use @hold_call to place caller on hold." },
    {
      name: "transfer_call",
      enabled: true,
      destination: "+910000000000", // illustrative — replace with real number
      instructions: "Use @transfer_call immediately when the customer requests a human agent.",
    },
    {
      name: "schedule_callback",
      enabled: true,
      instructions: "Use @schedule_callback if transfer is unavailable.",
    },
    { name: "agent_transfer", enabled: false, instructions: "Use @agent_transfer to route to specialized agent." },
  ],
};
