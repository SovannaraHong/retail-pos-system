import { money } from "@/libs/format";
import { Empty } from "@/components/dashboard/card";

export type BarItem = { label: string; value: number; sub?: string };

export default function BarList({
  items,
  format = money,
  color = "#2f6fe8",
  empty = "No data in this period.",
}: {
  items: BarItem[];
  format?: (n: number) => string;
  color?: string;
  empty?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 0);
  if (!items.length || max <= 0) return <Empty text={empty} />;

  return (
    <ul className="space-y-3.5">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate font-semibold text-[#1c2740]">
              {i.label}
            </span>
            <span className="shrink-0 font-semibold text-[#1c2740]">
              {format(i.value)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#eef2f9]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((i.value / max) * 100, 2)}%`,
                background: color,
              }}
            />
          </div>
          {i.sub && <p className="mt-1 text-[11px] text-[#7d8aa1]">{i.sub}</p>}
        </li>
      ))}
    </ul>
  );
}
