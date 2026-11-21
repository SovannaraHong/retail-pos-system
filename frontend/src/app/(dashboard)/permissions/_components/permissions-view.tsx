"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, KeyRound, Plus, Search, Trash2 } from "lucide-react";
import {
  PermissionService,
  type PaginationMeta,
} from "@/services/permission-service";
import { isProtectedPermission, type Permission } from "@/types/permission";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { parseApiError } from "@/libs/api-error";
import { focusRing } from "@/libs/format";
// NOTE: adjust these to your real alias path (same as products-view)
import { ConfirmDelete } from "@/shared/confirm-delete";
import { Pagination } from "@/shared/pagination";
import { PageSkeleton, TableSkeleton } from "@/shared/page-skeleton";
import { PermissionDrawer } from "./permission-drawer";
import { PermissionTable } from "./permission-table";

/** What the delete dialog needs: rows from other pages are only known by id. */
type DeleteTarget = { id: number; name: string };

// ---- settings ----
const DEFAULT_PER_PAGE = 10;
const SEARCH_DELAY_MS = 400; // wait after typing before searching
const TOAST_MS = 2800; // how long a toast stays
const TOAST_ERROR_MS = 5000; // errors carry a server message, keep them longer
const MAX_SKELETON_ROWS = 8;

// ---- styles ----
const card =
  "rounded-2xl border border-[#e9eef7] bg-white shadow-[0_1px_3px_rgba(30,60,120,0.05)]";

const control =
  "h-10 rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] px-3 text-sm text-[#1c2740] focus:border-[#2f6fe8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6fe8]/20";

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#2f6fe8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d5fe0]";

const NO_SELECTION: Set<number> = new Set();

export function PermissionsView() {
  const router = useRouter();
  const { ready, can } = useAuth();

  // ---- filters ----
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, SEARCH_DELAY_MS);

  // page belongs to one set of filters: when a filter changes, the key changes
  // and the page goes back to 1 automatically (no effect needed)
  const filterKey = `${debouncedSearch}|${perPage}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (p: number) => setPageState({ key: filterKey, page: p });

  // selection belongs to one set of filters too: changing a filter clears it,
  // so you can never delete rows that are no longer visible by accident
  const [selection, setSelection] = useState<{
    key: string;
    ids: Set<number>;
  }>({ key: filterKey, ids: new Set() });
  const selected = selection.key === filterKey ? selection.ids : NO_SELECTION;
  const updateSelected = (fn: (s: Set<number>) => Set<number>) =>
    setSelection((cur) => ({
      key: filterKey,
      ids: fn(cur.key === filterKey ? cur.ids : new Set()),
    }));

  // ---- data ----
  // reloadKey: change it to refetch the list
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  // one object, so "loading" is worked out from it instead of stored
  const [result, setResult] = useState<{
    key: string | null; // which request this result belongs to
    rows: Permission[];
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
    }),
    [page, perPage, debouncedSearch],
  );
  const requestKey = `${JSON.stringify(params)}#${reloadKey}`;

  const { rows, meta } = result;
  const firstLoad = result.key === null;
  const fetching = result.key !== requestKey; // a newer request is running
  const error = fetching ? null : result.error;
  const showSkeleton = firstLoad || (fetching && result.error !== null);

  // ---- ui ----
  const [drawer, setDrawer] = useState<{
    permission: Permission | null;
  } | null>(null);
  const [toDelete, setToDelete] = useState<DeleteTarget[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  const closeDrawer = useCallback(() => setDrawer(null), []);

  // no permission -> go to /forbidden
  useEffect(() => {
    if (ready && !can("permissions.view")) router.replace("/forbidden");
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const canView = can("permissions.view");

  // fetch the list (state is only set inside the promise callbacks)
  useEffect(() => {
    if (!ready || !canView) return;

    let cancelled = false; // true when a newer request replaced this one

    PermissionService.getAll(params)
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
    const t = setTimeout(
      () => setToast(null),
      toast.type === "error" ? TOAST_ERROR_MS : TOAST_MS,
    );
    return () => clearTimeout(t);
  }, [toast]);

  const filtersActive = search !== "";
  const resetFilters = () => setSearch("");

  // select / unselect one row
  const toggleRow = (id: number) =>
    updateSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // select / unselect every changeable row on this page (system rows are skipped)
  const togglePage = () =>
    updateSelected((s) => {
      const n = new Set(s);
      const ids = rows
        .filter((p) => !isProtectedPermission(p))
        .map((p) => p.id);
      const all = ids.length > 0 && ids.every((id) => n.has(id));
      ids.forEach((id) => (all ? n.delete(id) : n.add(id)));
      return n;
    });

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);

    const results = await Promise.allSettled(
      toDelete.map((p) => PermissionService.delete(p.id)),
    );
    const rejected = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    const failed = rejected.length;
    const okCount = toDelete.length - failed;

    // unselect only the ones that were really deleted
    updateSelected((s) => {
      const n = new Set(s);
      toDelete.forEach(
        (p, i) => results[i].status === "fulfilled" && n.delete(p.id),
      );
      return n;
    });

    setDeleting(false);
    setToDelete(null);

    if (failed) {
      // the API explains why (e.g. "in use by 2 roles"): show the first reason
      const reason = parseApiError(rejected[0].reason).message;
      setToast({
        type: "error",
        text:
          toDelete.length === 1
            ? reason
            : `${failed} could not be deleted. ${reason}`,
      });
    } else {
      setToast({
        type: "ok",
        text:
          okCount === 1
            ? "Permission deleted"
            : `${okCount} permissions deleted`,
      });
    }

    // deleted the whole last page -> go back one page
    if (okCount >= rows.length && page > 1) setPage(page - 1);
    else reload();
  }

  if (!ready) return <PageSkeleton />;
  if (!can("permissions.view")) return null; // redirecting to /forbidden

  const canCreate = can("permissions.create");
  const canUpdate = can("permissions.update");
  const canDelete = can("permissions.delete");

  // how many selected permissions are not on the page you are looking at
  const offPageCount =
    selected.size - rows.filter((p) => selected.has(p.id)).length;

  return (
    <div className="w-full space-y-5">
      {/* header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-[#7d8aa1]">
            <span>Management</span>
            <span>/</span>
            <span className="font-semibold text-[#1d5fe0]">Permissions</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#1c2740]">
            Permissions
          </h2>
          <p className="mt-1 text-sm text-[#6c7a93]">
            {firstLoad
              ? "Loading permissions…"
              : `${meta.total} ${meta.total === 1 ? "permission" : "permissions"} defined`}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setDrawer({ permission: null })}
            className={`${primaryBtn} ${focusRing}`}
          >
            <Plus className="h-4 w-4" />
            Add permission
          </button>
        )}
      </header>

      <section className={`${card} overflow-hidden`}>
        {/* toolbar: search */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8aa1]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, e.g. products"
              aria-label="Search permissions"
              className={`${control} w-full pl-9`}
            />
          </div>

          {filtersActive && (
            <button
              type="button"
              onClick={resetFilters}
              className={`rounded-lg px-2 py-2 text-sm font-semibold text-[#1d5fe0] hover:underline ${focusRing}`}
            >
              Clear search
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
              Couldn&apos;t load permissions
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
              <KeyRound className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#1c2740]">
              {filtersActive
                ? "No permissions match your search"
                : "No permissions yet"}
            </h3>
            <p className="mt-1 max-w-xs text-sm text-[#6c7a93]">
              {filtersActive
                ? "Try a different search or clear it."
                : "Add your first permission, e.g. products.view."}
            </p>
            {(filtersActive || canCreate) && (
              <button
                type="button"
                onClick={
                  filtersActive
                    ? resetFilters
                    : () => setDrawer({ permission: null })
                }
                className={`${primaryBtn} mt-5 ${focusRing}`}
              >
                {filtersActive ? "Clear search" : "Add permission"}
              </button>
            )}
          </div>
        ) : (
          <>
            <PermissionTable
              permissions={rows}
              selected={selected}
              busy={fetching}
              canEdit={canUpdate}
              canDelete={canDelete}
              onToggle={toggleRow}
              onTogglePage={togglePage}
              onEdit={(p) => setDrawer({ permission: p })}
              onDelete={(p) => setToDelete([{ id: p.id, name: p.name }])}
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
            <span className="tabular-nums">
              {selected.size} selected
              {offPageCount > 0 && (
                <span className="text-slate-300">
                  {" "}
                  ({offPageCount} on other pages)
                </span>
              )}
            </span>
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
                    ...known.map((p) => ({ id: p.id, name: p.name })),
                    ...missing.map((id) => ({ id, name: `#${id}` })),
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
              onClick={() => updateSelected(() => new Set())}
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
          className={`fixed right-6 top-6 z-[60] max-w-sm rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${toast.type === "ok" ? "bg-[#1f9d55]" : "bg-[#e5484d]"}`}
        >
          {toast.text}
        </div>
      )}

      {drawer && (
        <PermissionDrawer
          key={drawer.permission?.id ?? "new"}
          permission={drawer.permission}
          onClose={closeDrawer}
          onSaved={(mode) => {
            // the drawer slides out by itself, then calls onClose above
            setToast({
              type: "ok",
              text:
                mode === "created" ? "Permission added" : "Permission updated",
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
