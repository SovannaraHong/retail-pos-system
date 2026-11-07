"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock, Eye, LoaderCircle, X } from "lucide-react";
import { ShiftService, type ShiftQuery } from "@/services/shift-service";
import type { PaginationMeta } from "@/services/product-service";
import type { Shift } from "@/types/shift";
import { useAuth } from "@/hooks/use-auth";
import { parseApiError } from "@/libs/api-error";
import { focusRing, money } from "@/libs/format";
import { Pagination } from "@/shared/pagination";
import { PageSkeleton, TableSkeleton } from "@/shared/page-skeleton";

type StatusFilter = "all" | "open" | "closed";

const DEFAULT_PER_PAGE = 10;

const TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All shifts" },
  { key: "open", label: "Open" },
  { key: "closed", label: "Closed" },
];

const card =
  "rounded-2xl border border-[#e9eef7] bg-white shadow-[0_1px_3px_rgba(30,60,120,0.05)]";
const control =
  "h-10 rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] px-3 text-sm text-[#1c2740] focus:border-[#2f6fe8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6fe8]/20";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#2f6fe8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d5fe0]";

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString() : "-";

function DiffText({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[#9aa5b8]">-</span>;
  const cls =
    value === 0
      ? "text-[#1f9d55]"
      : value > 0
        ? "text-[#d97706]"
        : "text-[#e5484d]";
  const text =
    value === 0
      ? "Match"
      : value > 0
        ? `+${money(value)}`
        : `-${money(Math.abs(value))}`;
  return <span className={`font-bold tabular-nums ${cls}`}>{text}</span>;
}

function StatusPill({ status }: { status: Shift["status"] }) {
  return status === "open" ? (
    <span className="rounded-full bg-[#eefaf3] px-2.5 py-1 text-xs font-bold text-[#1f6b41]">
      Open
    </span>
  ) : (
    <span className="rounded-full bg-[#eef1f6] px-2.5 py-1 text-xs font-bold text-[#4b5565]">
      Closed
    </span>
  );
}

export function ShiftsView() {
  const router = useRouter();
  const { ready, can } = useAuth();
  const canView = can("shifts.view");

  // ---- filters ----
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // page goes back to 1 by itself when a filter changes
  const filterKey = `${status}|${dateFrom}|${dateTo}|${perPage}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (p: number) => setPageState({ key: filterKey, page: p });

  // ---- data ----
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<{
    key: string | null;
    rows: Shift[];
    meta: {
      last_page: number;
      total: number;
      from: number | null;
      to: number | null;
    };
    error: string | null;
  }>({
    key: null,
    rows: [],
    meta: { last_page: 1, total: 0, from: null, to: null },
    error: null,
  });

  const params = useMemo<ShiftQuery>(
    () => ({
      page,
      per_page: perPage,
      status: status === "all" ? undefined : status,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [page, perPage, status, dateFrom, dateTo],
  );
  const requestKey = `${JSON.stringify(params)}#${reloadKey}`;

  const { rows, meta } = result;
  const firstLoad = result.key === null;
  const fetching = result.key !== requestKey;
  const error = fetching ? null : result.error;
  const showSkeleton = firstLoad || (fetching && result.error !== null);

  const [viewing, setViewing] = useState<number | null>(null);

  useEffect(() => {
    if (ready && !canView) router.replace("/forbidden");
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready || !canView) return;
    const controller = new AbortController();
    let cancelled = false;

    ShiftService.getAll(params, controller.signal)
      .then((res) => {
        if (cancelled) return;
        const m: Partial<PaginationMeta> = res.meta ?? res;
        setResult({
          key: requestKey,
          rows: res.data,
          meta: {
            last_page: m.last_page ?? 1,
            total: m.total ?? res.data.length,
            from: m.from ?? null,
            to: m.to ?? null,
          },
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setResult((r) => ({
          ...r,
          key: requestKey,
          error: parseApiError(err).message,
        }));
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [ready, canView, params, requestKey]);

  const filtersActive = status !== "all" || dateFrom !== "" || dateTo !== "";
  const resetFilters = () => {
    setStatus("all");
    setDateFrom("");
    setDateTo("");
  };

  if (!ready) return <PageSkeleton />;
  if (!canView) return null;

  return (
    <div className="w-full space-y-5">
      <header>
        <div className="mb-2 flex items-center gap-2 text-xs text-[#7d8aa1]">
          <span>Management</span>
          <span>/</span>
          <span className="font-semibold text-[#1d5fe0]">Shifts</span>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-[#1c2740]">
          Shifts
        </h2>
        <p className="mt-1 text-sm text-[#6c7a93]">
          {firstLoad
            ? "Loading shifts…"
            : `${meta.total} ${meta.total === 1 ? "shift" : "shifts"} found`}
        </p>
      </header>

      <section className={`${card} overflow-hidden`}>
        {/* status tabs */}
        <div
          className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-[#f0f3f9] px-4 pt-2"
          role="tablist"
          aria-label="Filter by status"
        >
          {TABS.map((t) => {
            const active = status === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setStatus(t.key)}
                className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${focusRing} ${
                  active
                    ? "border-[#2f6fe8] text-[#1d5fe0]"
                    : "border-transparent text-[#7d8aa1] hover:text-[#1c2740]"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* date filters */}
        <div className="flex flex-wrap items-end gap-3 px-5 py-4">
          <label className="text-xs font-semibold text-[#6c7a93]">
            From
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`${control} mt-1 block`}
            />
          </label>
          <label className="text-xs font-semibold text-[#6c7a93]">
            To
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className={`${control} mt-1 block`}
            />
          </label>
          {filtersActive && (
            <button
              type="button"
              onClick={resetFilters}
              className={`rounded-lg px-2 py-2 text-sm font-semibold text-[#1d5fe0] hover:underline ${focusRing}`}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* body: loading / error / empty / table */}
        {showSkeleton ? (
          <TableSkeleton rows={Math.min(perPage, 8)} />
        ) : error ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="rounded-2xl bg-[#ffe9ec] p-4 text-[#e5484d]">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#1c2740]">
              Couldn&apos;t load shifts
            </h3>
            <p className="mt-1 max-w-sm text-sm text-[#6c7a93]">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className={`${primaryBtn} mt-5 ${focusRing}`}
            >
              Try again
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-20 text-center">
            <div className="rounded-2xl bg-[#e8f0ff] p-4 text-[#2f6fe8]">
              <Clock className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#1c2740]">
              {filtersActive ? "No shifts match your filters" : "No shifts yet"}
            </h3>
            <p className="mt-1 max-w-xs text-sm text-[#6c7a93]">
              {filtersActive
                ? "Try a different date range or clear the filters."
                : "Shifts appear here after a cashier opens one in POS."}
            </p>
            {filtersActive && (
              <button
                type="button"
                onClick={resetFilters}
                className={`${primaryBtn} mt-5 ${focusRing}`}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              className={`overflow-x-auto transition-opacity ${
                fetching ? "opacity-60" : ""
              }`}
            >
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-y border-[#f0f3f9] bg-[#f8faff] text-xs uppercase tracking-wide text-[#7d8aa1]">
                    <th className="px-5 py-3 font-bold">Cashier</th>
                    <th className="px-3 py-3 font-bold">Opened</th>
                    <th className="px-3 py-3 font-bold">Closed</th>
                    <th className="px-3 py-3 text-right font-bold">Opening</th>
                    <th className="px-3 py-3 text-right font-bold">Expected</th>
                    <th className="px-3 py-3 text-right font-bold">Counted</th>
                    <th className="px-3 py-3 text-right font-bold">
                      Difference
                    </th>
                    <th className="px-3 py-3 font-bold">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-[#f0f3f9] last:border-0 hover:bg-[#fafcff]"
                    >
                      <td className="px-5 py-3.5 font-bold text-[#1c2740]">
                        {s.user?.name ?? "-"}
                      </td>
                      <td className="px-3 py-3.5 text-[#3d4a63]">
                        {fmt(s.opened_at)}
                      </td>
                      <td className="px-3 py-3.5 text-[#3d4a63]">
                        {fmt(s.closed_at)}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-[#1c2740]">
                        {money(Number(s.opening_cash))}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-[#1c2740]">
                        {s.expected_cash === null
                          ? "-"
                          : money(s.expected_cash)}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-[#1c2740]">
                        {s.closing_cash === null ? "-" : money(s.closing_cash)}
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <DiffText value={s.difference} />
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusPill status={s.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          aria-label={`View shift ${s.id}`}
                          onClick={() => setViewing(s.id)}
                          className={`rounded-md p-1.5 text-[#7d8aa1] hover:bg-[#eef4ff] hover:text-[#1d5fe0] ${focusRing}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              lastPage={meta.last_page}
              perPage={perPage}
              total={meta.total}
              from={meta.from}
              to={meta.to}
              onPage={setPage}
              onPerPage={setPerPage}
            />
          </>
        )}
      </section>

      {viewing !== null && (
        <ShiftDetailModal id={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}

/* ------------------------- detail modal ------------------------- */

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm text-[#8a96ab]">
      <span>{label}</span>
      <span
        className={`text-right tabular-nums ${
          strong ? "font-extrabold text-[#1c2740]" : "font-bold text-[#1c2740]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ShiftDetailModal({
  id,
  onClose,
}: {
  id: number;
  onClose: () => void;
}) {
  const [shift, setShift] = useState<Shift | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    ShiftService.getById(id, controller.signal)
      .then((res) => {
        if (!cancelled) setShift(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(parseApiError(err).message);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [id]);

  const sm = shift?.summary;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1c2740]/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shift details"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[#1c2740]">Shift #{id}</h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className={`rounded-md p-1 text-[#9aa5b8] hover:bg-[#f4f7fc] ${focusRing}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-lg bg-[#ffe9ec] px-3 py-2 text-sm text-[#e5484d]"
          >
            {error}
          </p>
        ) : !shift ? (
          <div className="flex justify-center py-10 text-[#9aa5b8]">
            <LoaderCircle className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2 rounded-xl bg-[#f4f7fc] p-4">
              <Row label="Cashier" value={shift.user?.name ?? "-"} />
              <Row label="Opened" value={fmt(shift.opened_at)} />
              <Row label="Closed" value={fmt(shift.closed_at)} />
              <div className="flex items-center justify-between text-sm text-[#8a96ab]">
                <span>Status</span>
                <StatusPill status={shift.status} />
              </div>
            </div>

            {sm && (
              <div className="space-y-2 rounded-xl bg-[#f4f7fc] p-4">
                <Row
                  label="Opening cash"
                  value={money(Number(shift.opening_cash))}
                />
                <Row label="Cash sales" value={money(sm.cash_sales)} />
                <Row
                  label="Cash refunds"
                  value={`- ${money(sm.cash_refunds)}`}
                />
                <div className="border-t border-[#dfe6f2] pt-2">
                  <Row
                    label="Expected cash"
                    value={money(sm.expected_cash)}
                    strong
                  />
                </div>
                {shift.closing_cash !== null && (
                  <>
                    <Row label="Counted" value={money(shift.closing_cash)} />
                    <div className="flex justify-between text-sm text-[#8a96ab]">
                      <span>Difference</span>
                      <DiffText value={shift.difference} />
                    </div>
                  </>
                )}
                <div className="space-y-2 border-t border-[#dfe6f2] pt-2">
                  <Row label="Sales" value={`${sm.sales_count}`} />
                  <Row label="Sales total" value={money(sm.sales_total)} />
                  {Object.entries(sm.by_method).map(([m, v]) => (
                    <Row key={m} label={m.toUpperCase()} value={money(v)} />
                  ))}
                </div>
              </div>
            )}

            {shift.note && (
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#7d8aa1]">
                  Note
                </p>
                <p className="whitespace-pre-line rounded-xl bg-[#f4f7fc] p-3 text-sm text-[#1c2740]">
                  {shift.note}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-[#6c7a93] hover:bg-[#f4f7fc] ${focusRing}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
