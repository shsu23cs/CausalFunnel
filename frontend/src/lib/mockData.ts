import type { ClickPoint, SessionEvent, SessionSummary } from "./api";

const PAGES = [
  "/",
  "/products",
  "/products/acoustic-headphones",
  "/cart",
  "/checkout",
  "/about",
];

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function makeId(prefix: string, n: number, r: () => number) {
  const chars = "abcdef0123456789";
  let s = prefix;
  for (let i = 0; i < n; i++) s += chars[Math.floor(r() * chars.length)];
  return s;
}

const now = Date.now();

export const MOCK_SESSIONS: SessionSummary[] = Array.from({ length: 14 }, (_, i) => {
  const r = rand(i + 7);
  const events = 3 + Math.floor(r() * 22);
  const ageMs = Math.floor(r() * 1000 * 60 * 60 * 8);
  return {
    id: makeId("sess_", 22, r),
    eventCount: events,
    latestTimestamp: new Date(now - ageMs).toISOString(),
    pageUrl: PAGES[Math.floor(r() * PAGES.length)],
  };
});

export const MOCK_EVENTS: Record<string, SessionEvent[]> = Object.fromEntries(
  MOCK_SESSIONS.map((s) => {
    const r = rand(s.id.length * 13);
    let t = new Date(s.latestTimestamp).getTime() - s.eventCount * 9000;
    const events: SessionEvent[] = [];
    for (let i = 0; i < s.eventCount; i++) {
      t += 4000 + Math.floor(r() * 18000);
      const isClick = i > 0 && r() > 0.45;
      events.push({
        id: makeId("evt_", 14, r),
        type: isClick ? "click" : "page_view",
        timestamp: new Date(t).toISOString(),
        pageUrl: PAGES[Math.floor(r() * PAGES.length)],
        ...(isClick
          ? { x: Math.floor(r() * 1280), y: Math.floor(r() * 720) }
          : {}),
      });
    }
    return [s.id, events];
  }),
);

export const MOCK_PAGES = PAGES;

export const MOCK_HEATMAP: Record<string, ClickPoint[]> = Object.fromEntries(
  PAGES.map((p, idx) => {
    const r = rand(idx * 91 + 5);
    const count = 18 + Math.floor(r() * 50);
    // Cluster around a few hotspots
    const hotspots = Array.from({ length: 3 }, () => ({
      x: 150 + r() * 980,
      y: 80 + r() * 560,
    }));
    return [
      p,
      Array.from({ length: count }, () => {
        const h = hotspots[Math.floor(r() * hotspots.length)];
        const x = Math.max(0, Math.min(1280, h.x + (r() - 0.5) * 220));
        const y = Math.max(0, Math.min(720, h.y + (r() - 0.5) * 180));
        return {
          x: Math.round(x),
          y: Math.round(y),
          timestamp: new Date(now - Math.floor(r() * 1000 * 60 * 60 * 6)).toISOString(),
        };
      }),
    ];
  }),
);
