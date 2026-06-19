export function SkeletonRow({ height = 64 }: { height?: number }) {
  return <div className="shimmer w-full rounded-md" style={{ height }} />;
}

export function SkeletonStack({ count = 5, height = 64 }: { count?: number; height?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} height={height} />
      ))}
    </div>
  );
}
