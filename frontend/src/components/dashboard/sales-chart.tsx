import { money } from "@/libs/format";
import type { DayPoint } from "@/types/report";
import { Empty } from "@/components/dashboard/card";

type By = "day" | "week" | "month";

function label(date: string, by: By) {
  const d = new Date(date + "T00:00:00");
  if (by === "month")
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  const text = d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
  return by === "week" ? `Week of ${text}` : text;
}

export default function SalesChart({
  data,
  by = "day",
}: {
  data: DayPoint[];
  by?: By;
}) {
  const max = Math.max(...data.map((d) => d.revenue), 0);
  if (!data.length || max === 0)
    return <Empty text="No sales in this period yet." />;

  // show about 8 axis labels, whatever the number of bars
  const step = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className="flex h-52 items-end gap-0.5 sm:gap-1.5">
      {data.map((d, i) => {
        const last = i === data.length - 1;
        const full = label(d.date, by);
        const short = by === "week" ? full.replace("Week of ", "") : full;
        return (
          <div
            key={d.date}
            className="group flex h-full min-w-0 flex-1 flex-col justify-end"
          >
            <div className="relative flex flex-1 items-end">
              <span className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-[#1c2740] px-2 py-1 text-[10px] font-semibold text-white group-hover:block">
                {full} · {money(d.revenue)} · {d.orders} orders · profit{" "}
                {money(d.profit)}
              </span>
              <div
                className={`w-full rounded-t-lg transition ${
                  last
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
            <span className="mt-2 h-3 truncate text-center text-[10px] text-[#7d8aa1]">
              {i % step === 0 ? short : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
