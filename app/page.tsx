"use client";
import { useState, useRef } from "react";
import type { AgentConfig, PreflightResult, SimulationResult, Finding } from "@/types/agent";
import { DEMO_FIXTURE } from "@/lib/demo-fixtures";
import { runPreflight } from "@/lib/preflight/engine";
import { runSimulation } from "@/lib/preflight/simulation";
import { resolveGreeting } from "@/lib/preflight/variables";
import { buildExportData, downloadJSON } from "@/lib/export";

type Stage = "configure" | "results" | "simulate";

function cloneConfig(c: AgentConfig): AgentConfig {
  return JSON.parse(JSON.stringify(c));
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: "bg-red-100 text-red-700 border border-red-200",
    warning: "bg-amber-100 text-amber-700 border border-amber-200",
    passed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  };
  const labels: Record<string, string> = {
    critical: "Critical",
    warning: "Warning",
    passed: "Passed",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[severity] ?? ""}`}>
      {labels[severity] ?? severity}
    </span>
  );
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color =
    score >= 90 ? "#10b981" : score >= 70 ? "#f59e0b" : score >= 40 ? "#f97316" : "#ef4444";
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 55 55)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x="55" y="50" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0f172a">
          {score}
        </text>
        <text x="55" y="68" textAnchor="middle" fontSize="10" fill="#64748b">
          / 100
        </text>
      </svg>
      <span
        className="text-sm font-semibold"
        style={{ color }}
      >
        {label}
      </span>
      <span className="text-xs text-slate-500">Configuration Readiness</span>
    </div>
  );
}

export default function Home() {
  const [config, setConfig] = useState<AgentConfig>(cloneConfig(DEMO_FIXTURE));
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [stage, setStage] = useState<Stage>("configure");
  const [prevPreflight, setPrevPreflight] = useState<PreflightResult | null>(null);
  const [running, setRunning] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  function resetDemo() {
    setConfig(cloneConfig(DEMO_FIXTURE));
    setPreflight(null);
    setSimulation(null);
    setStage("configure");
    setPrevPreflight(null);
  }

  function runPreflightCheck() {
    setRunning(true);
    setTimeout(() => {
      const result = runPreflight(config);
      setPrevPreflight(preflight);
      setPreflight(result);
      setSimulation(null);
      setStage("results");
      setRunning(false);
    }, 800);
  }

  function runSimulationCheck() {
    const result = runSimulation(config);
    setSimulation(result);
    setStage("simulate");
  }

  function handleExport() {
    if (!preflight) return;
    const data = buildExportData(config, preflight, simulation);
    downloadJSON(data, `vaani-preflight-${Date.now()}.json`);
  }

  function updateTool(name: string, field: "enabled" | "destination", value: boolean | string) {
    setConfig((prev) => ({
      ...prev,
      tools: prev.tools.map((t) =>
        t.name === name ? { ...t, [field]: value } : t
      ),
    }));
  }

  const criticalCount = preflight?.findings.filter((f) => f.severity === "critical").length ?? 0;
  const warningCount = preflight?.findings.filter((f) => f.severity === "warning").length ?? 0;
  const passedCount = preflight?.findings.filter((f) => f.severity === "passed").length ?? 0;

  const simStatusStyles: Record<string, string> = {
    ready_transfer: "border-emerald-300 bg-emerald-50",
    ready_callback: "border-blue-300 bg-blue-50",
    incomplete: "border-amber-300 bg-amber-50",
    no_tool: "border-red-300 bg-red-50",
  };

  // suppress unused variable warning
  void stage;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm leading-tight">Vaani Preflight</div>
              <div className="text-xs text-slate-500">Agent Launch Readiness</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetDemo}
              className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              Reset Demo
            </button>
            {preflight && (
              <button
                onClick={handleExport}
                className="text-xs text-violet-700 hover:text-violet-900 border border-violet-200 bg-violet-50 rounded-lg px-3 py-1.5 transition-colors"
              >
                Export Report
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Intro Banner */}
        <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-pink-50 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Real Estate Lead Qualification Agent</h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Loaded: Observed case — Amaze Developers, Delhi NCR
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Independent product concept for Vaani AI Research
              </p>
            </div>
            <button
              onClick={runPreflightCheck}
              disabled={running}
              className="shrink-0 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-60 text-sm"
            >
              {running ? "Analyzing..." : "Run Preflight"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Config Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="text-sm font-semibold text-slate-700">Agent Configuration</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Agent Name</label>
                  <input
                    value={config.name}
                    onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value }))}
                    className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Objective</label>
                  <textarea
                    value={config.objective}
                    onChange={(e) => setConfig((c) => ({ ...c, objective: e.target.value }))}
                    rows={3}
                    className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Greeting</label>
                  <input
                    value={config.greeting}
                    onChange={(e) => setConfig((c) => ({ ...c, greeting: e.target.value }))}
                    className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                  <div className="mt-1.5 text-xs text-slate-500">
                    Preview:{" "}
                    <span className="italic text-slate-700">{resolveGreeting(config)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">System Prompt</label>
                  <textarea
                    ref={promptRef}
                    value={config.systemPrompt}
                    onChange={(e) => setConfig((c) => ({ ...c, systemPrompt: e.target.value }))}
                    rows={8}
                    className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none font-mono"
                  />
                </div>

                {/* Tools */}
                <div ref={toolsRef}>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Actions / Tools</label>
                  <div className="mt-2 space-y-2">
                    {config.tools.map((tool) => (
                      <div key={tool.name} className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-800 font-mono">{tool.name}</span>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <div
                              onClick={() => updateTool(tool.name, "enabled", !tool.enabled)}
                              className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${tool.enabled ? "bg-violet-500" : "bg-slate-300"}`}
                            >
                              <div
                                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${tool.enabled ? "translate-x-4" : ""}`}
                              />
                            </div>
                            <span className="text-xs text-slate-500">{tool.enabled ? "Enabled" : "Disabled"}</span>
                          </label>
                        </div>
                        {tool.name === "transfer_call" && tool.enabled && (
                          <input
                            value={tool.destination ?? ""}
                            onChange={(e) => updateTool("transfer_call", "destination", e.target.value)}
                            placeholder="+91xxxxxxxxxx (E.164 format)"
                            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Results Panel */}
          <div className="lg:col-span-3 space-y-4">
            {!preflight && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Run Preflight to analyze this configuration</p>
                  <p className="text-xs text-slate-400 mt-1">Validates tools, variables, prompt consistency, and handoff readiness</p>
                </div>
                <div className="text-xs text-slate-400 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mt-1 text-left max-w-sm">
                  <strong className="text-amber-700">Observed issue:</strong> During testing, the agent failed to handle &quot;Can I speak to a real estate agent?&quot; — transfer_call was disabled with no destination configured.
                </div>
              </div>
            )}

            {preflight && (
              <>
                {/* Score + summary */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <ScoreRing score={preflight.score} label={preflight.scoreLabel} />
                    <div className="flex-1 space-y-2">
                      <h2 className="text-base font-semibold text-slate-900">Preflight Report</h2>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs bg-red-50 border border-red-200 text-red-700 rounded-full px-2.5 py-0.5 font-medium">
                          {criticalCount} Critical
                        </span>
                        <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-2.5 py-0.5 font-medium">
                          {warningCount} Warning
                        </span>
                        <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-2.5 py-0.5 font-medium">
                          {passedCount} Passed
                        </span>
                      </div>
                      {preflight.blockingIssues.length > 0 && (
                        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">
                          <strong>Blocking issues:</strong>
                          <ul className="mt-1 list-disc list-inside space-y-0.5">
                            {preflight.blockingIssues.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {prevPreflight && (
                        <div className="text-xs text-slate-500">
                          Previous score:{" "}
                          <span
                            className={`font-semibold ${
                              preflight.score > prevPreflight.score ? "text-emerald-600" : preflight.score < prevPreflight.score ? "text-red-600" : "text-slate-600"
                            }`}
                          >
                            {prevPreflight.score} &rarr; {preflight.score}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Findings */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-700">Findings</h2>
                    <span className="text-xs text-slate-400">{preflight.findings.length} checks</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {preflight.findings.map((finding) => (
                      <FindingRow
                        key={finding.id}
                        finding={finding}
                        onFix={() => {
                          if (finding.affectedField === "tools" || finding.affectedField.startsWith("tools.")) {
                            toolsRef.current?.scrollIntoView({ behavior: "smooth" });
                          } else if (finding.affectedField === "systemPrompt") {
                            promptRef.current?.scrollIntoView({ behavior: "smooth" });
                            promptRef.current?.focus();
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Simulation */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-700">Handoff Simulation</h2>
                      <p className="text-xs text-slate-400">Scenario: Customer requests a human agent</p>
                    </div>
                    <button
                      onClick={runSimulationCheck}
                      className="text-xs text-violet-700 border border-violet-200 bg-violet-50 rounded-lg px-3 py-1.5 hover:bg-violet-100 transition-colors"
                    >
                      Run Simulation
                    </button>
                  </div>

                  {simulation ? (
                    <div className={`m-4 rounded-xl border p-4 ${simStatusStyles[simulation.status]}`}>
                      <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Configuration Simulation — not a live Vaani call
                      </div>
                      <div className="mb-2">
                        <span className="text-xs text-slate-500">Customer:</span>
                        <p className="text-sm text-slate-800 italic">&quot;Can I speak to a real estate agent?&quot;</p>
                      </div>
                      <div className="mb-3">
                        <span className="text-xs text-slate-500">Simulated agent response:</span>
                        <p className="text-sm text-slate-800 italic">&quot;{simulation.agentResponse}&quot;</p>
                      </div>
                      <div className="text-xs text-slate-600 mb-2 font-medium">{simulation.message}</div>
                      <ul className="text-xs text-slate-400 space-y-0.5">
                        {simulation.limitations.map((l, i) => (
                          <li key={i}>&#9888; {l}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="px-5 py-4 text-sm text-slate-400">
                      Click &quot;Run Simulation&quot; to test how the current configuration handles a human handoff request.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Why this matters */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Why this matters for Vaani</h2>
          <p className="text-sm text-slate-600 mb-3">
            A pre-deployment configuration audit could reduce avoidable setup mistakes and help nontechnical builders reach a usable first agent more confidently.
          </p>
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
          <p className="text-xs text-slate-400 mt-3">These are proposed metrics, not measured improvements.</p>
        </div>

        <footer className="text-center text-xs text-slate-400 pb-4">
          Independent product concept for Vaani AI Research &middot; Built by Vigasini
        </footer>
      </main>
    </div>
  );
}

function FindingRow({ finding, onFix }: { finding: Finding; onFix: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-5 py-3">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <SeverityBadge severity={finding.severity} />
          <span className="text-sm text-slate-800 font-medium truncate">{finding.title}</span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          className={`shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {open && (
        <div className="mt-3 pl-2 space-y-2 text-xs text-slate-600 border-l-2 border-slate-100 ml-1">
          <div>
            <strong>Evidence:</strong> {finding.evidence}
          </div>
          <div>
            <strong>Why it matters:</strong> {finding.whyItMatters}
          </div>
          <div>
            <strong>Recommended action:</strong> {finding.recommendedAction}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <code className="text-xs bg-slate-100 rounded px-1.5 py-0.5 text-slate-500">
              {finding.affectedField}
            </code>
            {finding.severity !== "passed" && (
              <button
                onClick={onFix}
                className="text-xs text-violet-700 border border-violet-200 bg-violet-50 rounded-lg px-2.5 py-1 hover:bg-violet-100 transition-colors"
              >
                Go to field &rarr;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
