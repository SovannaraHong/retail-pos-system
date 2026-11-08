"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Pencil,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { ExpenseService, type ExpenseQuery } from "@/services/expense-service";
import type { PaginationMeta } from "@/services/product-service";
import type { Expense } from "@/types/expense";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { parseApiError } from "@/libs/api-error";
import { focusRing, money } from "@/libs/format";
import { ConfirmDelete } from "@/shared/confirm-delete";
import { Pagination } from "@/shared/pagination";
import { PageSkeleton, TableSkeleton } from "@/shared/page-skeleton";
import { ExpenseModal } from "./expense-modal";

type View = "active" | "deleted";

// ---- settings ----
const DEFAULT_PER_PAGE = 10;
const SEARCH_DELAY_MS = 400; // wait after typing before searching
const TOAST_MS = 2800; // how long a toast stays

const TABS: { key: View; label: string }[] = [
  { key: "active", label: "Expenses" },
  { key: "deleted", label: "Deleted" },
];

// ---- styles ----
const card =
  "rounded-2xl border border-[#e9eef7] bg-white shadow-[0_1px_3px_rgba(30,60,120,0.05)]";
const control =
  "h-10 rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] px-3 text-sm text-[#1c2740] focus:border-[#2f6fe8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6fe8]/20";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#2f6fe8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d5fe0]";

const fmtDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export function ExpensesView() {
  const router = useRouter();
  const { ready, can } = useAuth();

  const canView = can("expenses.view");
  const canCreate = can("expenses.create");
  const canDelete = can("expenses.delete");

  useEffect(() => {
    if (ready && !canView) router.replace("/forbidden");
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const [view, setView] = useState<View>("active");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const debouncedSearch = useDebounce(search, SEARCH_DELAY_MS);

  const filterKey = `${view}|${debouncedSearch}|${category}|${dateFrom}|${dateTo}|${perPage}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (p: number) => setPageState({ key: filterKey, page: p });

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  const [result, setResult] = useState<{
    key: string | null;
    rows: Expense[];
    meta: {
      last_page: number;
      total: number;
      from: number | null;
      to: number | null;
    };
    totalAmount: number;
    error: string | null;
  }>({
    key: null,
    rows: [],
    meta: { last_page: 1, total: 0, from: null, to: null },
    totalAmount: 0,
    error: null,
  });

  const params = useMemo<ExpenseQuery>(
    () => ({
      page,
      per_page: perPage,
      search: debouncedSearch.trim() || undefined,
      category: category || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      only_trashed: view === "deleted" ? true : undefined,
    }),
    [page, perPage, debouncedSearch, category, dateTo, dateFrom, view],
  );
  const requestKey = `${JSON.stringify(params)}#${reloadKey}`;
  const { rows, meta, totalAmount } = result;
  const firstLoad = result.key === null;
  const fetching = result.key !== requestKey;
  const error = fetching ? null : result.error;
  const showSkeleton = firstLoad || (fetching && result.error !== null);

  const [categories, setCategories] = useState<string[]>([]);

  const [modal, setModal] = useState<{ expense: Expense | null } | null>(null);
  const [toDelete, setToDelete] = useState<Expense | null>(null); // STEP 7
  const [deleting, setDeleting] = useState(false); // STEP 7
  const [toast, setToast] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  //   const [toDelete,setToDelete]=useState<{expense:Expense}|null>(null)
  // const [deleting,setDeleting]=useState(false);
  useEffect(() => {
    if (!ready || !canView) return;
    let cancelled = false; // true when a newer request replaced this one
    ExpenseService.getAll(params)

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
          totalAmount: Number(res.summary?.total_amount) || 0,
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
    };
  }, [ready, canView, params, reloadKey, requestKey]);

  useEffect(() => {
    if (!ready || !canView) return;
    let cancelled = false;

    ExpenseService.categories()
      .then((res) => {
        if (!cancelled) setCategories(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ready, canView, reloadKey]);

  function afterRemove() {
    if (rows.length <= 1 && page > 1) setPage(page - 1);
    else reload();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await ExpenseService.delete(toDelete.id);
      setToast({ type: "ok", text: "Expense deleted" });
      setToDelete(null);
      afterRemove();
    } catch (err) {
      setToast({ type: "error", text: parseApiError(err).message });
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  }
  async function restore(e: Expense) {
    setRestoringId(e.id);
    try {
      await ExpenseService.restore(e.id);
      setToast({ type: "ok", text: "Expense restored" });
      afterRemove();
    } catch (err) {
      setToast({ type: "error", text: parseApiError(err).message });
    } finally {
      setRestoringId(null);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);
  const filtersActive =
    search !== "" || category !== "" || dateFrom !== "" || dateTo !== "";
  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setDateFrom("");
    setDateTo("");
  };

  if (!ready) return <PageSkeleton />;
  if (!canView) return null;

  const showActions = view === "deleted" ? canDelete : canCreate || canDelete;
  return (
    <div className="w-full space-y-5">
      {/* ---------- header ---------- */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-[#7d8aa1]">
            <span>Management</span>
            <span>/</span>
            <span className="font-semibold text-[#1d5fe0]">Expenses</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#1c2740]">
            Expenses
          </h2>
          <p className="mt-1 text-sm text-[#6c7a93]">
            {firstLoad
              ? "Loading expenses…"
              : `${meta.total} ${meta.total === 1 ? "expense" : "expenses"} found`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* STEP 8: total of ALL rows that match the filters (not only this page) */}
          {!firstLoad && !error && (
            <div className="rounded-xl border border-[#e9eef7] bg-white px-4 py-2 text-right shadow-[0_1px_3px_rgba(30,60,120,0.05)]">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#7d8aa1]">
                {filtersActive ? "Total (filtered)" : "Total"}
              </p>
              <p className="text-lg font-extrabold tabular-nums text-[#1c2740]">
                {money(totalAmount)}
              </p>
            </div>
          )}

          {/* STEP 6: add button */}
          {canCreate && view === "active" && (
            <button
              type="button"
              onClick={() => setModal({ expense: null })}
              className={`${primaryBtn} ${focusRing}`}
            >
              <Plus className="h-4 w-4" />
              Add expense
            </button>
          )}
        </div>
      </header>
      <section className={`${card} overflow-hidden`}>
        <div
          className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-[#f0f3f9] px-4 pt-2"
          role="tablist"
          aria-label="Expense view"
        >
          {TABS.map((t) => {
            const active = view === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setView(t.key)}
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

        {/* ---------- STEP 4: toolbar (search, category, dates) ---------- */}
        <div className="flex flex-wrap items-end gap-3 px-5 py-4">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8aa1]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in notes"
              aria-label="Search expenses"
              className={`${control} w-full pl-9`}
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Category"
            className={control}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

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

        {showSkeleton ? (
          <TableSkeleton rows={Math.min(perPage, 8)} />
        ) : error ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="rounded-2xl bg-[#ffe9ec] p-4 text-[#e5484d]">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#1c2740]">
              Couldn&apos;t load expenses
            </h3>
            <p className="mt-1 max-w-sm text-sm text-[#6c7a93]">{error}</p>
            <button
              type="button"
              onClick={reload}
              className={`${primaryBtn} mt-5 ${focusRing}`}
            >
              Try again
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-20 text-center">
            <div className="rounded-2xl bg-[#e8f0ff] p-4 text-[#2f6fe8]">
              <Receipt className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#1c2740]">
              {filtersActive
                ? "No expenses match your filters"
                : view === "deleted"
                  ? "No deleted expenses"
                  : "No expenses yet"}
            </h3>
            <p className="mt-1 max-w-xs text-sm text-[#6c7a93]">
              {filtersActive
                ? "Try a different search or clear the filters."
                : view === "deleted"
                  ? "Deleted expenses appear here, and you can restore them."
                  : "Record rent, electricity, salary and other costs here."}
            </p>
            {filtersActive ? (
              <button
                type="button"
                onClick={resetFilters}
                className={`${primaryBtn} mt-5 ${focusRing}`}
              >
                Clear filters
              </button>
            ) : (
              canCreate &&
              view === "active" && (
                <button
                  type="button"
                  onClick={() => setModal({ expense: null })}
                  className={`${primaryBtn} mt-5 ${focusRing}`}
                >
                  Add expense
                </button>
              )
            )}
          </div>
        ) : (
          <>
            <div
              className={`overflow-x-auto transition-opacity ${fetching ? "opacity-60" : ""}`}
            >
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-y border-[#f0f3f9] bg-[#f8faff] text-xs uppercase tracking-wide text-[#7d8aa1]">
                    <th className="px-5 py-3 font-bold">Date</th>
                    <th className="px-3 py-3 font-bold">Category</th>
                    <th className="px-3 py-3 font-bold">Note</th>
                    <th className="px-3 py-3 font-bold">Recorded by</th>
                    <th className="px-3 py-3 text-right font-bold">Amount</th>
                    {showActions && <th className="px-5 py-3" />}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-[#f0f3f9] last:border-0 hover:bg-[#fafcff]"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 text-[#3d4a63]">
                        {fmtDate(e.expense_date)}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-xs font-bold text-[#1d5fe0]">
                          {e.category}
                        </span>
                      </td>
                      <td className="max-w-[280px] truncate px-3 py-3.5 text-[#6c7a93]">
                        {e.note || "-"}
                      </td>
                      <td className="px-3 py-3.5 text-[#3d4a63]">
                        {e.recorded_by?.name ?? "-"}
                      </td>
                      <td className="px-3 py-3.5 text-right font-bold tabular-nums text-[#1c2740]">
                        {money(Number(e.amount))}
                      </td>
                      {showActions && (
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-1">
                            {view === "active" ? (
                              <>
                                {canCreate && (
                                  <button
                                    type="button"
                                    aria-label={`Edit expense ${e.id}`}
                                    onClick={() => setModal({ expense: e })} // STEP 6
                                    className={`rounded-md p-1.5 text-[#7d8aa1] hover:bg-[#eef4ff] hover:text-[#1d5fe0] ${focusRing}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    type="button"
                                    aria-label={`Delete expense ${e.id}`}
                                    onClick={() => setToDelete(e)} // STEP 7
                                    className={`rounded-md p-1.5 text-[#7d8aa1] hover:bg-[#ffe9ec] hover:text-[#e5484d] ${focusRing}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </>
                            ) : (
                              canDelete && (
                                <button
                                  type="button"
                                  disabled={restoringId === e.id}
                                  onClick={() => restore(e)} // STEP 7
                                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#1d5fe0] hover:bg-[#eef4ff] disabled:opacity-50 ${focusRing}`}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Restore
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      )}
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
      {toast && (
        <div
          role="status"
          className={`fixed right-6 top-6 z-[80] rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            toast.type === "ok" ? "bg-[#1f9d55]" : "bg-[#e5484d]"
          }`}
        >
          {toast.text}
        </div>
      )}
      {modal && (
        <ExpenseModal
          key={modal.expense?.id ?? "new"}
          expense={modal.expense}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={(mode) => {
            setToast({
              type: "ok",
              text: mode === "created" ? "Expense  added" : "Expense updated",
            });
            if (mode === "created") setPage(1);
            reload();
          }}
        />
      )}
      {toDelete && (
        <ConfirmDelete
          count={1}
          name={`${toDelete.category} (${money(Number(toDelete.amount))})`}
          busy={deleting}
          onCancel={() => setToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
