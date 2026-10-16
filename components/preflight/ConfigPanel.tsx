"use client";
import type { AgentConfig } from "@/types/agent";
import { resolveGreeting } from "@/lib/preflight/variables";
import { RefObject } from "react";

interface ConfigPanelProps {
  config: AgentConfig;
  setConfig: (updater: (prev: AgentConfig) => AgentConfig) => void;
  toolsRef: RefObject<HTMLDivElement | null>;
  promptRef: RefObject<HTMLTextAreaElement | null>;
}

export function ConfigPanel({ config, setConfig, toolsRef, promptRef }: ConfigPanelProps) {
  function updateTool(name: string, field: "enabled" | "destination", value: boolean | string) {
    setConfig((prev) => ({
      ...prev,
      tools: prev.tools.map((t) =>
        t.name === name ? { ...t, [field]: value } : t
      ),
    }));
  }

  return (
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
  );
}
