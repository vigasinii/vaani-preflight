"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { loadConfig, saveConfig, resetConfig } from "@/lib/store";
import type { AgentConfig } from "@/types/agent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function TextDisplay({ value, mono }: { value: string; mono?: boolean }) {
  return (
    <div style={{
      fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.6,
      fontFamily: mono ? "var(--font-mono, monospace)" : "inherit",
      background: "var(--color-surface)", border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-md)", padding: "10px 14px", whiteSpace: "pre-wrap", wordBreak: "break-word",
    }}>
      {value || <span style={{ color: "var(--color-text-secondary)", fontStyle: "italic" }}>Not set</span>}
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100,
      background: ok ? "var(--color-success-bg)" : "var(--color-danger-bg)",
      color: ok ? "var(--color-success)" : "var(--color-danger)",
      border: `1px solid ${ok ? "#6ee7b7" : "#fca5a5"}`,
    }}>{label}</span>
  );
}

export default function InspectPage() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig(loadConfig());
  }, []);

  function handleReset() {
    const fresh = resetConfig();
    setConfig(fresh);
  }

  function handleSave() {
    if (!config) return;
    saveConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!config) return (
    <AppShell breadcrumb="Inspect">
      <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Loading configuration...</div>
    </AppShell>
  );

  return (
    <AppShell
      breadcrumb="Inspect"
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleReset}
            style={{ padding: "5px 14px", borderRadius: "var(--radius-md)", fontSize: 12, fontWeight: 500, background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", cursor: "pointer" }}
          >
            Reset to demo
          </button>
          <button
            onClick={handleSave}
            style={{ padding: "5px 14px", borderRadius: "var(--radius-md)", fontSize: 12, fontWeight: 600, background: "var(--color-accent)", color: "#fff", border: "none", cursor: "pointer" }}
          >
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      }
    >
      <div style={{ maxWidth: 800 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 6px" }}>Agent Configuration</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
            The local configuration used for preflight checks. Changes stay in your browser.
          </p>
        </div>

        {/* Identity */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px 24px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Identity</div>
          <Field label="Agent Name">
            <TextDisplay value={config.name} />
          </Field>
          <Field label="Objective">
            <TextDisplay value={config.objective} />
          </Field>
          <Field label="Greeting">
            <TextDisplay value={config.greeting} />
          </Field>
        </div>

        {/* System prompt */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px 24px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>System Prompt</div>
          <TextDisplay value={config.systemPrompt} mono />
        </div>

        {/* Variables */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px 24px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Variables ({config.variables.length})</div>
          {config.variables.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", fontStyle: "italic" }}>No variables defined</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {config.variables.map((v, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 12, alignItems: "center", padding: "10px 14px", background: "var(--color-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace", color: "var(--color-accent)" }}>
                    {"{{"}{v.name}{"}}"}
                  </div>
                  <div style={{ fontSize: 13, color: v.value ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontStyle: v.value ? "normal" : "italic" }}>
                    {v.value || "not set"}
                  </div>
                  <StatusBadge ok={v.isRuntime || !!v.value} label={v.isRuntime ? "Runtime" : v.value ? "Set" : "Missing"} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tools */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px 24px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
            Tools ({config.tools.filter(t => t.enabled).length} of {config.tools.length} enabled)
          </div>
          {config.tools.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", fontStyle: "italic" }}>No tools configured</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {config.tools.map((t, i) => (
                <div key={i} style={{ padding: "12px 14px", background: "var(--color-bg)", borderRadius: "var(--radius-md)", border: `1px solid ${t.enabled ? "var(--color-border)" : "var(--color-border)"}`, opacity: t.enabled ? 1 : 0.55 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: t.destination || t.instructions ? 8 : 0 }}>
                    <code style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 4, padding: "1px 6px" }}>{t.name}</code>
                    <StatusBadge ok={t.enabled} label={t.enabled ? "Enabled" : "Disabled"} />
                  </div>
                  {t.enabled && (
                    <>
                      {t.destination !== undefined && (
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
                          <span style={{ fontWeight: 600 }}>Destination: </span>
                          {t.destination ? (
                            <span style={{ color: "var(--color-text-primary)" }}>{t.destination}</span>
                          ) : (
                            <span style={{ color: "var(--color-danger)", fontWeight: 500 }}>Not configured</span>
                          )}
                        </div>
                      )}
                      {t.instructions && (
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
                          <span style={{ fontWeight: 600 }}>Instructions: </span>
                          <span style={{ color: "var(--color-text-primary)" }}>{t.instructions}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
