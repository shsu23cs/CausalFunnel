import { useEffect, useState } from "react";
import { relativeTime } from "../lib/formatTime";

export function TopBar({ title, lastUpdated }: { title: string; lastUpdated?: number }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#252C3D] px-8">
      <h1 className="font-display text-[20px] font-semibold tracking-[-0.02em] text-[#E8ECF4]">
        {title}
      </h1>
      {lastUpdated && (
        <span className="font-mono text-[12px] text-[#6B7A99]">
          Updated {relativeTime(new Date(lastUpdated).toISOString())}
        </span>
      )}
    </div>
  );
}
