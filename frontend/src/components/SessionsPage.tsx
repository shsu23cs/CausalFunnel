import { useMemo, useState } from "react";
import { useSessionDetail, useSessions } from "../hooks/useSessions";
import type { SessionEvent } from "../lib/api";
import { formatIso, relativeTime, truncId } from "../lib/formatTime";
import { SkeletonStack } from "./SkeletonRow";
import { EventPill } from "./EventPill";
import { TopBar } from "./TopBar";

export function SessionsPage() {
  const sessionsQ = useSessions();
  const sessions = sessionsQ.data?.data ?? [];
  const usingMock = sessionsQ.data?.usingMock;

  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      sessions.filter((s) =>
        filter ? s.id.toLowerCase().includes(filter.toLowerCase()) : true,
      ),
    [sessions, filter],
  );

  const activeId = selected ?? filtered[0]?.id ?? null;
  const detailQ = useSessionDetail(activeId);

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Sessions" lastUpdated={sessionsQ.dataUpdatedAt} />
      <div className="flex flex-1 overflow-hidden">
        {/* Left list */}
        <div className="flex w-[400px] shrink-0 flex-col border-r border-[#252C3D] bg-[#141820]">
          <div className="border-b border-[#252C3D] px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="eyebrow">All Sessions</span>
              <span className="font-mono text-[12px] text-[#00E5C3]">
                {sessions.length} sessions
              </span>
            </div>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by session ID..."
              className="mt-3 w-full rounded-md border border-[#252C3D] bg-[#1C2130] px-3 py-2 text-[13px] text-[#E8ECF4] placeholder:text-[#4A5568] focus:border-[#00E5C3] focus:outline-none"
            />
            {usingMock && (
              <p className="mt-2 font-mono text-[11px] text-[#F4A840]">
                Backend unreachable — showing demo data
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {sessionsQ.isLoading ? (
              <div className="p-4">
                <SkeletonStack count={5} height={76} />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState message="No sessions recorded yet" />
            ) : (
              filtered.map((s) => {
                const active = s.id === activeId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s.id)}
                    className={[
                      "group relative flex w-full flex-col gap-1 border-b border-[#252C3D] px-5 py-3 text-left transition-colors duration-150",
                      active ? "bg-[#1C2130]" : "hover:bg-[#1C2130]",
                    ].join(" ")}
                  >
                    {active && (
                      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#00E5C3]" />
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[13px] font-medium text-[#E8ECF4]">
                        {truncId(s.id)}
                      </span>
                      <span className="font-mono text-[12px] text-[#00E5C3]">
                        {s.eventCount} events
                      </span>
                    </div>
                    <div className="truncate text-[12px] text-[#6B7A99]">{s.pageUrl}</div>
                    <div className="flex items-center justify-between text-[12px] text-[#6B7A99]">
                      <span>{relativeTime(s.latestTimestamp)}</span>
                      <span className="font-mono text-[11px] text-[#4A5568]">
                        {formatIso(s.latestTimestamp)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right detail */}
        <div className="flex-1 overflow-y-auto bg-[#0D0F14] px-8 py-7">
          {!activeId ? (
            <SelectPrompt />
          ) : detailQ.isLoading ? (
            <SkeletonStack count={6} height={72} />
          ) : (
            <SessionDetail
              id={activeId}
              events={detailQ.data?.data ?? []}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SessionDetail({ id, events }: { id: string; events: SessionEvent[] }) {
  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <div className="eyebrow">Session Journey</div>
          <div className="mt-2 flex items-center gap-3">
            <span className="font-mono text-[15px] text-[#E8ECF4]">{id}</span>
            <span className="font-mono text-[12px] text-[#00E5C3]">
              {events.length} events
            </span>
          </div>
        </div>
      </div>

      <div className="relative pl-6">
        <div className="absolute left-[10px] top-1 bottom-1 w-px bg-[#252C3D]" />
        <div className="flex flex-col gap-5">
          {events.map((e) => {
            const color = e.type === "click" ? "#F06050" : "#7C6FE0";
            return (
              <div key={e.id} className="relative">
                <span
                  className="absolute -left-[22px] top-2 h-[10px] w-[10px] rounded-full border-2"
                  style={{ borderColor: color, backgroundColor: "#0D0F14" }}
                />
                <div className="rounded-lg border border-[#252C3D] bg-[#141820] px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <EventPill type={e.type} />
                      <span className="font-mono text-[12px] text-[#6B7A99]">
                        {formatIso(e.timestamp)}
                      </span>
                    </div>
                    {e.type === "click" && e.x !== undefined && e.y !== undefined && (
                      <span className="rounded bg-[#1C2130] px-2.5 py-1 font-mono text-[12px] text-[#00E5C3]">
                        X: {e.x} / Y: {e.y}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 truncate text-[13px] text-[#E8ECF4]">{e.pageUrl}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SelectPrompt() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#252C3D" strokeWidth="1.5">
        <path d="M20 12H4M4 12l6-6M4 12l6 6" />
      </svg>
      <p className="mt-4 text-[15px] font-medium text-[#6B7A99]">
        Select a session to view the journey
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#252C3D" strokeWidth="1.5">
        <path d="M3 4h18l-7 9v6l-4 2v-8L3 4z" />
      </svg>
      <p className="mt-4 text-[15px] font-medium text-[#6B7A99]">{message}</p>
    </div>
  );
}
