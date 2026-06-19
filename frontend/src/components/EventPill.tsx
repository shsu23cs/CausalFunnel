export function EventPill({ type }: { type: "page_view" | "click" }) {
  const isClick = type === "click";
  const color = isClick ? "#F06050" : "#7C6FE0";
  return (
    <span
      className="inline-flex items-center rounded font-medium uppercase tracking-[0.05em]"
      style={{
        fontFamily: "Inter, sans-serif",
        fontSize: 11,
        padding: "3px 8px",
        color,
        backgroundColor: `${color}26`,
      }}
    >
      {type}
    </span>
  );
}
