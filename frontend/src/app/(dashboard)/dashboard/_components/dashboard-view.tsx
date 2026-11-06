"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CircleDollarSign,
  Package,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Truck,
  Undo2,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import MiniCalendar from "@/components/dashboard/mini-calendar";
import WelcomeBanner from "@/components/dashboard/welcome-banner";
import { card, CardHeader, Empty, Skeleton } from "@/components/dashboard/card";
import Segmented from "@/components/dashboard/segmented";
import SalesChart from "@/components/dashboard/sales-chart";
import { useReport } from "@/hooks/use-report";
import { readRange, toSearch } from "@/libs/date-range";
import { compact, delta, money } from "@/libs/format";
import { ReportService } from "@/services/report-service";
import type { GroupBy, PickedRange, SortKey } from "@/types/report";
import DateRangePicker from "./date-range-picker";
import HourlyChart from "./hourly-chart";
import BarList from "./bar-list";
import Image from "next/image";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "qty", label: "Qty" },
  { key: "revenue", label: "Revenue" },
  { key: "profit", label: "Profit" },
];

const GROUPS: { key: GroupBy; label: string }[] = [
  { key: "auto", label: "Auto" },
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

const PALETTE = ["#2f6fe8", "#22b35e", "#f5a524", "#7c4dd8", "#ef4444"];
const GOOD = "text-[#1f9d55]";
const BAD = "text-[#e5484d]";

const quickAccess: {
  label: string;
  href: string;
  icon: LucideIcon;
  box: string;
}[] = [
  {
    label: "New Sale",
    href: "/sales",
    icon: ShoppingCart,
    box: "bg-[#e8f0ff] text-[#2f6fe8]",
  },
  {
    label: "Products",
    href: "/products",
    icon: Package,
    box: "bg-[#e3f6ea] text-[#1f9d55]",
  },
  {
    label: "Purchases",
    href: "/purchases",
    icon: Truck,
    box: "bg-[#efe8ff] text-[#7c4dd8]",
  },
  {
    label: "Customers",
    href: "/customers",
    icon: Users,
    box: "bg-[#fff1d8] text-[#e08a00]",
  },
  {
    label: "Expenses",
    href: "/expenses",
    icon: Receipt,
    box: "bg-[#e4efff] text-[#2f6fe8]",
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    box: "bg-[#ffe9ec] text-[#e5484d]",
  },
];

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-[#dff5e6] text-[#1f8a4c]",
  partially_refunded: "bg-[#fff1d8] text-[#b36b00]",
  refunded: "bg-[#fff1d8] text-[#b36b00]",
  voided: "bg-[#ffe9ec] text-[#d64545]",
};

const pretty = (s: string) =>
  s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/* ------------------------------ Donut ---------------------------------- */

function Donut({ values, total }: { values: number[]; total: number }) {
  const stops = values
    .map((value, i) => {
      const start = values.slice(0, i).reduce((sum, v) => sum + v, 0);
      const from = total ? (start / total) * 100 : 0;
      const to = total ? ((start + value) / total) * 100 : 0;
      return `${PALETTE[i % PALETTE.length]} ${from}% ${to}%`;
    })
    .join(", ");

  return (
    <div className="relative mx-auto h-36 w-36 shrink-0">
      <div
        className="h-full w-full rounded-full"
        style={{ background: `conic-gradient(${stops})` }}
      />
      <div className="absolute inset-[16%] flex flex-col items-center justify-center rounded-full bg-white text-center">
        <span className="text-xl font-extrabold text-[#1c2740]">
          ${compact(total)}
        </span>
        <span className="text-[10px] leading-tight text-[#7d8aa1]">
          Gross
          <br />
          Sales
        </span>
      </div>
    </div>
  );
}

/* -------------------------------- View --------------------------------- */

type Stat = {
  label: string;
  value: string;
  note: string;
  noteClass: string;
  icon: LucideIcon;
  iconBox: string;
};

function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // the selected range lives in the URL, so a refresh or a shared link keeps it
  const range = useMemo(() => readRange(params), [params]);
  const setRange = (r: PickedRange) =>
    router.replace(`${pathname}?${toSearch(r)}`, { scroll: false });

  const [sort, setSort] = useState<SortKey>("qty");
  const [groupBy, setGroupBy] = useState<GroupBy>("auto");

  const rk = `${range.from}:${range.to}`;
  const overview = useReport(`overview:${rk}:${groupBy}`, () =>
    ReportService.overview(range, groupBy),
  );
  const insights = useReport(`insights:${rk}`, () =>
    ReportService.insights(range),
  );
  const top = useReport(`top:${rk}:${sort}`, () =>
    ReportService.topProducts(range, sort),
  );

  const o = overview.data;
  const ins = insights.data;
  const loading = overview.loading && !o;
  const loadingIns = insights.loading && !ins;

  // card with a "vs previous period" note; `invert` = a rise is bad (expenses, refunds)
  const compare = (
    label: string,
    cur: number,
    prev: number,
    icon: LucideIcon,
    iconBox: string,
    invert = false,
  ): Stat => {
    const d = delta(cur, prev);
    const good = invert ? !d.up : d.up;
    return {
      label,
      value: money(cur),
      note: d.text,
      noteClass: good ? GOOD : BAD,
      icon,
      iconBox,
    };
  };

  const stats: Stat[] = o
    ? [
        compare(
          "Net Sales",
          o.summary.revenue,
          o.previous.revenue,
          CircleDollarSign,
          "bg-[#e8f0ff] text-[#2f6fe8]",
        ),
        {
          ...compare(
            "Orders",
            o.summary.orders,
            o.previous.orders,
            ShoppingBag,
            "bg-[#e3f6ea] text-[#1f9d55]",
          ),
          value: String(o.summary.orders),
        },
        compare(
          "Gross Profit",
          o.summary.grossProfit,
          o.previous.grossProfit,
          TrendingUp,
          "bg-[#efe8ff] text-[#7c4dd8]",
        ),
        compare(
          "Expenses",
          o.summary.expenses,
          o.previous.expenses,
          Receipt,
          "bg-[#e4efff] text-[#2f6fe8]",
          true,
        ),
        {
          ...compare(
            "Net Profit",
            o.summary.netProfit,
            o.previous.netProfit,
            Wallet,
            "bg-[#e3f6ea] text-[#1f9d55]",
          ),
        },
        compare(
          "Refunds",
          o.summary.refunds,
          o.previous.refunds,
          Undo2,
          "bg-[#fff1d8] text-[#e08a00]",
          true,
        ),
        {
          label: "Stock Value",
          value: money(o.stockValue.cost),
          note: o.stockValue.retail
            ? `Retail ${money(o.stockValue.retail)}`
            : "At cost",
          noteClass: "text-[#e08a00]",
          icon: Package,
          iconBox: "bg-[#fff1d8] text-[#e08a00]",
        },
        {
          label: "Low Stock",
          value: String(o.lowStockTotal),
          note: o.stockValue.outOfStock
            ? `${o.stockValue.outOfStock} out of stock`
            : o.lowStockTotal
              ? "Needs restock"
              : "All stocked",
          noteClass: o.lowStockTotal ? BAD : GOOD,
          icon: Boxes,
          iconBox: "bg-[#ffe9ec] text-[#e5484d]",
        },
      ]
    : [];

  const cashierTotal = o?.cashiers.reduce((s, c) => s + c.revenue, 0) ?? 0;
  const topCashiers = o?.cashiers.slice(0, 5) ?? [];
  const expenseTotal = ins?.expenses.reduce((s, e) => s + e.total, 0) ?? 0;
  const paymentTotal =
    o?.summary.payments.reduce((s, p) => s + p.total, 0) ?? 0;

  return (
    <div className="space-y-5">
      <WelcomeBanner />

      {/* Date range */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-[#1c2740]">Store Overview</h1>
          <p className="text-xs text-[#7d8aa1]">
            {range.from === range.to
              ? range.from
              : `${range.from} to ${range.to}`}{" "}
            · compared with the previous period
          </p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {(overview.error || insights.error) && (
        <div className="rounded-xl border border-[#ffd5d9] bg-[#fff1f2] px-4 py-3 text-xs font-medium text-[#d64545]">
          Couldn&apos;t load dashboard data: {overview.error ?? insights.error}
        </div>
      )}

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`${card} flex items-center gap-4`}>
                <Skeleton className="h-14 w-14 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ))
          : stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`${card} flex items-center gap-4`}
                >
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${stat.iconBox}`}
                  >
                    <Icon size={26} strokeWidth={1.7} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#1c2740]">
                      {stat.label}
                    </p>
                    <p className="truncate text-[26px] font-extrabold leading-tight text-[#1c2740]">
                      {stat.value}
                    </p>
                    <p
                      className={`truncate text-[11px] font-semibold ${stat.noteClass}`}
                    >
                      {stat.note}
                    </p>
                  </div>
                </div>
              );
            })}
      </section>

      {/* Sales trend + low stock */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className={`${card} xl:col-span-3`}>
          <CardHeader
            title="Sales Trend"
            href="/reports"
            linkLabel="Full Report"
            right={
              <Segmented
                small
                options={GROUPS}
                value={groupBy}
                onChange={setGroupBy}
              />
            }
          />
          {loading ? (
            <Skeleton className="h-52 w-full" />
          ) : (
            <SalesChart data={o?.daily ?? []} by={o?.groupBy ?? "day"} />
          )}
        </div>

        <div className={`${card} xl:col-span-2`}>
          <CardHeader
            title="Low Stock Alerts"
            href="/stocks"
            linkLabel="View All"
          />
          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : o && o.lowStock.length ? (
            <div className="space-y-4">
              {o.lowStock.map((p) => (
                <div key={p.name} className="flex gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ffe9ec] text-[#e5484d]">
                    <AlertTriangle size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[#1c2740]">
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[#6c7a93]">
                      {p.stock <= 0
                        ? "Out of stock"
                        : `Only ${p.stock} left in stock.`}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[#1d5fe0]">
                      Reorder level: {p.reorder}
                    </p>
                  </div>
                </div>
              ))}
              {o.lowStockTotal > o.lowStock.length && (
                <p className="text-[11px] text-[#7d8aa1]">
                  + {o.lowStockTotal - o.lowStock.length} more
                </p>
              )}
            </div>
          ) : (
            <Empty text="Everything is above its reorder level 🎉" />
          )}
        </div>
      </section>

      {/* Sales by hour + payment methods */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className={`${card} xl:col-span-3`}>
          <CardHeader title="Sales by Hour" />
          {loadingIns ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <HourlyChart data={ins?.hourly ?? []} />
          )}
        </div>

        <div className={`${card} xl:col-span-2`}>
          <CardHeader title="Payment Methods" />
          {loading ? (
            <Skeleton className="h-36 w-full" />
          ) : (
            <BarList
              color="#22b35e"
              empty="No payments in this period."
              items={(o?.summary.payments ?? []).map((p) => ({
                label: pretty(p.method),
                value: p.total,
                sub: `${p.count} payment${p.count === 1 ? "" : "s"}${
                  paymentTotal
                    ? ` · ${Math.round((p.total / paymentTotal) * 100)}%`
                    : ""
                }`,
              }))}
            />
          )}
        </div>
      </section>

      {/* Top products + cashier performance */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className={`${card} xl:col-span-3`}>
          <CardHeader
            title="Top Products"
            right={
              <Segmented
                small
                options={SORTS}
                value={sort}
                onChange={setSort}
              />
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-left text-xs">
              <thead>
                <tr className="bg-[#f4f7fc] text-[#5d6b85]">
                  {[
                    "#",
                    "Image",
                    "Product",
                    "Qty",
                    "Revenue (ex. tax)",
                    "Profit",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 font-medium first:rounded-l-lg last:rounded-r-lg"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {top.loading && !top.data
                  ? [0, 1, 2, 3, 4].map((i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-3 py-2">
                          <Skeleton className="h-6 w-full" />
                        </td>
                      </tr>
                    ))
                  : (top.data ?? []).map((p, i) => (
                      <tr
                        key={p.name + i}
                        className="border-b border-[#f0f3f9] last:border-0"
                      >
                        <td className="px-3 py-3 font-semibold text-[#7d8aa1]">
                          {i + 1}
                        </td>
                        <td className="px-3 py-3">
                          <Image
                            src={p.image_url || "/placeholder.png"}
                            alt={p.name}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        </td>
                        <td className="px-3 py-3 font-semibold text-[#1c2740]">
                          {p.name}
                        </td>
                        <td className="px-3 py-3 text-[#3d4a63]">{p.qty}</td>
                        <td className="px-3 py-3 font-semibold text-[#1c2740]">
                          {money(p.revenue)}
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-[#dff5e6] px-2.5 py-0.5 text-[11px] font-semibold text-[#1f8a4c]">
                            {money(p.profit)}
                          </span>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {!top.loading && !top.data?.length && (
              <Empty text="No products sold in this period." />
            )}
          </div>
        </div>

        <div className={`${card} xl:col-span-2`}>
          <CardHeader
            title="Cashier Performance"
            href="/reports"
            linkLabel="View Details"
          />
          {loading ? (
            <Skeleton className="h-36 w-full" />
          ) : topCashiers.length && cashierTotal ? (
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <Donut
                values={topCashiers.map((c) => c.revenue)}
                total={cashierTotal}
              />
              <ul className="w-full space-y-3 text-xs">
                {topCashiers.map((c, i) => (
                  <li
                    key={c.name + i}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-[#3d4a63]">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: PALETTE[i % PALETTE.length] }}
                      />
                      <span className="truncate">
                        {c.name}{" "}
                        <span className="text-[#7d8aa1]">({c.orders})</span>
                      </span>
                    </span>
                    <span className="font-semibold text-[#1c2740]">
                      {Math.round((c.revenue / cashierTotal) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Empty text="No cashier sales in this period." />
          )}
        </div>
      </section>

      {/* Categories + expenses + customers */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className={card}>
          <CardHeader title="Sales by Category" />
          {loadingIns ? (
            <Skeleton className="h-36 w-full" />
          ) : (
            <BarList
              color="#7c4dd8"
              items={(ins?.categories ?? []).map((c) => ({
                label: c.name,
                value: c.revenue,
                sub: `${c.qty} sold · profit ${money(c.profit)}`,
              }))}
            />
          )}
        </div>

        <div className={card}>
          <CardHeader
            title="Expenses by Category"
            href="/expenses"
            linkLabel="View All"
          />
          {loadingIns ? (
            <Skeleton className="h-36 w-full" />
          ) : (
            <BarList
              color="#f5a524"
              empty="No expenses in this period."
              items={(ins?.expenses ?? []).map((e) => ({
                label: e.name,
                value: e.total,
                sub: `${e.count} expense${e.count === 1 ? "" : "s"}${
                  expenseTotal
                    ? ` · ${Math.round((e.total / expenseTotal) * 100)}%`
                    : ""
                }`,
              }))}
            />
          )}
        </div>

        <div className={card}>
          <CardHeader
            title="Top Customers"
            href="/customers"
            linkLabel="View All"
          />
          {loadingIns ? (
            <Skeleton className="h-36 w-full" />
          ) : (
            <BarList
              color="#2f6fe8"
              empty="No sales to named customers in this period."
              items={(ins?.customers ?? []).map((c) => ({
                label: c.name,
                value: c.total,
                sub: `${c.orders} order${c.orders === 1 ? "" : "s"}`,
              }))}
            />
          )}
        </div>
      </section>

      {/* Latest sales */}
      <section className={card}>
        <CardHeader title="Latest Sales" href="/sales" linkLabel="View All" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead>
              <tr className="bg-[#f4f7fc] text-[#5d6b85]">
                {[
                  "Invoice",
                  "Time",
                  "Customer",
                  "Cashier",
                  "Total",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 font-medium first:rounded-l-lg last:rounded-r-lg"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingIns
                ? [0, 1, 2].map((i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-3 py-2">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                : (ins?.recent ?? []).map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-[#f0f3f9] last:border-0"
                    >
                      <td className="px-3 py-3 font-semibold text-[#1c2740]">
                        {s.invoice}
                      </td>
                      <td className="px-3 py-3 text-[#3d4a63]">
                        {new Date(s.soldAt.replace(" ", "T")).toLocaleString(
                          "en-US",
                          {
                            day: "numeric",
                            month: "short",
                            hour: "numeric",
                            minute: "2-digit",
                          },
                        )}
                      </td>
                      <td className="px-3 py-3 text-[#3d4a63]">{s.customer}</td>
                      <td className="px-3 py-3 text-[#3d4a63]">{s.cashier}</td>
                      <td className="px-3 py-3 font-semibold text-[#1c2740]">
                        {money(s.total)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            STATUS_STYLE[s.status] ??
                            "bg-[#eef2f9] text-[#5d6b85]"
                          }`}
                        >
                          {pretty(s.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!loadingIns && !ins?.recent.length && (
            <Empty text="No sales in this period." />
          )}
        </div>
      </section>

      {/* Calendar + quick access + period summary */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_1.25fr]">
        <div className={card}>
          <CardHeader title="Business Calendar" />
          <MiniCalendar />
        </div>

        <div className={card}>
          <CardHeader title="Quick Access" />
          <div className="grid grid-cols-3 gap-3">
            {quickAccess.map((q) => {
              const Icon = q.icon;
              return (
                <Link
                  key={q.label}
                  href={q.href}
                  className="group flex flex-col items-center gap-2 rounded-xl p-2 text-center transition hover:bg-[#f4f7fc]"
                >
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-xl ${q.box}`}
                  >
                    <Icon size={26} strokeWidth={1.7} />
                  </span>
                  <span className="text-[11px] font-medium text-[#3d4a63]">
                    {q.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className={`${card} lg:col-span-2 xl:col-span-1`}>
          <CardHeader
            title="Period Summary"
            href="/reports"
            linkLabel="View Details"
          />
          {loading || !o ? (
            <Skeleton className="h-36 w-full" />
          ) : (
            <ul className="space-y-3 text-xs">
              {[
                ["Avg. order value", money(o.summary.avg)],
                ["Items sold", String(o.summary.items)],
                [
                  "Profit margin",
                  o.summary.revenue ? `${o.summary.margin.toFixed(1)}%` : "—",
                ],
                ["Discounts given", money(o.summary.discounts)],
                ["Tax collected", money(o.summary.tax)],
                [
                  "Voided sales",
                  o.summary.voidedCount
                    ? `${o.summary.voidedCount} · ${money(o.summary.voidedAmount)}`
                    : "0",
                ],
                ["Stock at cost", money(o.stockValue.cost)],
                [
                  "Stock at retail",
                  o.stockValue.retail ? money(o.stockValue.retail) : "—",
                ],
                [
                  "Potential profit on shelf",
                  o.stockValue.retail
                    ? money(o.stockValue.retail - o.stockValue.cost)
                    : "—",
                ],
              ].map(([label, value]) => (
                <li
                  key={label}
                  className="flex items-center justify-between border-b border-[#f0f3f9] pb-2.5 last:border-0"
                >
                  <span className="text-[#5d6b85]">{label}</span>
                  <span className="font-semibold text-[#1c2740]">{value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <footer className="flex flex-col justify-between gap-1 pb-2 text-[11px] text-[#7d8aa1] sm:flex-row">
        <p>© 2026 Retail POS Management System. All rights reserved.</p>
        <p>Made with ❤️ for your store</p>
      </footer>
    </div>
  );
}

// useSearchParams needs a Suspense boundary in the Next.js app router
export default function DashboardView() {
  return (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  );
}
