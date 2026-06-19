import { Link, useRouterState } from "@tanstack/react-router";

const NAV = [
  { to: "/sessions", label: "Sessions" },
  { to: "/heatmap", label: "Heatmap" },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-[#252C3D] bg-[#141820]">
      <div className="px-6 pt-7 pb-8">
        <div className="font-display text-[22px] font-semibold tracking-[-0.03em] leading-none">
          <span className="text-[#E8ECF4]">Causal</span>
          <span className="text-[#00E5C3]">Funnel</span>
        </div>
        <div className="eyebrow mt-2">Analytics v1</div>
      </div>

      <nav className="flex flex-col gap-0.5 px-2">
        {NAV.map((item) => {
          const active = pathname === item.to || (item.to === "/sessions" && pathname === "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={[
                "relative flex h-10 items-center rounded-md pl-5 pr-3 text-sm transition-colors duration-150",
                active
                  ? "bg-[#1C2130] font-semibold text-[#E8ECF4]"
                  : "font-medium text-[#6B7A99] hover:bg-[#1C2130] hover:text-[#E8ECF4]",
              ].join(" ")}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[#00E5C3]" />
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[#252C3D] px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-[#22C97A] pulse-dot" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22C97A]" />
          </span>
          <span className="font-mono text-[11px] tracking-wider text-[#6B7A99]">LIVE</span>
        </div>
      </div>
    </aside>
  );
}
