"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import type { VaaniAgent } from "@/lib/vaani/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionPhase =
  | "idle" | "confirm" | "starting" | "connecting" | "live"
  | "mic_denied" | "ending" | "done" | "error";

interface WebRTCSession {
  room_name: string;
  connection_url: string;
  live_captions_url: string;
  token: string;
  agent_name?: string;
}

interface LiveCaption { id: string; speaker: string; text: string; is_final: boolean }

type TranscriptState =
  | { status: "idle" }
  | { status: "fetching" }
  | { status: "available"; text: string }
  | { status: "unavailable"; reason: string }
  | { status: "error"; message: string };

// ─── UI primitives ────────────────────────────────────────────────────────────

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
    border: "none", padding: size === "sm" ? "4px 10px" : "6px 14px", fontSize: size === "sm" ? 12 : 13,
  };
  const v: Record<string, React.CSSProperties> = {
    primary: { background: "var(--color-accent)", color: "#fff" },
    ghost: { background: "transparent", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" },
    outline: { background: "var(--color-accent-tint)", color: "var(--color-accent)", border: "1px solid #c4b5fd" },
    danger: { background: "var(--color-danger-bg)", color: "var(--color-danger)", border: "1px solid #fca5a5" },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...v[variant] }}>{children}</button>;
}

function Tag({ children, color }: { children: React.ReactNode; color: "green" | "amber" | "blue" | "grey" | "purple" }) {
  const s = {
    green: { bg: "var(--color-success-bg)", cl: "var(--color-success)", br: "#6ee7b7" },
    amber: { bg: "var(--color-warning-bg)", cl: "var(--color-warning)", br: "#fde68a" },
    blue: { bg: "#eff6ff", cl: "#2563eb", br: "#bfdbfe" },
    grey: { bg: "var(--color-bg)", cl: "var(--color-text-secondary)", br: "var(--color-border)" },
    purple: { bg: "var(--color-accent-tint)", cl: "var(--color-accent)", br: "#c4b5fd" },
  }[color];
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: s.bg, color: s.cl, border: `1px solid ${s.br}` }}>
      {children}
    </span>
  );
}

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

async function buildRoom() {
  const { Room, RoomEvent, Track } = await import("livekit-client");
  return { Room, RoomEvent, Track };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ConnectPage() {
  const [agentVerified, setAgentVerified] = useState(false);
  const [agentCount, setAgentCount] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const [agents, setAgents] = useState<VaaniAgent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<VaaniAgent | null>(null);

  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [sessionError, setSessionError] = useState("");
  const [session, setSession] = useState<WebRTCSession | null>(null);
  const [muted, setMuted] = useState(false);

  const [captions, setCaptions] = useState<LiveCaption[]>([]);
  const [transcript, setTranscript] = useState<TranscriptState>({ status: "idle" });

  const roomRef = useRef<InstanceType<Awaited<ReturnType<typeof buildRoom>>["Room"]> | null>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const micTrackRef = useRef<Awaited<ReturnType<typeof import("livekit-client")["createLocalAudioTrack"]>> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const captionEndRef = useRef<HTMLDivElement>(null);
  const timer = useTimer(phase === "live");

  useEffect(() => { captionEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [captions]);

  useEffect(() => {
    return () => { wsRef.current?.close(); roomRef.current?.disconnect(); };
  }, []);

  async function verifyConnection() {
    setVerifying(true); setVerifyError("");
    try {
      const res = await fetch("/api/vaani/connect");
      const data = await res.json();
      if (!res.ok) { setVerifyError(data.error ?? "Verification failed."); return; }
      setAgentVerified(true); setAgentCount(data.agentCount);
      loadAgents();
    } catch { setVerifyError("Network error."); }
    finally { setVerifying(false); }
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
    } finally { setAgentsLoading(false); }
  }

  async function startSession() {
    if (!selectedAgent) return;
    setPhase("starting"); setSessionError(""); setCaptions([]); setTranscript({ status: "idle" });

    let sess: WebRTCSession;
    try {
      const res = await fetch("/api/vaani/webrtc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selectedAgent.id, primaryLanguage: "en" }),
      });
      const data = await res.json();
      if (!res.ok) { setPhase("error"); setSessionError(data.error ?? "Failed to start session."); return; }
      sess = data as WebRTCSession;
      setSession(sess);
    } catch { setPhase("error"); setSessionError("Network error starting session."); return; }

    setPhase("connecting");
    try {
      const { Room, RoomEvent, Track } = await buildRoom();
      const room = new Room({
        adaptiveStream: true, dynacast: true,
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const el = track.attach(); el.autoplay = true;
          audioContainerRef.current?.appendChild(el);
        }
      });
      room.on(RoomEvent.TrackUnsubscribed, (track) => { track.detach().forEach(el => el.remove()); });
      room.on(RoomEvent.Disconnected, () => setPhase("done"));

      await room.connect(sess.connection_url, sess.token);

      const { createLocalAudioTrack } = await import("livekit-client");
      let micTrack;
      try {
        micTrack = await createLocalAudioTrack({ echoCancellation: true, noiseSuppression: true });
      } catch (micErr) {
        const msg = micErr instanceof Error ? micErr.message : "";
        if (msg.includes("NotAllowed") || msg.includes("Permission")) {
          await room.disconnect(); setPhase("mic_denied"); return;
        }
        throw micErr;
      }
      micTrackRef.current = micTrack;
      await room.localParticipant.publishTrack(micTrack);
      setPhase("live");
      openCaptions(sess.live_captions_url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed.";
      setPhase("error"); setSessionError(`LiveKit: ${msg}`);
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
            const entry: LiveCaption = { id: seg.id ?? String(Date.now()), speaker: seg.speaker ?? "?", text: seg.text ?? "", is_final: !!seg.is_final };
            const idx = prev.findIndex(c => c.id === entry.id);
            if (idx >= 0) { const next = [...prev]; next[idx] = entry; return next; }
            return [...prev, entry];
          });
        }
        if (msg.type === "call_ended") endSession();
      } catch { /* ignore */ }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function endSession() {
    setPhase("ending");
    if (micTrackRef.current) { micTrackRef.current.stop(); micTrackRef.current = null; }
    if (roomRef.current) { await roomRef.current.disconnect(); roomRef.current = null; }
    wsRef.current?.close(); wsRef.current = null;
    if (audioContainerRef.current) audioContainerRef.current.innerHTML = "";
    setPhase("done");
    if (session?.room_name) setTimeout(() => fetchTranscript(session.room_name), 8000);
  }

  async function fetchTranscript(roomName: string) {
    setTranscript({ status: "fetching" });
    try {
      const res = await fetch(`/api/vaani/transcript/${encodeURIComponent(roomName)}`);
      const data = await res.json();
      if (!res.ok) { setTranscript({ status: "error", message: data.error ?? "Error fetching transcript." }); return; }
      if (data.available === false) { setTranscript({ status: "unavailable", reason: data.reason ?? "Transcript not yet available. Check again in 30–60 seconds." }); return; }
      if (data.transcript) { setTranscript({ status: "available", text: data.transcript }); return; }
      setTranscript({ status: "unavailable", reason: "Transcript not yet available." });
    } catch { setTranscript({ status: "error", message: "Network error fetching transcript." }); }
  }

  async function toggleMute() {
    if (!micTrackRef.current) return;
    if (muted) await micTrackRef.current.unmute();
    else await micTrackRef.current.mute();
    setMuted(m => !m);
  }

  return (
    <AppShell breadcrumb="Connect · Vaani Integration">
      <div ref={audioContainerRef} style={{ display: "none" }} aria-hidden />

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
          Live Integration
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 4px" }}>Connect</h1>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
          Real Vaani agents · WebRTC audio via LiveKit · Live captions and transcript retrieval.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, alignItems: "start" }} className="connect-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Panel>
            <PanelHead title="Vaani Account" sub="Server-side key · never exposed to browser" />
            <div style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Dot color={agentVerified ? "green" : verifyError ? "red" : "grey"} />
                <span style={{ fontSize: 13, color: "var(--color-text-primary)" }}>
                  {agentVerified ? `Verified · ${agentCount} agent${agentCount !== 1 ? "s" : ""}` : verifyError || "Not verified"}
                </span>
              </div>
              <Btn onClick={verifyConnection} variant={agentVerified ? "ghost" : "primary"} disabled={verifying} size="sm">
                {verifying ? "Verifying…" : agentVerified ? "Re-verify" : "Verify Connection"}
              </Btn>
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Agents" sub="GET /api/agents" right={agentVerified && <Btn onClick={loadAgents} variant="ghost" size="sm" disabled={agentsLoading}>{agentsLoading ? "…" : "↻"}</Btn>} />
            <div style={{ padding: 8 }}>
              {!agentVerified ? (
                <div style={{ padding: "10px 8px", fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center" }}>Verify connection first.</div>
              ) : agentsLoading ? (
                <div style={{ padding: "10px 8px", fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center" }}>Loading…</div>
              ) : agents.length === 0 ? (
                <div style={{ padding: "10px 8px", fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center" }}>No agents found.</div>
              ) : agents.map(agent => (
                <button key={agent.id} onClick={() => setSelectedAgent(agent)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                  padding: "8px 10px", borderRadius: "var(--radius-md)", cursor: "pointer", gap: 8,
                  textAlign: "left", marginBottom: 2,
                  background: selectedAgent?.id === agent.id ? "var(--color-accent-tint)" : "transparent",
                  border: selectedAgent?.id === agent.id ? "1px solid #c4b5fd" : "1px solid transparent",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {agent.display_name || agent.agent_name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 1 }}>{agent.status} · {agent.published ? "Published" : "Draft"}</div>
                  </div>
                  <Dot color={agent.status === "running" ? "green" : agent.status === "stopped" ? "red" : "amber"} />
                </button>
              ))}
            </div>
          </Panel>

          <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg)", border: "1px solid var(--color-border)", fontSize: 11, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            <strong>Security:</strong> API key is a Vercel Secret accessed only in server-side handlers.
            The LiveKit JWT forwarded to the browser is short-lived and room-scoped.
            No credentials are logged or persisted beyond the session.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Panel>
            <PanelHead
              title="WebRTC Session"
              sub="LiveKit · mic + speaker · POST /api/trigger-call/ with medium=webrtc"
              right={phase === "live" ? <Tag color="green">● LIVE {timer}</Tag> : undefined}
            />
            <div style={{ padding: 16 }}>
              {phase === "idle" && !selectedAgent && (
                <div style={{ padding: "20px 0", textAlign: "center", fontSize: 13, color: "var(--color-text-secondary)" }}>
                  Verify your connection and select an agent to begin.
                </div>
              )}
              {phase === "idle" && selectedAgent && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-accent-tint)", border: "1px solid #c4b5fd" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-accent)" }}>{selectedAgent.display_name || selectedAgent.agent_name}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>ID: {selectedAgent.id}</div>
                  </div>
                  <Btn onClick={() => setPhase("confirm")} variant="primary">Start Live Session →</Btn>
                </div>
              )}
              {phase === "confirm" && selectedAgent && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid #fde68a", fontSize: 13, color: "var(--color-text-primary)" }}>
                    <strong>Before starting:</strong> This initiates a real WebRTC session with <strong>{selectedAgent.display_name}</strong>.
                    Your microphone will be captured. No outbound phone call is placed. Credit usage may apply.
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={startSession} variant="primary">Confirm · Start Session</Btn>
                    <Btn onClick={() => setPhase("idle")} variant="ghost">Cancel</Btn>
                  </div>
                </div>
              )}
              {(phase === "starting" || phase === "connecting") && (
                <div style={{ padding: "20px 0", textAlign: "center", fontSize: 13, color: "var(--color-text-secondary)" }}>
                  {phase === "starting" ? "Requesting session token from Vaani…" : "Connecting to LiveKit room…"}
                </div>
              )}
              {phase === "mic_denied" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid #fde68a", fontSize: 13 }}>
                    <strong>Microphone access denied.</strong> Allow microphone access in your browser settings, then try again.
                  </div>
                  <Btn onClick={() => setPhase("idle")} variant="ghost">Try Again</Btn>
                </div>
              )}
              {phase === "error" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", color: "var(--color-danger)", fontSize: 13 }}>
                    {sessionError}
                  </div>
                  <Btn onClick={() => setPhase("idle")} variant="ghost">Try Again</Btn>
                </div>
              )}
              {phase === "live" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid #6ee7b7" }}>
                    <Dot color="green" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-success)" }}>Connected · {session?.agent_name || selectedAgent?.display_name}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Speak now - agent is listening</div>
                    </div>
                    <span style={{ fontSize: 13, fontFamily: "monospace", color: "var(--color-text-secondary)" }}>{timer}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={toggleMute} variant={muted ? "outline" : "ghost"}>{muted ? "🎙 Unmute" : "🔇 Mute"}</Btn>
                    <Btn onClick={endSession} variant="danger">End Session</Btn>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)", padding: "5px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                    Room: <code style={{ fontFamily: "monospace" }}>{session?.room_name}</code>
                  </div>
                </div>
              )}
              {phase === "ending" && (
                <div style={{ padding: "20px 0", textAlign: "center", fontSize: 13, color: "var(--color-text-secondary)" }}>Disconnecting…</div>
              )}
              {phase === "done" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg)", border: "1px solid var(--color-border)", fontSize: 13, color: "var(--color-text-secondary)" }}>
                    Session ended. Fetching transcript - processing typically takes 30–60 seconds.
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={() => { setPhase("idle"); setCaptions([]); setSession(null); setTranscript({ status: "idle" }); }} variant="ghost">New Session</Btn>
                    {session && <Btn onClick={() => fetchTranscript(session.room_name)} variant="outline" size="sm" disabled={transcript.status === "fetching"}>Fetch Transcript Now</Btn>}
                  </div>
                </div>
              )}
            </div>
          </Panel>

          {(phase === "live" || phase === "done" || phase === "ending") && captions.length > 0 && (
            <Panel>
              <PanelHead title="Live Captions" sub="Real-time from Vaani WebSocket" right={<Tag color="green">LIVE DATA</Tag>} />
              <div style={{ padding: 12, maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                {captions.map(cap => (
                  <div key={cap.id} style={{ display: "flex", gap: 8, opacity: cap.is_final ? 1 : 0.55 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, width: 38, flexShrink: 0, paddingTop: 2, textTransform: "uppercase", color: cap.speaker === "agent" ? "var(--color-accent)" : "var(--color-warning)" }}>{cap.speaker}</span>
                    <span style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.5 }}>{cap.text}</span>
                  </div>
                ))}
                <div ref={captionEndRef} />
              </div>
            </Panel>
          )}

          {transcript.status !== "idle" && (
            <Panel>
              <PanelHead
                title="Session Transcript"
                sub="GET /api/transcript/{room_name} · retrieved after call ends"
                right={transcript.status === "available" ? <Tag color="blue">LIVE DATA</Tag> : undefined}
              />
              <div style={{ padding: 16 }}>
                {transcript.status === "fetching" && <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Fetching from Vaani…</div>}
                {transcript.status === "available" && (
                  <pre style={{ fontSize: 12, lineHeight: 1.8, color: "var(--color-text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, maxHeight: 360, overflowY: "auto" }}>
                    {transcript.text}
                  </pre>
                )}
                {transcript.status === "unavailable" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{transcript.reason}</div>
                    {session && <Btn onClick={() => fetchTranscript(session.room_name)} variant="outline" size="sm">Try Again</Btn>}
                  </div>
                )}
                {transcript.status === "error" && <div style={{ fontSize: 13, color: "var(--color-danger)" }}>{transcript.message}</div>}
              </div>
            </Panel>
          )}
        </div>
      </div>

      <style>{`@media (max-width: 860px) { .connect-grid { grid-template-columns: 1fr !important; } }`}</style>
    </AppShell>
  );
}
