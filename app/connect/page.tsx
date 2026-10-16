"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import type { VaaniAgent } from "@/lib/vaani/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectStatus = "idle" | "checking" | "ok" | "error";
type SessionPhase =
  | "idle"
  | "confirm"
  | "starting"
  | "connecting"
  | "live"
  | "ending"
  | "done"
  | "error";

interface WebRTCSession {
  room_name: string;
  connection_url: string;
  live_captions_url: string;
  token: string;
}

interface LiveCaption {
  id: string;
  speaker: string;
  text: string;
  is_final: boolean;
}

// ─── Small design primitives ──────────────────────────────────────────────────

function Dot({ color }: { color: "green" | "amber" | "red" | "grey" }) {
  const bg = { green: "#16815D", amber: "#B7791F", red: "#D14343", grey: "#CBD5E1" }[color];
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: bg, flexShrink: 0 }} />;
}

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

function PanelHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ padding: "11px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 1 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function Btn({ onClick, children, variant = "ghost", disabled, size = "md" }: {
  onClick?: () => void; children: React.ReactNode;
  variant?: "primary" | "ghost" | "outline" | "danger";
  disabled?: boolean; size?: "sm" | "md";
}) {
  const base: React.CSSProperties = {
    borderRadius: "var(--radius-md)", fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: 6,
    transition: "all 140ms", border: "none",
    padding: size === "sm" ? "4px 10px" : "6px 14px",
    fontSize: size === "sm" ? 12 : 13,
  };
  const v: Record<string, React.CSSProperties> = {
    primary: { background: "var(--color-accent)", color: "#fff" },
    ghost: { background: "transparent", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" },
    outline: { background: "var(--color-accent-tint)", color: "var(--color-accent)", border: "1px solid #c4b5fd" },
    danger: { background: "var(--color-danger-bg)", color: "var(--color-danger)", border: "1px solid #fca5a5" },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...v[variant] }}>{children}</button>;
}

function Tag({ children, color }: { children: React.ReactNode; color: "green" | "amber" | "blue" | "grey" }) {
  const s = {
    green: { bg: "var(--color-success-bg)", cl: "var(--color-success)", br: "#6ee7b7" },
    amber: { bg: "var(--color-warning-bg)", cl: "var(--color-warning)", br: "#fde68a" },
    blue: { bg: "#eff6ff", cl: "#2563eb", br: "#bfdbfe" },
    grey: { bg: "var(--color-bg)", cl: "var(--color-text-secondary)", br: "var(--color-border)" },
  }[color];
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: s.bg, color: s.cl, border: `1px solid ${s.br}` }}>
      {children}
    </span>
  );
}

// ─── Session timer ────────────────────────────────────────────────────────────

function useTimer(running: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) { setSecs(0); return; }
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── LiveKit room helper (dynamic import to avoid SSR issues) ─────────────────

async function buildRoom() {
  const { Room, RoomEvent, Track } = await import("livekit-client");
  return { Room, RoomEvent, Track };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ConnectPage() {
  // Auth state
  const [authStatus, setAuthStatus] = useState<ConnectStatus>("idle");
  const [authError, setAuthError] = useState("");
  const [agentCount, setAgentCount] = useState(0);

  // Agents
  const [agents, setAgents] = useState<VaaniAgent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<VaaniAgent | null>(null);

  // Session
  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [sessionError, setSessionError] = useState("");
  const [session, setSession] = useState<WebRTCSession | null>(null);

  // Audio
  const [muted, setMuted] = useState(false);
  const roomRef = useRef<InstanceType<Awaited<ReturnType<typeof buildRoom>>["Room"]> | null>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const micTrackRef = useRef<Awaited<ReturnType<typeof import("livekit-client")["createLocalAudioTrack"]>> | null>(null);

  // Captions
  const [captions, setCaptions] = useState<LiveCaption[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const captionEndRef = useRef<HTMLDivElement>(null);

  // Transcript
  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  const timer = useTimer(phase === "live");

  useEffect(() => {
    captionEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [captions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      roomRef.current?.disconnect();
    };
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────

  async function checkAuth() {
    setAuthStatus("checking");
    setAuthError("");
    try {
      const res = await fetch("/api/vaani/connect");
      const data = await res.json();
      if (!res.ok) { setAuthStatus("error"); setAuthError(data.error ?? "Auth failed"); return; }
      setAuthStatus("ok");
      setAgentCount(data.agentCount);
      loadAgents();
    } catch {
      setAuthStatus("error");
      setAuthError("Network error");
    }
  }

  async function loadAgents() {
    setAgentsLoading(true);
    try {
      const res = await fetch("/api/vaani/agents");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setAgents(data);
        if (data.length === 1) setSelectedAgent(data[0]);
      }
    } finally {
      setAgentsLoading(false);
    }
  }

  // ── Session ───────────────────────────────────────────────────────────────

  async function startSession() {
    if (!selectedAgent) return;
    setPhase("starting");
    setSessionError("");
    setCaptions([]);
    setTranscript(null);

    // 1. Get LiveKit token from our server-side proxy
    let sess: WebRTCSession;
    try {
      const res = await fetch("/api/vaani/webrtc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selectedAgent.id, primaryLanguage: "en" }),
      });
      const data = await res.json();
      if (!res.ok) { setPhase("error"); setSessionError(data.error ?? "Failed to start session"); return; }
      sess = data as WebRTCSession;
      setSession(sess);
    } catch {
      setPhase("error"); setSessionError("Network error starting session"); return;
    }

    // 2. Connect LiveKit room
    setPhase("connecting");
    try {
      const { Room, RoomEvent, Track } = await buildRoom();
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      roomRef.current = room;

      // Play remote audio tracks automatically
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const el = track.attach();
          el.autoplay = true;
          audioContainerRef.current?.appendChild(el);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach(el => el.remove());
      });

      room.on(RoomEvent.Disconnected, () => {
        setPhase("done");
      });

      await room.connect(sess.connection_url, sess.token);

      // 3. Publish microphone
      const { createLocalAudioTrack } = await import("livekit-client");
      const micTrack = await createLocalAudioTrack({ echoCancellation: true, noiseSuppression: true });
      micTrackRef.current = micTrack;
      await room.localParticipant.publishTrack(micTrack);

      setPhase("live");

      // 4. Open live captions WebSocket
      openCaptions(sess.live_captions_url);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      setPhase("error");
      setSessionError(`LiveKit: ${msg}`);
    }
  }

  const openCaptions = useCallback((url: string) => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string);
        if (msg.type === "transcript" && msg.segment) {
          const seg = msg.segment;
          setCaptions(prev => {
            const idx = prev.findIndex(c => c.id === seg.id);
            const entry: LiveCaption = { id: seg.id ?? String(Date.now()), speaker: seg.speaker ?? "?", text: seg.text ?? "", is_final: !!seg.is_final };
            if (idx >= 0) { const next = [...prev]; next[idx] = entry; return next; }
            return [...prev, entry];
          });
        }
        if (msg.type === "call_ended") endSession();
      } catch { /* ignore */ }
    };
    ws.onerror = () => setSessionError("Live captions WebSocket error.");
  }, []);

  async function endSession() {
    setPhase("ending");

    // Stop mic
    if (micTrackRef.current) {
      micTrackRef.current.stop();
      micTrackRef.current = null;
    }

    // Disconnect room
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }

    // Close captions WS
    wsRef.current?.close();
    wsRef.current = null;

    // Clean up any audio elements
    if (audioContainerRef.current) {
      audioContainerRef.current.innerHTML = "";
    }

    setPhase("done");

    // Fetch transcript after a short delay (processing time)
    if (session?.room_name) {
      setTimeout(() => fetchTranscript(session.room_name), 5000);
    }
  }

  async function fetchTranscript(roomName: string) {
    setTranscriptLoading(true);
    try {
      const res = await fetch(`/api/vaani/transcript/${encodeURIComponent(roomName)}`);
      const data = await res.json();
      if (res.ok && data.transcript && !data.transcript.includes("not found")) {
        setTranscript(data.transcript);
      } else {
        setTranscript(null);
      }
    } finally {
      setTranscriptLoading(false);
    }
  }

  async function toggleMute() {
    if (!micTrackRef.current) return;
    if (muted) {
      await micTrackRef.current.unmute();
    } else {
      await micTrackRef.current.mute();
    }
    setMuted(m => !m);
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  const authDot = { idle: "grey", checking: "amber", ok: "green", error: "red" }[authStatus] as "grey" | "amber" | "green" | "red";

  return (
    <AppShell breadcrumb="Connect · Vaani Live Integration">
      {/* Hidden audio output container */}
      <div ref={audioContainerRef} style={{ display: "none" }} aria-hidden />

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
          Live Integration · Connected Mode
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 6px" }}>
          Vaani Connect
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
          Real Vaani agents, live WebRTC sessions (mic + speaker via LiveKit), and retrieved transcripts.
          No demo data is shown here — everything comes from the Vaani API.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, alignItems: "start" }} className="connect-grid">

        {/* ── Left column ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Auth panel */}
          <Panel>
            <PanelHead title="API Authentication" sub="Server-side only — key never sent to browser" />
            <div style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Dot color={authDot} />
                <span style={{ fontSize: 13, color: "var(--color-text-primary)" }}>
                  {authStatus === "idle" && "Not verified"}
                  {authStatus === "checking" && "Verifying…"}
                  {authStatus === "ok" && `Authenticated · ${agentCount} agent${agentCount !== 1 ? "s" : ""}`}
                  {authStatus === "error" && authError}
                </span>
              </div>
              <Btn onClick={checkAuth} variant={authStatus === "ok" ? "ghost" : "primary"} disabled={authStatus === "checking"} size="sm">
                {authStatus === "checking" ? "Checking…" : authStatus === "ok" ? "Re-verify" : "Verify Connection"}
              </Btn>
            </div>
          </Panel>

          {/* Agents */}
          <Panel>
            <PanelHead
              title="Live Agents"
              sub="From GET /api/agents"
              right={authStatus === "ok" && <Btn onClick={loadAgents} variant="ghost" size="sm" disabled={agentsLoading}>{agentsLoading ? "…" : "Refresh"}</Btn>}
            />
            <div style={{ padding: 8 }}>
              {authStatus !== "ok" ? (
                <div style={{ padding: "10px 8px", fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center" }}>Verify connection first.</div>
              ) : agentsLoading ? (
                <div style={{ padding: "10px 8px", fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center" }}>Loading…</div>
              ) : agents.length === 0 ? (
                <div style={{ padding: "10px 8px", fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center" }}>No agents found.</div>
              ) : (
                agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                      padding: "8px 10px", borderRadius: "var(--radius-md)", cursor: "pointer", gap: 8, textAlign: "left",
                      background: selectedAgent?.id === agent.id ? "var(--color-accent-tint)" : "transparent",
                      border: selectedAgent?.id === agent.id ? "1px solid #c4b5fd" : "1px solid transparent",
                      marginBottom: 2, transition: "all 120ms",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {agent.display_name || agent.agent_name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 1 }}>
                        {agent.status} · {agent.published ? "Published" : "Draft"} · {agent.client_name}
                      </div>
                    </div>
                    <Dot color={agent.status === "running" ? "green" : agent.status === "stopped" ? "red" : "amber"} />
                  </button>
                ))
              )}
            </div>
          </Panel>

          {/* What this integration covers */}
          <Panel>
            <PanelHead title="Integration scope" />
            <div style={{ padding: "8px 12px" }}>
              {[
                { label: "Agent listing (live)", ok: true },
                { label: "WebRTC session token", ok: true },
                { label: "Microphone capture", ok: true },
                { label: "Agent audio playback", ok: true },
                { label: "Live captions (WebSocket)", ok: true },
                { label: "Transcript retrieval", ok: true },
                { label: "Outbound telephony", ok: false, note: "Not initiated here" },
              ].map((row, i, arr) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <Dot color={row.ok ? "green" : "grey"} />
                  <span style={{ fontSize: 12, color: "var(--color-text-primary)", flex: 1 }}>{row.label}</span>
                  {row.note && <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{row.note}</span>}
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ── Right column ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Session control */}
          <Panel>
            <PanelHead
              title="WebRTC Session"
              sub="LiveKit — mic + speaker · POST /api/trigger-call/ with medium=webrtc"
              right={phase === "live" && (
                <Tag color="green">● LIVE {timer}</Tag>
              )}
            />
            <div style={{ padding: 16 }}>

              {/* Idle — no agent selected */}
              {phase === "idle" && !selectedAgent && (
                <div style={{ padding: "20px 0", textAlign: "center", fontSize: 13, color: "var(--color-text-secondary)" }}>
                  Verify connection and select an agent to start.
                </div>
              )}

              {/* Idle — agent selected */}
              {phase === "idle" && selectedAgent && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-accent-tint)", border: "1px solid #c4b5fd" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-accent)" }}>{selectedAgent.display_name || selectedAgent.agent_name}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>ID: {selectedAgent.id}</div>
                  </div>
                  <Btn onClick={() => setPhase("confirm")} variant="primary">Start Live Session →</Btn>
                </div>
              )}

              {/* Confirm */}
              {phase === "confirm" && selectedAgent && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid #fde68a", fontSize: 13, color: "var(--color-text-primary)" }}>
                    <strong>Before starting:</strong> This initiates a real WebRTC session with your Vaani agent <strong>{selectedAgent.display_name}</strong>.
                    Your microphone will be captured. No outbound phone call is made. Usage may apply.
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={startSession} variant="primary">Confirm — Start Session</Btn>
                    <Btn onClick={() => setPhase("idle")} variant="ghost">Cancel</Btn>
                  </div>
                </div>
              )}

              {/* Starting / connecting */}
              {(phase === "starting" || phase === "connecting") && (
                <div style={{ padding: "20px 0", textAlign: "center", fontSize: 13, color: "var(--color-text-secondary)" }}>
                  {phase === "starting" ? "Requesting session token…" : "Connecting to LiveKit…"}
                </div>
              )}

              {/* Error */}
              {phase === "error" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", color: "var(--color-danger)", fontSize: 13 }}>
                    {sessionError}
                  </div>
                  <Btn onClick={() => setPhase("idle")} variant="ghost">Try Again</Btn>
                </div>
              )}

              {/* Live */}
              {phase === "live" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid #6ee7b7" }}>
                    <Dot color="green" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-success)" }}>Connected to {selectedAgent?.display_name}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Speak now — agent is listening</div>
                    </div>
                    <span style={{ fontSize: 13, fontFamily: "monospace", color: "var(--color-text-secondary)" }}>{timer}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={toggleMute} variant={muted ? "outline" : "ghost"}>
                      {muted ? "🎙 Unmute" : "🔇 Mute"}
                    </Btn>
                    <Btn onClick={endSession} variant="danger">End Session</Btn>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)", padding: "6px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                    LiveKit room: <code>{session?.room_name}</code>
                  </div>
                </div>
              )}

              {/* Ending */}
              {phase === "ending" && (
                <div style={{ padding: "20px 0", textAlign: "center", fontSize: 13, color: "var(--color-text-secondary)" }}>
                  Disconnecting…
                </div>
              )}

              {/* Done */}
              {phase === "done" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg)", border: "1px solid var(--color-border)", fontSize: 13, color: "var(--color-text-secondary)" }}>
                    Session ended. Transcript usually appears within 30 seconds.
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={() => { setPhase("idle"); setCaptions([]); setSession(null); }} variant="ghost">New Session</Btn>
                    {session && (
                      <Btn onClick={() => fetchTranscript(session.room_name)} variant="outline" disabled={transcriptLoading} size="sm">
                        {transcriptLoading ? "Fetching…" : "Fetch Transcript"}
                      </Btn>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Panel>

          {/* Live captions */}
          {(phase === "live" || phase === "done" || phase === "ending") && (
            <Panel>
              <PanelHead
                title="Live Captions"
                sub="Real-time from Vaani WebSocket · speaker labels are agent/user"
                right={<Tag color="green">LIVE DATA</Tag>}
              />
              <div style={{ padding: 12, maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
                {captions.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center", padding: "16px 0" }}>
                    Waiting for speech…
                  </div>
                ) : captions.map(cap => (
                  <div key={cap.id} style={{ display: "flex", gap: 8, opacity: cap.is_final ? 1 : 0.55 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, width: 40, flexShrink: 0, paddingTop: 2, textTransform: "uppercase",
                      color: cap.speaker === "agent" ? "var(--color-accent)" : "var(--color-warning)",
                    }}>
                      {cap.speaker}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.5 }}>{cap.text}</span>
                  </div>
                ))}
                <div ref={captionEndRef} />
              </div>
            </Panel>
          )}

          {/* Transcript */}
          {(transcript !== null || transcriptLoading) && (
            <Panel>
              <PanelHead
                title="Call Transcript"
                sub="Retrieved from GET /api/transcript/{room_name} · post-session"
                right={<Tag color="blue">LIVE DATA</Tag>}
              />
              <div style={{ padding: 16 }}>
                {transcriptLoading ? (
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Fetching transcript…</div>
                ) : transcript ? (
                  <pre style={{ fontSize: 12, lineHeight: 1.8, color: "var(--color-text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, maxHeight: 400, overflowY: "auto" }}>
                    {transcript}
                  </pre>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                    Transcript not yet available — Vaani processes it after the call ends. Click "Fetch Transcript" again in a few seconds.
                  </div>
                )}
              </div>
            </Panel>
          )}

          {/* Security note */}
          <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg)", border: "1px solid var(--color-border)", fontSize: 11, color: "var(--color-text-secondary)" }}>
            <strong>Security:</strong> The API key is stored as a Vercel Secret and accessed only in server-side route handlers.
            The LiveKit JWT token is forwarded to the browser only to establish the WebRTC connection — it is short-lived and scoped to a single room.
            No credentials are logged or stored beyond the session.
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .connect-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppShell>
  );
}
