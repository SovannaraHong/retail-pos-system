"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Plus, Search, Trash2, Truck } from "lucide-react";
import {
  SupplierService,
  type PaginationMeta,
} from "@/services/supplier-service";
import type { Supplier } from "@/types/supplier";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { parseApiError } from "@/libs/api-error";
import { focusRing } from "@/libs/format";

import { SupplierDetailModal } from "./supplier-detail-modal";
import { SupplierDrawer } from "./supplier-drawer";
import { SupplierTable } from "./supplier-table";
import { PageSkeleton, TableSkeleton } from "@/shared/page-skeleton";
import { Pagination } from "@/shared/pagination";
import { ConfirmDelete } from "@/shared/confirm-delete";

type StatusFilter = "all" | "active" | "inactive";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DELAY_MS = 400;
const TOAST_MS = 2800;
const MAX_SKELETON_ROWS = 8;

const TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All suppliers" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

const card =
  "rounded-2xl border border-[#e9eef7] bg-white shadow-[0_1px_3px_rgba(30,60,120,0.05)]";
const control =
  "h-10 rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] px-3 text-sm text-[#1c2740] focus:border-[#2f6fe8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6fe8]/20";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#2f6fe8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d5fe0]";

export function SuppliersView() {
  const router = useRouter();
  const { ready, can } = useAuth();

  // ---- filters ----
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const debouncedSearch = useDebounce(search, SEARCH_DELAY_MS);

  const filterKey = `${debouncedSearch}|${status}|${perPage}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (p: number) => setPageState({ key: filterKey, page: p });

  // ---- data ----
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  const [result, setResult] = useState<{
    key: string | null;
    rows: Supplier[];
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

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: debouncedSearch.trim() || undefined,
      is_active: status === "all" ? undefined : status === "active",
    }),
    [page, perPage, debouncedSearch, status],
  );
  const requestKey = `${JSON.stringify(params)}#${reloadKey}`;

  const { rows, meta } = result;
  const firstLoad = result.key === null;
  const fetching = result.key !== requestKey;
  const error = fetching ? null : result.error;
  const showSkeleton = firstLoad || (fetching && result.error !== null);

  // ---- ui ----
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [viewing, setViewing] = useState<Supplier | null>(null);
  const [drawer, setDrawer] = useState<{ supplier: Supplier | null } | null>(
    null,
  );
  const [toDelete, setToDelete] = useState<Supplier[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (ready && !can("suppliers.view")) router.replace("/forbidden");
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const canView = can("suppliers.view");

  useEffect(() => {
    if (!ready || !canView) return;
    let cancelled = false;

    SupplierService.getAll(params)
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
    };
  }, [ready, canView, params, requestKey]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  const filtersActive = search !== "" || status !== "all";
  const resetFilters = () => {
    setSearch("");
    setStatus("all");
  };

  const toggleRow = (id: number) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const togglePage = () =>
    setSelected((s) => {
      const n = new Set(s);
      const all = rows.length > 0 && rows.every((x) => n.has(x.id));
      rows.forEach((x) => (all ? n.delete(x.id) : n.add(x.id)));
      return n;
    });

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);

    const results = await Promise.allSettled(
      toDelete.map((s) => SupplierService.delete(s.id)),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    const okCount = toDelete.length - failed;

    setSelected((s) => {
      const n = new Set(s);
      toDelete.forEach(
        (x, i) => results[i].status === "fulfilled" && n.delete(x.id),
      );
      return n;
    });

    setDeleting(false);
    setToDelete(null);

    if (failed) {
      setToast({
        type: "error",
        text: `${failed} could not be deleted. A supplier that still has products may be blocked.`,
      });
    } else {
      setToast({
        type: "ok",
        text:
          okCount === 1 ? "Supplier deleted" : `${okCount} suppliers deleted`,
      });
    }

    if (okCount >= rows.length && page > 1) setPage(page - 1);
    else reload();
  }

  if (!ready) return <PageSkeleton />;
  if (!can("suppliers.view")) return null;

  const canCreate = can("suppliers.create");
  const canUpdate = can("suppliers.update");
  const canDelete = can("suppliers.delete");

  return (
    <div className="w-full space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-[#7d8aa1]">
            <span>Management</span>
            <span>/</span>
            <span className="font-semibold text-[#1d5fe0]">Suppliers</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#1c2740]">
            Suppliers
          </h2>
          <p className="mt-1 text-sm text-[#6c7a93]">
            {firstLoad
              ? "Loading your suppliers…"
              : `${meta.total} ${meta.total === 1 ? "supplier" : "suppliers"} in your store`}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setDrawer({ supplier: null })}
            className={`${primaryBtn} ${focusRing}`}
          >
            <Plus className="h-4 w-4" />
            Add supplier
          </button>
        )}
      </header>

      <section className={`${card} overflow-hidden`}>
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

        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8aa1]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone or email"
              aria-label="Search suppliers"
              className={`${control} w-full pl-9`}
            />
          </div>

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
          <TableSkeleton rows={Math.min(perPage, MAX_SKELETON_ROWS)} />
        ) : error ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="rounded-2xl bg-[#ffe9ec] p-4 text-[#e5484d]">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#1c2740]">
              Couldn&apos;t load suppliers
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
              <Truck className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#1c2740]">
              {filtersActive
                ? "No suppliers match your filters"
                : "No suppliers yet"}
            </h3>
            <p className="mt-1 max-w-xs text-sm text-[#6c7a93]">
              {filtersActive
                ? "Try a different search or clear the filters."
                : "Add your first supplier to track where your products come from."}
            </p>
            {(filtersActive || canCreate) && (
              <button
                type="button"
                onClick={
                  filtersActive
                    ? resetFilters
                    : () => setDrawer({ supplier: null })
                }
                className={`${primaryBtn} mt-5 ${focusRing}`}
              >
                {filtersActive ? "Clear filters" : "Add supplier"}
              </button>
            )}
          </div>
        ) : (
          <>
            <SupplierTable
              suppliers={rows}
              selected={selected}
              busy={fetching}
              canEdit={canUpdate}
              canDelete={canDelete}
              onView={setViewing}
              onToggle={toggleRow}
              onTogglePage={togglePage}
              onEdit={(s) => setDrawer({ supplier: s })}
              onDelete={(s) => setToDelete([s])}
            />
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

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="flex items-center gap-4 rounded-xl bg-[#1c2740] py-2.5 pl-5 pr-2.5 text-sm text-white shadow-2xl">
            <span className="tabular-nums">{selected.size} selected</span>
            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  const known = rows.filter((s) => selected.has(s.id));
                  const missing = Array.from(selected).filter(
                    (id) => !known.some((s) => s.id === id),
                  );
                  setToDelete([
                    ...known,
                    ...missing.map(
                      (id) => ({ id, name: `#${id}` }) as Supplier,
                    ),
                  ]);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg bg-[#e5484d] px-3 py-1.5 font-medium hover:bg-[#cf3a3f] ${focusRing}`}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className={`rounded-lg px-3 py-1.5 font-medium text-slate-300 hover:bg-white/10 hover:text-white ${focusRing}`}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed right-6 top-6 z-[60] rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${toast.type === "ok" ? "bg-[#1f9d55]" : "bg-[#e5484d]"}`}
        >
          {toast.text}
        </div>
      )}

      {viewing && (
        <SupplierDetailModal
          supplier={viewing}
          canEdit={canUpdate}
          onClose={() => setViewing(null)}
          onEdit={(s) => {
            setViewing(null);
            setDrawer({ supplier: s });
          }}
        />
      )}

      {drawer && (
        <SupplierDrawer
          key={drawer.supplier?.id ?? "new"}
          supplier={drawer.supplier}
          onClose={() => setDrawer(null)}
          onSaved={(mode) => {
            setToast({
              type: "ok",
              text: mode === "created" ? "Supplier added" : "Supplier updated",
            });
            if (mode === "created") setPage(1);
            reload();
          }}
        />
      )}

      {toDelete && (
        <ConfirmDelete
          count={toDelete.length}
          name={toDelete[0]?.name}
          noun="supplier"
          busy={deleting}
          onCancel={() => setToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
