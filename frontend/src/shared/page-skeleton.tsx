/** Server-safe (no hooks) so it can be used by loading.tsx and by the page. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="animate-pulse" role="status" aria-label="Loading products">
      <div className="h-10 bg-[#f4f7fc]" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-[#f0f3f9] px-4 py-3.5"
        >
          <div className="h-4 w-4 rounded bg-[#e3e9f4]" />
          <div className="h-11 w-11 rounded-xl bg-[#e3e9f4]" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 rounded bg-[#e3e9f4]" />
            <div className="h-3 w-1/5 rounded bg-[#eef2f9]" />
          </div>
          <div className="hidden h-3.5 w-20 rounded bg-[#e3e9f4] md:block" />
          <div className="h-3.5 w-16 rounded bg-[#e3e9f4]" />
          <div className="hidden h-3.5 w-28 rounded bg-[#e3e9f4] lg:block" />
          <div className="h-6 w-20 rounded-full bg-[#e3e9f4]" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div className="animate-pulse space-y-2">
          <div className="h-7 w-32 rounded bg-[#e3e9f4]" />
          <div className="h-4 w-48 rounded bg-[#eef2f9]" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-[#e3e9f4]" />
      </div>
      <section className="overflow-hidden rounded-2xl border border-[#e9eef7] bg-white">
        <div className="h-12 border-b border-[#f0f3f9]" />
        <div className="h-16" />
        <TableSkeleton />
      </section>
    </div>
  );
}
