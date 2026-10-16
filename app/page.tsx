"use client";
import { useState, useRef } from "react";
import type { AgentConfig, PreflightResult, SimulationResult } from "@/types/agent";
import { DEMO_FIXTURE } from "@/lib/demo-fixtures";
import { runPreflight } from "@/lib/preflight/engine";
import { runSimulation } from "@/lib/preflight/simulation";
import { buildExportData, downloadJSON } from "@/lib/export";
import { ConfigPanel } from "@/components/preflight/ConfigPanel";
import { ResultsPanel } from "@/components/preflight/ResultsPanel";

function cloneConfig(c: AgentConfig): AgentConfig {
  return JSON.parse(JSON.stringify(c));
}

export default function Home() {
  const [config, setConfig] = useState<AgentConfig>(cloneConfig(DEMO_FIXTURE));
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [prevPreflight, setPrevPreflight] = useState<PreflightResult | null>(null);
  const [running, setRunning] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  function resetDemo() {
    setConfig(cloneConfig(DEMO_FIXTURE));
    setPreflight(null);
    setSimulation(null);
    setPrevPreflight(null);
  }

  function runPreflightCheck() {
    setRunning(true);
    setTimeout(() => {
      const result = runPreflight(config);
      setPrevPreflight(preflight);
      setPreflight(result);
      setSimulation(null);
      setRunning(false);
    }, 800);
  }

  function runSimulationCheck() {
    const result = runSimulation(config);
    setSimulation(result);
  }

  function handleExport() {
    if (!preflight) return;
    const data = buildExportData(config, preflight, simulation);
    downloadJSON(data, `vaani-preflight-${Date.now()}.json`);
  }

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
            <a href="/case-study" className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors">
              Case Study
            </a>
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
          <div className="lg:col-span-2 space-y-4">
            <ConfigPanel
              config={config}
              setConfig={setConfig}
              toolsRef={toolsRef}
              promptRef={promptRef}
            />
          </div>

          <div className="lg:col-span-3 space-y-4">
            <ResultsPanel
              preflight={preflight}
              prevPreflight={prevPreflight}
              simulation={simulation}
              onRunSimulation={runSimulationCheck}
              toolsRef={toolsRef}
              promptRef={promptRef}
            />
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
