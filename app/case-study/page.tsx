import Image from "next/image";

const evidenceSteps = [
  {
    step: 1,
    title: "Onboarding",
    description: "Vaani invites builders to create a voice agent in 90 seconds.",
    image: "/evidence/01-onboarding.png",
    alt: "Vaani onboarding screen",
  },
  {
    step: 2,
    title: "Template selection",
    description: "Selected Real Estate Lead Qualification template.",
    image: "/evidence/02-agent-templates.png",
    alt: "Agent template selection screen",
  },
  {
    step: 3,
    title: "Persona configuration",
    description: 'Greeting referenced {{Company Name}} and {{name}}.',
    image: "/evidence/03-persona.png",
    alt: "Persona configuration screen",
  },
  {
    step: 4,
    title: "Variables",
    description: "Company Name set to Amaze Developers, Delhi NCR, starting price ₹80 lakhs.",
    image: "/evidence/04-variables.png",
    alt: "Variables configuration screen",
  },
  {
    step: 5,
    title: "Live test",
    description: "WebRTC session initiated.",
    image: "/evidence/05-live-test.png",
    alt: "Live test session screen",
  },
  {
    step: 6,
    title: "Call outcome",
    description: "Summary reported customer requested a human agent, call ended without clear next steps.",
    image: "/evidence/06-call-summary.png",
    alt: "Call summary screen",
  },
  {
    step: 7,
    title: "Actions panel",
    description: "Four system action switches observed as off.",
    image: "/evidence/07-disabled-tools.png",
    alt: "Disabled tools/actions panel",
  },
  {
    step: 8,
    title: "Transfer configuration",
    description: "@transfer_call invocation guidance, empty prompt, required phone number visible.",
    image: "/evidence/08-transfer-config.png",
    alt: "Transfer call configuration screen",
  },
  {
    step: 9,
    title: "Advanced transfer settings",
    description: "Dial tone, interruption, DTMF, spoken-summary options visible.",
    image: "/evidence/09-advanced-transfer.png",
    alt: "Advanced transfer settings screen",
  },
];

const transcript = [
  { time: "~00:56", speaker: "Customer", text: "My budget is 65 lakhs. Do you have anything?" },
  { time: "~01:04", speaker: "Agent", text: "Just to clarify, have you already finalized a property, or are you still actively looking?" },
  { time: "~01:26", speaker: "Customer", text: "Can I speak to a real estate agent" },
  { time: "~01:30", speaker: "Agent", text: "Like... a two B H K apartment, a villa, or maybe a commercial space?" },
];

const verifiedFacts = [
  "A human was explicitly requested",
  "The agent did not acknowledge that request in the transcript",
  "Vaani's summary noted no clear resolution",
  "The inspected transfer and callback tools were disabled",
  "Transfer configuration showed a required phone number field",
];

const hypotheses = [
  "Sequential qualification prompt may have deprioritized escalation",
  "Disabled tools may have prevented executable handoff",
  "No preflight check was encountered in this specific path",
  "We did NOT prove the platform has no such validation elsewhere",
  "We did NOT prove WebRTC supports live transfers in this context",
];

export default function CaseStudyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div>
            <div className="font-semibold text-slate-900 text-sm leading-tight">Evidence-led Case Study</div>
            <div className="text-xs text-slate-500">Independent product concept</div>
          </div>
          <a
            href="/"
            className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            ← Preflight Checker
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Hero */}
        <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-pink-50 p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Vaani Agent Handoff Failure</h1>
          <p className="text-sm text-slate-600">
            This case study documents a real session with a Vaani-built real estate lead qualification agent.
            The agent failed to connect a customer who explicitly requested a human representative.
            All evidence below is based on direct observation during product research.
          </p>
        </div>

        {/* Evidence Timeline */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-5">Evidence Timeline</h2>
          <div className="space-y-6">
            {evidenceSteps.map((step) => (
              <div key={step.step} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {step.step}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{step.title}</div>
                    <div className="text-xs text-slate-500">{step.description}</div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="relative w-full rounded-lg overflow-hidden border border-slate-100 bg-slate-50" style={{ minHeight: 200 }}>
                    <Image
                      src={step.image}
                      alt={step.alt}
                      width={900}
                      height={500}
                      className="w-full h-auto object-contain"
                      style={{ maxHeight: 420 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Conversation Transcript */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Conversation Transcript</h2>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 w-20">Time</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 w-24">Speaker</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Utterance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transcript.map((row, i) => (
                  <tr key={i} className={row.speaker === "Customer" ? "bg-amber-50/40" : ""}>
                    <td className="px-4 py-2.5 text-xs text-slate-400 font-mono">{row.time}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          row.speaker === "Customer"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {row.speaker}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-slate-700 italic">&quot;{row.text}&quot;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Verified vs Hypothesized */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Verified vs Hypothesized</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h3 className="text-sm font-semibold text-emerald-800 mb-3">Verified — directly observed</h3>
              <ul className="space-y-2">
                {verifiedFacts.map((fact, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                    <span className="shrink-0 mt-0.5">✓</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="text-sm font-semibold text-amber-800 mb-1">Hypotheses</h3>
              <p className="text-xs text-amber-700 mb-3 italic">Requires further testing</p>
              <ul className="space-y-2">
                {hypotheses.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                    <span className="shrink-0 mt-0.5">~</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Proposed Solution */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Proposed Solution</h2>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
            <p className="text-sm text-slate-600">
              A pre-deployment preflight check would validate agent configuration before live launch,
              surfacing issues like missing transfer destinations and unconfigured handoff tools before
              they affect real customers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Validate all enabled tools are fully configured",
                "Detect prompt/tool mismatches before launch",
                "Flag missing escalation priority language",
                "Simulate human handoff request with current config",
              ].map((item, i) => (
                <div key={i} className="text-xs text-slate-600 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2">
                  → {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Success Metrics */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Proposed Success Metrics</h2>
          <p className="text-xs text-slate-500 mb-4 italic">These are proposed metrics, not measured improvements.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "% of agents launched with unresolved critical config issues",
              "Time to first configuration-ready agent",
              "% of explicit human requests receiving an appropriate response",
              "Support tickets related to incomplete tool configuration",
            ].map((m, i) => (
              <div key={i} className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                &#128202; {m}
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-xs text-slate-500">
          Screenshots are copies of original session captures. The session identifier visible in screenshot 06 was masked for sharing.
          This prototype is independent and has no authenticated integration with Vaani.
        </div>

        <footer className="text-center text-xs text-slate-400 pb-4">
          Independent product concept for Vaani AI Research &middot; Built by Vigasini
        </footer>
      </main>
    </div>
  );
}
