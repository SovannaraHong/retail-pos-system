"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  CircleDollarSign,
  Receipt,
  Wallet,
  Calendar,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from "lucide-react";
import { useReport } from "@/hooks/use-report";
import { ReportService } from "@/services/report-service";
import { readRange, toSearch } from "@/libs/date-range";
import { money } from "@/libs/format";
import type { GroupBy, PickedRange } from "@/types/report";
import DateRangePicker from "../dashboard/_components/date-range-picker";
import SalesChart from "@/components/dashboard/sales-chart";
import HourlyChart from "../dashboard/_components/hourly-chart";
import BarList from "../dashboard/_components/bar-list";
import { Skeleton, Empty } from "@/components/dashboard/card";

export default function ReportsPage() {
  const [range, setRange] = useState<PickedRange>({
    key: "30d",
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");

  const rk = `${range.from}:${range.to}`;
  const overview = useReport(`reports:overview:${rk}:${groupBy}`, () =>
    ReportService.overview(range, groupBy)
  );
  const insights = useReport(`reports:insights:${rk}`, () =>
    ReportService.insights(range)
  );

  const o = overview.data;
  const ins = insights.data;
  const loading = overview.loading && !o;
  const loadingIns = insights.loading && !ins;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1c2740]">Financial & Sales Analytics</h1>
          <p className="text-xs text-[#7d8aa1]">
            Detailed breakdowns of revenue, profit, margins, and sales channels
          </p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {/* Primary KPI Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-[#e9eef7] bg-white p-5 shadow-[0_1px_3px_rgba(30,60,120,0.05)]">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#e8f0ff] text-[#2f6fe8]">
            <CircleDollarSign size={26} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#7d8aa1]">Gross Revenue</p>
            <p className="truncate text-2xl font-extrabold text-[#1c2740]">
              {loading || !o ? "..." : money(o.summary.revenue)}
            </p>
            <p className="truncate text-[11px] font-semibold text-[#1f9d55]">Sales volume</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-[#e9eef7] bg-white p-5 shadow-[0_1px_3px_rgba(30,60,120,0.05)]">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#e3f6ea] text-[#1f9d55]">
            <TrendingUp size={26} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#7d8aa1]">Gross Profit</p>
            <p className="truncate text-2xl font-extrabold text-[#1c2740]">
              {loading || !o ? "..." : money(o.summary.grossProfit)}
            </p>
            <p className="truncate text-[11px] font-semibold text-[#1f9d55]">
              {o?.summary.revenue ? `${((o.summary.grossProfit / o.summary.revenue) * 100).toFixed(1)}% margin` : "0% margin"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-[#e9eef7] bg-white p-5 shadow-[0_1px_3px_rgba(30,60,120,0.05)]">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#fff1d8] text-[#e08a00]">
            <Receipt size={26} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#7d8aa1]">Store Expenses</p>
            <p className="truncate text-2xl font-extrabold text-[#1c2740]">
              {loading || !o ? "..." : money(o.summary.expenses)}
            </p>
            <p className="truncate text-[11px] font-semibold text-[#e08a00]">Operating costs</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-[#e9eef7] bg-white p-5 shadow-[0_1px_3px_rgba(30,60,120,0.05)]">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#efe8ff] text-[#7c4dd8]">
            <Wallet size={26} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#7d8aa1]">Net Profit</p>
            <p className="truncate text-2xl font-extrabold text-[#1c2740]">
              {loading || !o ? "..." : money(o.summary.netProfit)}
            </p>
            <p className="truncate text-[11px] font-semibold text-[#7c4dd8]">After all expenses</p>
          </div>
        </div>
      </section>

      {/* Main Trend Chart */}
      <section className="rounded-2xl border border-[#e9eef7] bg-white p-6 shadow-[0_1px_3px_rgba(30,60,120,0.05)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1c2740]">Sales Revenue Trend</h2>
            <p className="text-xs text-[#7d8aa1]">Periodic trend comparison</p>
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <SalesChart data={o?.daily ?? []} by={groupBy} />
        )}
      </section>

      {/* Hourly and Breakdown Grid */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#e9eef7] bg-white p-6 shadow-[0_1px_3px_rgba(30,60,120,0.05)]">
          <h2 className="mb-4 text-sm font-bold text-[#1c2740]">Peak Sales by Hour</h2>
          {loadingIns ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <HourlyChart data={ins?.hourly ?? []} />
          )}
        </div>

        <div className="rounded-2xl border border-[#e9eef7] bg-white p-6 shadow-[0_1px_3px_rgba(30,60,120,0.05)]">
          <h2 className="mb-4 text-sm font-bold text-[#1c2740]">Revenue by Category</h2>
          {loadingIns ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <BarList
              color="#7c4dd8"
              items={(ins?.categories ?? []).map((c) => ({
                label: c.name,
                value: c.revenue,
                sub: `${c.qty} items sold · profit ${money(c.profit)}`,
              }))}
            />
          )}
        </div>
      </section>
    </div>
  );
}
