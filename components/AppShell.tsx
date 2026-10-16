"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV = [
  { label: "Mission Control", href: "/", icon: "grid" },
  { label: "Agent Workspace", href: "/preflight", icon: "check-circle" },
  { label: "Fix Studio", href: "/fix", icon: "tool" },
  { label: "Scenario Lab", href: "/scenario", icon: "flask" },
  { label: "Before / After", href: "/compare", icon: "git-compare" },
  { label: "Investigation", href: "/case-study", icon: "file-text" },
  { label: "Connect", href: "/connect", icon: "zap" },
];

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const icons: Record<string, string> = {
    "grid": "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    "check-circle": "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    "flask": "M9 3H5a2 2 0 00-2 2v4m6-6h10l-4 9H9L5 9m4-6v6m0 0l-4 9m4-9h6m0 0l4 9",
    "git-compare": "M18 7h-8m0 0l3-3m-3 3l3 3M6 17h8m0 0l-3 3m3-3l-3-3",
    "file-text": "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
    "tool": "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
    "zap": "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    "menu": "M3 12h18M3 6h18M3 18h18",
    "x": "M18 6L6 18M6 6l12 12",
    "shield": "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[name] ?? ""} />
    </svg>
  );
}

export function AppShell({ children, breadcrumb, actions }: { children: React.ReactNode; breadcrumb?: React.ReactNode; actions?: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const sidebar = (
    <nav className="flex flex-col h-full py-4">
      <div className="px-4 mb-6 flex items-center gap-2.5">
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
          <Icon name="shield" size={14} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>Vaani Preflight</div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Launch Readiness</div>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 px-2 flex-1">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 10px", borderRadius: "var(--radius-md)",
                fontSize: 13, fontWeight: active ? 500 : 400,
                color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
                background: active ? "var(--color-accent-tint)" : "transparent",
                textDecoration: "none", transition: "all 150ms",
              }}
            >
              <Icon name={item.icon} size={15} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--color-border)", fontSize: 11, color: "var(--color-text-secondary)" }}>
        Independent concept · Not affiliated with Vaani
      </div>
    </nav>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <style>{`
        .appshell-sidebar { display: none; }
        .appshell-main { margin-left: 0; }
        .appshell-menu-btn { display: flex; }
        @media (min-width: 1024px) {
          .appshell-sidebar { display: flex; }
          .appshell-main { margin-left: 232px; }
          .appshell-menu-btn { display: none; }
        }
      `}</style>

      {/* Desktop sidebar */}
      <aside className="appshell-sidebar" style={{
        width: 232, flexShrink: 0, position: "fixed", top: 0, left: 0, height: "100vh",
        background: "var(--color-sidebar)", borderRight: "1px solid var(--color-border)",
        flexDirection: "column", zIndex: 20, overflowY: "auto",
      }}>
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={() => setMobileOpen(false)} />
          <aside style={{ position: "relative", width: 232, background: "var(--color-sidebar)", borderRight: "1px solid var(--color-border)", display: "flex", flexDirection: "column", zIndex: 50 }}>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="appshell-main" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <header style={{
          height: 48, borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)", display: "flex", alignItems: "center",
          padding: "0 20px", gap: 12, position: "sticky", top: 0, zIndex: 10,
        }}>
          <button
            className="appshell-menu-btn"
            onClick={() => setMobileOpen(true)}
            style={{ color: "var(--color-text-secondary)", padding: 4, background: "none", border: "none", cursor: "pointer", alignItems: "center" }}
            aria-label="Open navigation"
          >
            <Icon name="menu" size={18} />
          </button>
          <div style={{ flex: 1, fontSize: 13, color: "var(--color-text-secondary)" }}>{breadcrumb}</div>
          {actions && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{actions}</div>}
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: "24px", width: "100%", maxWidth: 1200, margin: "0 auto", boxSizing: "border-box" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
