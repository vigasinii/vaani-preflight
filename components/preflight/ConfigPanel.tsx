"use client";
import { useState } from "react";
import type { AgentConfig } from "@/types/agent";
import { resolveGreeting } from "@/lib/preflight/variables";
import { RefObject } from "react";

interface ConfigPanelProps {
  config: AgentConfig;
  setConfig: (updater: (prev: AgentConfig) => AgentConfig) => void;
  toolsRef: RefObject<HTMLDivElement | null>;
  promptRef: RefObject<HTMLTextAreaElement | null>;
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid var(--color-border)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px", background: "none", border: "none", cursor: "pointer",
          fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)",
          textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left",
        }}
      >
        {title}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 150ms" }}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div style={{ padding: "0 16px 16px" }}>{children}</div>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)",
  padding: "7px 10px", fontSize: 13, color: "var(--color-text-primary)", background: "var(--color-surface)",
  outline: "none", transition: "border-color 150ms", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)",
  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6,
};

export function ConfigPanel({ config, setConfig, toolsRef, promptRef }: ConfigPanelProps) {
  function updateTool(name: string, field: "enabled" | "destination", value: boolean | string) {
    setConfig((prev) => ({
      ...prev,
      tools: prev.tools.map((t) => t.name === name ? { ...t, [field]: value } : t),
    }));
  }

  return (
    <div style={{
      background: "var(--color-surface)", border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)", overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 16px", borderBottom: "1px solid var(--color-border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>Agent Configuration</span>
        <span style={{ fontSize: 11, color: "var(--color-text-secondary)", padding: "2px 8px", background: "var(--color-bg)", borderRadius: 100, border: "1px solid var(--color-border)" }}>Illustrative fixture</span>
      </div>

      <Section title="Identity">
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Agent Name</label>
          <input style={inputStyle} value={config.name} onChange={e => setConfig(c => ({ ...c, name: e.target.value }))} />
        </div>
        <div>
          <label style={labelStyle}>Objective</label>
          <textarea style={{ ...inputStyle, resize: "none", fontFamily: "inherit" }} rows={3}
            value={config.objective} onChange={e => setConfig(c => ({ ...c, objective: e.target.value }))} />
        </div>
      </Section>

      <Section title="Greeting & Variables">
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Greeting</label>
          <input style={inputStyle} value={config.greeting} onChange={e => setConfig(c => ({ ...c, greeting: e.target.value }))} />
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--color-text-secondary)" }}>
            Preview: <em style={{ color: "var(--color-text-primary)" }}>{resolveGreeting(config)}</em>
          </div>
        </div>
      </Section>

      <Section title="System Prompt">
        <textarea
          ref={promptRef}
          style={{ ...inputStyle, resize: "none", fontFamily: "'Fira Code', 'Consolas', monospace", fontSize: 12, lineHeight: 1.6 }}
          rows={10}
          value={config.systemPrompt}
          onChange={e => setConfig(c => ({ ...c, systemPrompt: e.target.value }))}
        />
      </Section>

      <Section title="Actions / Tools">
        <div ref={toolsRef} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {config.tools.map(tool => (
            <div key={tool.name} style={{
              border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
              padding: "10px 12px", background: "var(--color-bg)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <code style={{ fontSize: 12, fontFamily: "monospace", color: "var(--color-text-primary)", fontWeight: 500 }}>
                  {tool.name}
                </code>
                <div
                  onClick={() => updateTool(tool.name, "enabled", !tool.enabled)}
                  role="switch" aria-checked={tool.enabled} tabIndex={0}
                  onKeyDown={e => (e.key === "Enter" || e.key === " ") ? updateTool(tool.name, "enabled", !tool.enabled) : undefined}
                  style={{
                    width: 36, height: 20, borderRadius: 999, cursor: "pointer",
                    background: tool.enabled ? "var(--color-accent)" : "var(--color-border)",
                    position: "relative", transition: "background 150ms", flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: "absolute", top: 2, left: tool.enabled ? 18 : 2, width: 16, height: 16,
                    borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transition: "left 150ms",
                  }} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: tool.enabled ? "var(--color-success)" : "var(--color-text-secondary)", marginTop: 4 }}>
                {tool.enabled ? "Enabled" : "Disabled"}
              </div>
              {tool.name === "transfer_call" && tool.enabled && (
                <input
                  style={{ ...inputStyle, marginTop: 8, fontSize: 12 }}
                  value={tool.destination ?? ""}
                  onChange={e => updateTool("transfer_call", "destination", e.target.value)}
                  placeholder="+91xxxxxxxxxx (E.164 format)"
                />
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
