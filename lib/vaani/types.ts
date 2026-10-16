export interface VaaniAgent {
  id: string;
  agent_name: string;
  display_name: string;
  client_id: string;
  client_name: string;
  published: boolean;
  published_at: string | null;
  last_edited_at: string;
  status: "running" | "stopped" | "initialized" | string;
  archived: boolean;
}

export interface VaaniAgentsListResponse {
  data: VaaniAgent[];
  pagination?: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface WebRTCSessionResponse {
  token: string;
  room_name: string;
  agent_name: string;
  connection_url: string;
  live_captions_url: string;
}

export interface TranscriptResponse {
  transcript: string;
  status_code: number;
  function: string;
}

export interface CallHistoryItem {
  call_id: string;
  agent_id?: string;
  agent_name?: string;
  status?: string;
  duration?: number;
  created_at?: string;
  [key: string]: unknown;
}

export interface VaaniValidationError {
  detail: string | Array<{ loc: string[]; msg: string; type: string }>;
}

export type VaaniAPIResponse<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };
