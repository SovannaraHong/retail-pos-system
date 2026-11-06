"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, PackageSearch, Plus, Search, Trash2 } from "lucide-react";
import {
  ProductService,
  type PaginationMeta,
} from "@/services/product-service";
import type { Product } from "@/types/product";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { useProductLookups } from "@/hooks/use-product-lookups";
import { parseApiError } from "@/libs/api-error";
import { focusRing } from "@/libs/format";
import { ConfirmDelete } from "../../../../shared/confirm-delete";
import { Pagination } from "../../../../shared/pagination";
import { ProductDrawer } from "./product-drawer";
import { PageSkeleton, TableSkeleton } from "../../../../shared/page-skeleton";
import { ProductTable } from "./product-table";
import { ProductDetailModal } from "./product-detail-modal";

type StatusFilter = "all" | "active" | "inactive";

// ---- settings ----
const DEFAULT_PER_PAGE = 10;
const SEARCH_DELAY_MS = 400; // wait after typing before searching
const TOAST_MS = 2800; // how long a toast stays
const MAX_SKELETON_ROWS = 8;

const TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All products" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

// ---- styles ----
const card =
  "rounded-2xl border border-[#e9eef7] bg-white shadow-[0_1px_3px_rgba(30,60,120,0.05)]";

const control =
  "h-10 rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] px-3 text-sm text-[#1c2740] focus:border-[#2f6fe8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6fe8]/20";

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#2f6fe8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d5fe0]";

export function ProductsView() {
  const router = useRouter();
  const { ready, can } = useAuth();
  const lookups = useProductLookups();

  // ---- filters ----
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [categoryId, setCategoryId] = useState("");
  const debouncedSearch = useDebounce(search, SEARCH_DELAY_MS);

  // page belongs to one set of filters: when a filter changes, the key changes
  // and the page goes back to 1 automatically (no effect needed)
  const filterKey = `${debouncedSearch}|${categoryId}|${status}|${perPage}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (p: number) => setPageState({ key: filterKey, page: p });

  // ---- data ----
  // reloadKey: change it to refetch the list
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  // one object, so "loading" is worked out from it instead of stored
  const [result, setResult] = useState<{
    key: string | null; // which request this result belongs to
    rows: Product[];
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
      category_id: categoryId ? Number(categoryId) : undefined,
      is_active: status === "all" ? undefined : status === "active",
    }),
    [page, perPage, debouncedSearch, categoryId, status],
  );
  const requestKey = `${JSON.stringify(params)}#${reloadKey}`;

  const { rows, meta } = result;
  const firstLoad = result.key === null;
  const fetching = result.key !== requestKey; // a newer request is running
  const error = fetching ? null : result.error;
  const showSkeleton = firstLoad || (fetching && result.error !== null);

  // ---- ui ----
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [drawer, setDrawer] = useState<{ product: Product | null } | null>(
    null,
  );
  const [viewing, setViewing] = useState<Product | null>(null);
  const [toDelete, setToDelete] = useState<Product[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  // no permission -> go to /forbidden
  useEffect(() => {
    if (ready && !can("products.view")) router.replace("/forbidden");
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const canView = can("products.view");

  // fetch the list (state is only set inside the promise callbacks)
  useEffect(() => {
    if (!ready || !canView) return;

    let cancelled = false; // true when a newer request replaced this one

    ProductService.getAll(params)
      .then((res) => {
        if (cancelled) return;
        // pagination can be flat (res.total) or nested (res.meta.total)
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

  // hide the toast after a short time
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  const filtersActive = search !== "" || status !== "all" || categoryId !== "";
  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setCategoryId("");
  };

  // select / unselect one row
  const toggleRow = (id: number) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // select / unselect every row on this page
  const togglePage = () =>
    setSelected((s) => {
      const n = new Set(s);
      const all = rows.length > 0 && rows.every((p) => n.has(p.id));
      rows.forEach((p) => (all ? n.delete(p.id) : n.add(p.id)));
      return n;
    });

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);

    const results = await Promise.allSettled(
      toDelete.map((p) => ProductService.delete(p.id)),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    const okCount = toDelete.length - failed;

    // unselect only the ones that were really deleted
    setSelected((s) => {
      const n = new Set(s);
      toDelete.forEach(
        (p, i) => results[i].status === "fulfilled" && n.delete(p.id),
      );
      return n;
    });

    setDeleting(false);
    setToDelete(null);

    if (failed) {
      setToast({
        type: "error",
        text: `${failed} could not be deleted. Try again.`,
      });
    } else {
      setToast({
        type: "ok",
        text: okCount === 1 ? "Product deleted" : `${okCount} products deleted`,
      });
    }

    // deleted the whole last page -> go back one page
    if (okCount >= rows.length && page > 1) setPage(page - 1);
    else reload();
  }

  if (!ready) return <PageSkeleton />;
  if (!can("products.view")) return null; // redirecting to /forbidden

  const canCreate = can("products.create");
  const canUpdate = can("products.update");
  const canDelete = can("products.delete");

  return (
    <div className="w-full space-y-5">
      {/* header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-[#7d8aa1]">
            <span>Management</span>
            <span>/</span>
            <span className="font-semibold text-[#1d5fe0]">Products</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#1c2740]">
            Products
          </h2>
          <p className="mt-1 text-sm text-[#6c7a93]">
            {firstLoad
              ? "Loading your products…"
              : `${meta.total} ${meta.total === 1 ? "product" : "products"} in your store`}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setDrawer({ product: null })}
            className={`${primaryBtn} ${focusRing}`}
          >
            <Plus className="h-4 w-4" />
            Add product
          </button>
        )}
      </header>

      <section className={`${card} overflow-hidden`}>
        {/* status tabs (overflow-y-hidden removes the stray vertical scrollbar) */}
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

        {/* toolbar: search and category */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8aa1]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU or barcode"
              aria-label="Search products"
              className={`${control} w-full pl-9`}
            />
          </div>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            aria-label="Category"
            className={control}
          >
            <option value="">All categories</option>
            {lookups.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

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
          <TableSkeleton rows={Math.min(perPage, MAX_SKELETON_ROWS)} />
        ) : error ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="rounded-2xl bg-[#ffe9ec] p-4 text-[#e5484d]">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#1c2740]">
              Couldn&apos;t load products
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
              <PackageSearch className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#1c2740]">
              {filtersActive
                ? "No products match your filters"
                : "No products yet"}
            </h3>
            <p className="mt-1 max-w-xs text-sm text-[#6c7a93]">
              {filtersActive
                ? "Try a different search or clear the filters."
                : "Add your first product to start selling."}
            </p>
            {(filtersActive || canCreate) && (
              <button
                type="button"
                onClick={
                  filtersActive
                    ? resetFilters
                    : () => setDrawer({ product: null })
                }
                className={`${primaryBtn} mt-5 ${focusRing}`}
              >
                {filtersActive ? "Clear filters" : "Add product"}
              </button>
            )}
          </div>
        ) : (
          <>
            <ProductTable
              products={rows}
              onView={setViewing}
              selected={selected}
              busy={fetching}
              canEdit={canUpdate}
              canDelete={canDelete}
              onToggle={toggleRow}
              onTogglePage={togglePage}
              onEdit={(p) => setDrawer({ product: p })}
              onDelete={(p) => setToDelete([p])}
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

      {/* bulk bar */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="flex items-center gap-4 rounded-xl bg-[#1c2740] py-2.5 pl-5 pr-2.5 text-sm text-white shadow-2xl">
            <span className="tabular-nums">{selected.size} selected</span>
            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  // rows from other pages are not loaded, so they are deleted by id only
                  const known = rows.filter((p) => selected.has(p.id));
                  const missing = Array.from(selected).filter(
                    (id) => !known.some((p) => p.id === id),
                  );
                  setToDelete([
                    ...known,
                    ...missing.map((id) => ({ id, name: `#${id}` }) as Product),
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

      {/* toast */}
      {toast && (
        <div
          role="status"
          className={`fixed right-6 top-6 z-[60] rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${toast.type === "ok" ? "bg-[#1f9d55]" : "bg-[#e5484d]"}`}
        >
          {toast.text}
        </div>
      )}
      {viewing && (
        <ProductDetailModal
          product={viewing}
          canEdit={canUpdate}
          onClose={() => setViewing(null)}
          onEdit={(p) => {
            setViewing(null);
            setDrawer({ product: p });
          }}
        />
      )}
      {drawer && (
        <ProductDrawer
          key={drawer.product?.id ?? "new"}
          product={drawer.product}
          categories={lookups.categories}
          brands={lookups.brands}
          suppliers={lookups.suppliers}
          onClose={() => setDrawer(null)}
          onSaved={(mode) => {
            // the drawer slides out by itself, then calls onClose above
            setToast({
              type: "ok",
              text: mode === "created" ? "Product added" : "Product updated",
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
          busy={deleting}
          onCancel={() => setToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
