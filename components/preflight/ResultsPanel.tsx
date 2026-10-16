"use client";
import type { PreflightResult, SimulationResult, Finding } from "@/types/agent";
import { ScoreRing } from "./ScoreRing";
import { FindingRow } from "./FindingRow";
import { RefObject } from "react";

interface ResultsPanelProps {
  preflight: PreflightResult | null;
  prevPreflight: PreflightResult | null;
  simulation: SimulationResult | null;
  onRunSimulation: () => void;
  toolsRef: RefObject<HTMLDivElement | null>;
  promptRef: RefObject<HTMLTextAreaElement | null>;
}

const simStatusStyles: Record<string, string> = {
  ready_transfer: "border-emerald-300 bg-emerald-50",
  ready_callback: "border-blue-300 bg-blue-50",
  incomplete: "border-amber-300 bg-amber-50",
  no_tool: "border-red-300 bg-red-50",
};

export function ResultsPanel({
  preflight,
  prevPreflight,
  simulation,
  onRunSimulation,
  toolsRef,
  promptRef,
}: ResultsPanelProps) {
  const criticalCount = preflight?.findings.filter((f) => f.severity === "critical").length ?? 0;
  const warningCount = preflight?.findings.filter((f) => f.severity === "warning").length ?? 0;
  const passedCount = preflight?.findings.filter((f) => f.severity === "passed").length ?? 0;

  function handleFix(finding: Finding) {
    if (finding.affectedField === "tools" || finding.affectedField.startsWith("tools.")) {
      toolsRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (finding.affectedField === "systemPrompt") {
      promptRef.current?.scrollIntoView({ behavior: "smooth" });
      promptRef.current?.focus();
    }
  }

  if (!preflight) {
    return (
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
    );
  }

  return (
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
                    preflight.score > prevPreflight.score
                      ? "text-emerald-600"
                      : preflight.score < prevPreflight.score
                      ? "text-red-600"
                      : "text-slate-600"
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
            <FindingRow key={finding.id} finding={finding} onFix={() => handleFix(finding)} />
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
            onClick={onRunSimulation}
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
  );
}
