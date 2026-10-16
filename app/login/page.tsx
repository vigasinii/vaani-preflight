"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
      } else {
        router.push("/connect");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--color-bg)", padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, borderRadius: "var(--radius-md)",
            background: "var(--color-accent-tint)", border: "1px solid #c4b5fd",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 6px" }}>
            Owner Access
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
            Enter your owner secret to connect live Vaani agents.
          </p>
        </div>

        <div style={{
          background: "var(--color-surface)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)", padding: 24,
        }}>
          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Owner Secret
            </label>
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="Enter your OWNER_SECRET"
              autoComplete="current-password"
              style={{
                width: "100%", padding: "9px 12px", fontSize: 13,
                borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
                background: "var(--color-bg)", color: "var(--color-text-primary)",
                outline: "none", boxSizing: "border-box", marginBottom: 12,
              }}
            />
            {error && (
              <div style={{
                fontSize: 12, color: "var(--color-danger)", padding: "8px 10px",
                borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)",
                border: "1px solid #fca5a5", marginBottom: 12,
              }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !secret}
              style={{
                width: "100%", padding: "9px 16px", fontSize: 13, fontWeight: 600,
                background: "var(--color-accent)", color: "#fff", border: "none",
                borderRadius: "var(--radius-md)", cursor: loading || !secret ? "not-allowed" : "pointer",
                opacity: loading || !secret ? 0.6 : 1,
              }}
            >
              {loading ? "Verifying…" : "Sign in"}
            </button>
          </form>
        </div>

        <p style={{ fontSize: 11, color: "var(--color-text-secondary)", textAlign: "center", marginTop: 20 }}>
          This is a private owner-only interface. The public demo is available without login.{" "}
          <a href="/" style={{ color: "var(--color-accent)", textDecoration: "none" }}>Back to app →</a>
        </p>
      </div>
    </div>
  );
}
