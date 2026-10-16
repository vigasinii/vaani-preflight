"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_GROUPS = [
  {
    label: "Readiness",
    items: [
      { label: "Mission Control", href: "/", icon: GridIcon },
      { label: "Inspect", href: "/preflight", icon: SearchIcon },
      { label: "Fix Studio", href: "/fix", icon: WrenchIcon },
      { label: "Scenario Lab", href: "/scenario", icon: FlaskIcon },
      { label: "Before / After", href: "/compare", icon: CompareIcon },
    ],
  },
  {
    label: "Integration",
    items: [
      { label: "Connect", href: "/connect", icon: ZapIcon },
    ],
  },
  {
    label: "Research",
    items: [
      { label: "Product Strategy", href: "/product-strategy", icon: LightbulbIcon },
    ],
  },
];

/* ─── Icon set ───────────────────────────────────────────────────────────────── */
function SvgIcon({ d, size = 16 }: { d: string | string[]; size?: number }) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}
function GridIcon({ size }: { size?: number }) { return <SvgIcon size={size} d={["M3 3h7v7H3z", "M14 3h7v7h-7z", "M14 14h7v7h-7z", "M3 14h7v7H3z"]} />; }
function SearchIcon({ size }: { size?: number }) { return <SvgIcon size={size} d={["M11 19a8 8 0 100-16 8 8 0 000 16z", "M21 21l-4.35-4.35"]} />; }
function WrenchIcon({ size }: { size?: number }) { return <SvgIcon size={size} d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />; }
function FlaskIcon({ size }: { size?: number }) { return <SvgIcon size={size} d="M9 3H5a2 2 0 00-2 2v4m6-6h10l-4 9H9L5 9m4-6v6m0 0l-4 9m4-9h6m0 0l4 9" />; }
function CompareIcon({ size }: { size?: number }) { return <SvgIcon size={size} d="M18 7h-8m0 0l3-3m-3 3l3 3M6 17h8m0 0l-3 3m3-3l-3-3" />; }
function ZapIcon({ size }: { size?: number }) { return <SvgIcon size={size} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />; }
function LightbulbIcon({ size }: { size?: number }) { return <SvgIcon size={size} d={["M9 21h6", "M12 3a6 6 0 016 6c0 2.22-1.2 4.16-3 5.2V17H9v-2.8A6 6 0 0112 3z"]} />; }
function MenuIcon({ size }: { size?: number }) { return <SvgIcon size={size} d="M3 12h18M3 6h18M3 18h18" />; }
function XIcon({ size }: { size?: number }) { return <SvgIcon size={size} d="M18 6L6 18M6 6l12 12" />; }
function ShieldIcon({ size }: { size?: number }) { return <SvgIcon size={size} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />; }

/* ─── Shell ──────────────────────────────────────────────────────────────────── */
export function AppShell({
  children,
  breadcrumb,
  actions,
}: {
  children: React.ReactNode;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const sidebar = (
    <nav
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--color-sidebar)",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid var(--color-sidebar-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "linear-gradient(135deg, #4A64FF 0%, #7B5EFB 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", flexShrink: 0,
            boxShadow: "0 2px 8px rgba(74,100,255,0.35)",
          }}>
            <ShieldIcon size={14} />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}>
              Vaani Preflight
            </div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.38)", fontWeight: 500, letterSpacing: "0.02em" }}>
              Launch Readiness
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? 20 : 0 }}>
            <div style={{
              fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)", padding: "0 8px", marginBottom: 4,
            }}>
              {group.label}
            </div>
            {group.items.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "7px 8px",
                    borderRadius: "var(--radius-md)",
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active
                      ? "var(--color-sidebar-text-active)"
                      : "var(--color-sidebar-text)",
                    background: active ? "var(--color-sidebar-active)" : "transparent",
                    textDecoration: "none",
                    transition: "all 140ms ease",
                    marginBottom: 1,
                    borderLeft: active ? "2px solid rgba(74,100,255,0.7)" : "2px solid transparent",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.background = "var(--color-sidebar-hover)";
                      (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-sidebar-text-hover)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                      (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-sidebar-text)";
                    }
                  }}
                >
                  <span style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }}>
                    <Icon size={14} />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid var(--color-sidebar-border)",
        fontSize: 10.5,
        color: "rgba(255,255,255,0.22)",
        lineHeight: 1.6,
        fontWeight: 500,
      }}>
        Independent concept · Not affiliated with Vaani
      </div>
    </nav>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <style>{`
        .shell-sidebar { display: none; }
        .shell-main { margin-left: 0; }
        .shell-menu-btn { display: flex; }
        @media (min-width: 1024px) {
          .shell-sidebar { display: flex; }
          .shell-main { margin-left: 224px; }
          .shell-menu-btn { display: none; }
        }
      `}</style>

      {/* Desktop sidebar */}
      <aside
        className="shell-sidebar"
        style={{
          width: 224, flexShrink: 0,
          position: "fixed", top: 0, left: 0, height: "100vh",
          flexDirection: "column", zIndex: 20, overflowY: "auto",
        }}
      >
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex" }}>
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
            onClick={() => setMobileOpen(false)}
          />
          <aside style={{ position: "relative", width: 224, flexDirection: "column", display: "flex", zIndex: 50 }}>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="shell-main" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          height: 48,
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 10,
          boxShadow: "var(--shadow-xs)",
        }}>
          <button
            className="shell-menu-btn"
            onClick={() => setMobileOpen(true)}
            style={{
              color: "var(--color-text-secondary)",
              padding: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              borderRadius: "var(--radius-sm)",
              alignItems: "center",
            }}
            aria-label="Open navigation"
          >
            {mobileOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
          </button>
          <div style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--color-text-secondary)",
          }}>
            {breadcrumb}
          </div>
          {actions && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {actions}
            </div>
          )}
        </header>

        {/* Page content */}
        <main style={{
          flex: 1,
          padding: "28px 28px",
          width: "100%",
          maxWidth: 1120,
          margin: "0 auto",
          boxSizing: "border-box",
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
