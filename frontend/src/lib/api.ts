const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3001";

export type SessionSummary = {
  id: string;
  eventCount: number;
  latestTimestamp: string;
  pageUrl: string;
};

export type SessionEvent = {
  id: string;
  type: "page_view" | "click";
  timestamp: string;
  pageUrl: string;
  x?: number;
  y?: number;
};

export type ClickPoint = { x: number; y: number; timestamp: string };

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  sessions: () => get<SessionSummary[]>("/api/sessions"),
  session: (id: string) => get<SessionEvent[]>(`/api/sessions/${id}`),
  pages: () => get<string[]>("/api/pages"),
  heatmap: (url: string) => get<ClickPoint[]>(`/api/heatmap?page=${encodeURIComponent(url)}`),
};
