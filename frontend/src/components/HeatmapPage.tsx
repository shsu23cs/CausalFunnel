import { useEffect, useMemo, useRef, useState } from "react";
import { useHeatmap, usePages } from "../hooks/useHeatmap";
import { SkeletonRow } from "./SkeletonRow";
import { TopBar } from "./TopBar";
import { formatIso } from "../lib/formatTime";

const CANVAS_W = 1280;
const CANVAS_H = 720;

export function HeatmapPage() {
  const pagesQ = usePages();
  const pages = pagesQ.data?.data ?? [];
  const [selectedPage, setSelectedPage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPage && pages[0]) setSelectedPage(pages[0]);
  }, [pages, selectedPage]);

  const heatQ = useHeatmap(selectedPage);
  const clicks = heatQ.data?.data ?? [];

  const stats = useMemo(() => {
    if (!clicks.length) return { total: 0, avgX: 0, avgY: 0 };
    const sx = clicks.reduce((a, c) => a + c.x, 0);
    const sy = clicks.reduce((a, c) => a + c.y, 0);
    return {
      total: clicks.length,
      avgX: Math.round(sx / clicks.length),
      avgY: Math.round(sy / clicks.length),
    };
  }, [clicks]);

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Heatmap" lastUpdated={heatQ.dataUpdatedAt || pagesQ.dataUpdatedAt} />
      <div className="flex-1 overflow-y-auto px-8 py-7">
        {/* Selector row */}
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col gap-2">
            <span className="eyebrow">Select Page</span>
            <PageSelect
              value={selectedPage}
              onChange={setSelectedPage}
              options={pages}
              loading={pagesQ.isLoading}
            />
          </div>
          {selectedPage && !heatQ.isLoading && (
            <div className="flex h-10 items-center rounded-md border border-[#252C3D] bg-[#141820] px-4 font-mono text-[13px] text-[#00E5C3]">
              {clicks.length} clicks recorded
            </div>
          )}
          {pagesQ.data?.usingMock && (
            <div className="font-mono text-[11px] text-[#F4A840]">
              Backend unreachable — demo data
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="mt-6">
          {!selectedPage ? (
            <EmptyHeatmap message="Choose a page URL above to see click data" />
          ) : heatQ.isLoading ? (
            <div className="rounded-lg border border-[#252C3D] bg-[#141820] p-4">
              <SkeletonRow height={CANVAS_H * 0.5} />
              <p className="mt-3 text-center font-mono text-[12px] text-[#6B7A99]">
                Loading click data...
              </p>
            </div>
          ) : clicks.length === 0 ? (
            <EmptyHeatmap message="No click data for this page yet" />
          ) : (
            <HeatmapCanvas points={clicks} />
          )}
        </div>

        {/* Stat bar */}
        {selectedPage && !heatQ.isLoading && clicks.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Stat label="Total Clicks" value={String(stats.total)} accent />
            <Stat label="Avg X Position" value={String(stats.avgX)} />
            <Stat label="Avg Y Position" value={String(stats.avgY)} />
          </div>
        )}
      </div>
    </div>
  );
}

function PageSelect({
  value,
  onChange,
  options,
  loading,
}: {
  value: string | null;
  onChange: (v: string) => void;
  options: string[];
  loading: boolean;
}) {
  return (
    <select
      disabled={loading}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 min-w-[320px] rounded-md border border-[#252C3D] bg-[#141820] px-3 text-[14px] text-[#E8ECF4] focus:border-[#00E5C3] focus:outline-none"
    >
      {loading && <option>Loading pages...</option>}
      {!loading && options.length === 0 && <option>No pages</option>}
      {options.map((p) => (
        <option key={p} value={p} className="bg-[#141820]">
          {p}
        </option>
      ))}
    </select>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-[#252C3D] bg-[#141820] px-5 py-3">
      <div className="eyebrow">{label}</div>
      <div
        className="mt-1 font-mono text-[18px] font-medium"
        style={{ color: accent ? "#00E5C3" : "#E8ECF4" }}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyHeatmap({ message }: { message: string }) {
  return (
    <div className="flex aspect-[1280/720] w-full max-w-full flex-col items-center justify-center rounded-lg border border-[#252C3D] bg-[#0D0F14]">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#252C3D" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" fill="#252C3D" />
        <path d="M12 1v3M12 20v3M1 12h3M20 12h3" />
      </svg>
      <p className="mt-4 text-[15px] font-medium text-[#6B7A99]">{message}</p>
    </div>
  );
}

function HeatmapCanvas({
  points,
}: {
  points: { x: number; y: number; timestamp: string }[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [hover, setHover] = useState<{ i: number; cx: number; cy: number } | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const w = el.clientWidth;
      setScale(Math.min(1, w / CANVAS_W));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="w-full">
      <div
        className="relative grid-bg overflow-hidden rounded-lg border border-[#252C3D] bg-[#0D0F14]"
        style={{
          width: CANVAS_W * scale,
          height: CANVAS_H * scale,
          maxWidth: "100%",
        }}
        onMouseLeave={() => setHover(null)}
      >
        {/* Axis labels */}
        {Array.from({ length: Math.floor(CANVAS_W / 80) + 1 }).map((_, i) => (
          <span
            key={`x${i}`}
            className="absolute font-mono"
            style={{
              left: i * 80 * scale + 4,
              bottom: 4,
              fontSize: 11,
              color: "#252C3D",
            }}
          >
            {i * 80}
          </span>
        ))}
        {Array.from({ length: Math.floor(CANVAS_H / 80) + 1 }).map((_, i) => (
          <span
            key={`y${i}`}
            className="absolute font-mono"
            style={{
              top: i * 80 * scale + 2,
              left: 4,
              fontSize: 11,
              color: "#252C3D",
            }}
          >
            {i * 80}
          </span>
        ))}

        {/* Dots */}
        {points.map((p, i) => {
          const cx = p.x * scale;
          const cy = p.y * scale;
          return (
            <div
              key={i}
              onMouseEnter={() => setHover({ i, cx, cy })}
              className="absolute rounded-full"
              style={{
                left: cx - 8,
                top: cy - 8,
                width: 16,
                height: 16,
                backgroundColor: "rgba(240, 96, 80, 0.35)",
                border: "1px solid rgba(240, 96, 80, 0.7)",
                cursor: "pointer",
              }}
            />
          );
        })}

        {/* Tooltip */}
        {hover && (
          <div
            className="pointer-events-none absolute z-10 rounded-md border border-[#252C3D] bg-[#1C2130] px-3 py-2 font-mono text-[11px] text-[#E8ECF4] shadow-lg"
            style={{
              left: Math.min(hover.cx + 14, CANVAS_W * scale - 220),
              top: Math.max(hover.cy - 50, 4),
              animation: "fadeIn 100ms ease",
            }}
          >
            <div>X: {points[hover.i].x} / Y: {points[hover.i].y}</div>
            <div className="text-[#6B7A99]">{formatIso(points[hover.i].timestamp)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
