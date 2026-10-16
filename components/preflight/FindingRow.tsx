"use client";
import { useState } from "react";
import type { Finding } from "@/types/agent";
import { SeverityBadge } from "./SeverityBadge";

export function FindingRow({ finding, onFix }: { finding: Finding; onFix: () => void }) {
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
