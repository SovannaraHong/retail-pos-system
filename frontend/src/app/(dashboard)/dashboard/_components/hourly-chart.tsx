import { money } from "@/libs/format";
import type { HourPoint } from "@/types/report";
import { Empty } from "@/components/dashboard/card";

const hourLabel = (h: number) =>
  h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;

export default function HourlyChart({ data }: { data: HourPoint[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 0);
  if (!data.length || max === 0)
    return <Empty text="No sales in this period yet." />;

  const peak = data.reduce((a, b) => (b.revenue > a.revenue ? b : a));

  return (
    <div>
      <p className="mb-3 text-xs text-[#5d6b85]">
        Busiest hour:{" "}
        <span className="font-semibold text-[#1c2740]">
          {hourLabel(peak.hour)} · {money(peak.revenue)}
        </span>
      </p>
      <div className="flex h-40 items-end gap-1">
        {data.map((d) => (
          <div
            key={d.hour}
            className="group flex h-full min-w-0 flex-1 flex-col justify-end"
          >
            <div className="relative flex flex-1 items-end">
              <span className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-[#1c2740] px-2 py-1 text-[10px] font-semibold text-white group-hover:block">
                {hourLabel(d.hour)} · {money(d.revenue)} · {d.orders} orders
              </span>
              <div
                className={`w-full rounded-t-md transition ${
                  d.hour === peak.hour
                    ? "bg-[#1d5fe0]"
                    : "bg-[#cfdcf8] group-hover:bg-[#8fb0f2]"
                }`}
                style={{
                  height: d.revenue
                    ? `${Math.max((d.revenue / max) * 100, 3)}%`
                    : "0%",
                }}
              />
            </div>
            <span className="mt-2 h-3 text-center text-[9px] text-[#7d8aa1]">
              {d.hour % 3 === 0 ? hourLabel(d.hour) : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
