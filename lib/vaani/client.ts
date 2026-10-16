import type {
  VaaniAgent,
  VaaniAgentsListResponse,
  WebRTCSessionResponse,
  TranscriptResponse,
  VaaniAPIResponse,
} from "./types";

const BASE_URL = "https://api.vaanivoice.ai";
const TIMEOUT_MS = 15000;

class VaaniClientError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "VaaniClientError";
  }
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<VaaniAPIResponse<T>> {
  const apiKey = process.env.VAANI_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 500, message: "VAANI_API_KEY is not configured on this server." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (res.status === 401) {
      return { ok: false, status: 401, message: "Authentication failed. Check your API key." };
    }
    if (res.status === 403) {
      return { ok: false, status: 403, message: "Access denied for this resource." };
    }
    if (res.status === 404) {
      return { ok: false, status: 404, message: "Resource not found." };
    }
    if (res.status === 429) {
      return { ok: false, status: 429, message: "Rate limit exceeded. Please wait before retrying." };
    }
    if (res.status >= 500) {
      return { ok: false, status: res.status, message: "Vaani API is temporarily unavailable." };
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, status: res.status, message: body || `HTTP ${res.status}` };
    }

    const data = await res.json() as T;
    return { ok: true, data };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, status: 408, message: "Request timed out after 15s." };
    }
    return { ok: false, status: 0, message: "Network error — could not reach Vaani API." };
  }
}

export async function listAgents(): Promise<VaaniAPIResponse<VaaniAgent[]>> {
  const result = await request<VaaniAgentsListResponse | VaaniAgent[]>("/api/agents");
  if (!result.ok) return result;
  const data = Array.isArray(result.data) ? result.data : result.data.data;
  return { ok: true, data };
}

export async function startWebRTCSession(
  agentId: string,
  opts?: {
    primaryLanguage?: string;
    welcomeMessage?: string;
    voiceGender?: "male" | "female";
    voiceSpeed?: number;
  }
): Promise<VaaniAPIResponse<WebRTCSessionResponse>> {
  return request<WebRTCSessionResponse>("/api/trigger-call/", {
    method: "POST",
    body: JSON.stringify({
      agent_id: agentId,
      medium: "webrtc",
      primary_language: opts?.primaryLanguage ?? "en",
      secondary_language: "en",
      welcome_message: opts?.welcomeMessage,
      voice_gender: opts?.voiceGender ?? "female",
      voice_speed: opts?.voiceSpeed ?? 1.0,
    }),
  });
}

export async function getTranscript(
  callId: string
): Promise<VaaniAPIResponse<TranscriptResponse>> {
  return request<TranscriptResponse>(`/api/transcript/${callId}`);
}

export async function getCallHistory(): Promise<VaaniAPIResponse<unknown[]>> {
  return request<unknown[]>("/api/call-history");
}

export async function checkAuth(): Promise<VaaniAPIResponse<{ authenticated: boolean; agentCount: number }>> {
  const result = await listAgents();
  if (!result.ok) return result;
  return { ok: true, data: { authenticated: true, agentCount: result.data.length } };
}
