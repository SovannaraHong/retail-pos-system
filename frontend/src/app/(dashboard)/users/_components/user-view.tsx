"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import type { PaginationMeta } from "@/services/product-service";
import { UserService } from "@/services/user-service";
import type { User } from "@/types/user";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { useRoles } from "@/hooks/use-roles";
import { parseApiError } from "@/libs/api-error";
import { focusRing } from "@/libs/format";
// NOTE: adjust these to your real alias path (same as products-view)
import { ConfirmDelete } from "@/shared/confirm-delete";
import { Pagination } from "@/shared/pagination";
import { PageSkeleton, TableSkeleton } from "@/shared/page-skeleton";
import { UserDrawer } from "./user-drawer";
import { UserTable } from "./user-table";

type StatusFilter = "all" | "active" | "inactive" | "trashed";

/** What the dialogs need: rows from other pages are only known by id. */
type Target = { id: number; name: string };

// ---- settings ----
const DEFAULT_PER_PAGE = 10;
const SEARCH_DELAY_MS = 400; // wait after typing before searching
const TOAST_MS = 2800; // how long a toast stays
const TOAST_ERROR_MS = 5000; // errors carry a server message, keep them longer
const MAX_SKELETON_ROWS = 8;

const TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All users" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "trashed", label: "Deleted" },
];

// ---- styles ----
const card =
  "rounded-2xl border border-[#e9eef7] bg-white shadow-[0_1px_3px_rgba(30,60,120,0.05)]";

const control =
  "h-10 rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] px-3 text-sm text-[#1c2740] focus:border-[#2f6fe8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6fe8]/20";

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#2f6fe8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d5fe0]";

const NO_SELECTION: Set<number> = new Set();

export function UsersView() {
  const router = useRouter();
  const { ready, can } = useAuth();
  const roles = useRoles();

  // ---- filters ----
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [roleId, setRoleId] = useState("");
  const debouncedSearch = useDebounce(search, SEARCH_DELAY_MS);
  const trashed = status === "trashed";

  // page belongs to one set of filters: when a filter changes, the key changes
  // and the page goes back to 1 automatically (no effect needed)
  const filterKey = `${debouncedSearch}|${roleId}|${status}|${perPage}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (p: number) => setPageState({ key: filterKey, page: p });

  // selection belongs to one set of filters too: changing a filter clears it,
  // so you can never act on rows that are no longer visible by accident
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
    rows: User[];
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
      role_id: roleId ? Number(roleId) : undefined,
      is_active:
        status === "active" ? true : status === "inactive" ? false : undefined,
      only_trashed: trashed ? true : undefined,
    }),
    [page, perPage, debouncedSearch, roleId, status, trashed],
  );
  const requestKey = `${JSON.stringify(params)}#${reloadKey}`;

  const { rows, meta } = result;
  const firstLoad = result.key === null;
  const fetching = result.key !== requestKey; // a newer request is running
  const error = fetching ? null : result.error;
  const showSkeleton = firstLoad || (fetching && result.error !== null);

  // ---- ui ----
  const [drawer, setDrawer] = useState<{ user: User | null } | null>(null);
  const [toDelete, setToDelete] = useState<Target[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [toast, setToast] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  const closeDrawer = useCallback(() => setDrawer(null), []);

  // no permission -> go to /forbidden
  useEffect(() => {
    if (ready && !can("users.view")) router.replace("/forbidden");
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const canView = can("users.view");

  // fetch the list (state is only set inside the promise callbacks)
  useEffect(() => {
    if (!ready || !canView) return;

    let cancelled = false; // true when a newer request replaced this one
    const ctrl = new AbortController();

    UserService.getAll(params, ctrl.signal)
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
      ctrl.abort();
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

  const filtersActive = search !== "" || status !== "all" || roleId !== "";
  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setRoleId("");
  };

  // select / unselect one row
  const toggleRow = (id: number) =>
    updateSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // select / unselect every row on this page
  const togglePage = () =>
    updateSelected((s) => {
      const n = new Set(s);
      const all = rows.length > 0 && rows.every((u) => n.has(u.id));
      rows.forEach((u) => (all ? n.delete(u.id) : n.add(u.id)));
      return n;
    });

  // shared by delete and restore: unselect what worked, toast, refresh
  function finishBatch(
    targets: Target[],
    results: PromiseSettledResult<unknown>[],
    doneText: (n: number) => string,
    verb: string,
  ) {
    const rejected = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    const failed = rejected.length;
    const okCount = targets.length - failed;

    updateSelected((s) => {
      const n = new Set(s);
      targets.forEach(
        (t, i) => results[i].status === "fulfilled" && n.delete(t.id),
      );
      return n;
    });

    if (failed) {
      // the API explains why: show the first reason
      const reason = parseApiError(rejected[0].reason).message;
      setToast({
        type: "error",
        text:
          targets.length === 1
            ? reason
            : `${failed} could not be ${verb}. ${reason}`,
      });
    } else {
      setToast({ type: "ok", text: doneText(okCount) });
    }

    // handled the whole last page -> go back one page
    if (okCount >= rows.length && page > 1) setPage(page - 1);
    else reload();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const results = await Promise.allSettled(
      toDelete.map((t) => UserService.delete(t.id)),
    );
    setDeleting(false);
    const targets = toDelete;
    setToDelete(null);
    finishBatch(
      targets,
      results,
      (n) => (n === 1 ? "User deleted" : `${n} users deleted`),
      "deleted",
    );
  }

  async function restoreUsers(targets: Target[]) {
    setRestoring(true);
    const results = await Promise.allSettled(
      targets.map((t) => UserService.restore(t.id)),
    );
    setRestoring(false);
    finishBatch(
      targets,
      results,
      (n) => (n === 1 ? "User restored" : `${n} users restored`),
      "restored",
    );
  }

  // rows from other pages are not loaded, so they are known by id only
  const selectedTargets = (): Target[] => {
    const known = rows.filter((u) => selected.has(u.id));
    const missing = Array.from(selected).filter(
      (id) => !known.some((u) => u.id === id),
    );
    return [
      ...known.map((u) => ({ id: u.id, name: u.name })),
      ...missing.map((id) => ({ id, name: `#${id}` })),
    ];
  };

  if (!ready) return <PageSkeleton />;
  if (!can("users.view")) return null; // redirecting to /forbidden

  const canCreate = can("users.create");
  const canUpdate = can("users.update");
  // ASSUMPTION: restoring uses the same permission as deleting
  const canDelete = can("users.delete");

  // how many selected users are not on the page you are looking at
  const offPageCount =
    selected.size - rows.filter((u) => selected.has(u.id)).length;

  return (
    <div className="w-full space-y-5">
      {/* header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-[#7d8aa1]">
            <span>Management</span>
            <span>/</span>
            <span className="font-semibold text-[#1d5fe0]">Users</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#1c2740]">
            Users
          </h2>
          <p className="mt-1 text-sm text-[#6c7a93]">
            {firstLoad
              ? "Loading users…"
              : `${meta.total} ${meta.total === 1 ? "user" : "users"}${trashed ? " deleted" : ""}`}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setDrawer({ user: null })}
            className={`${primaryBtn} ${focusRing}`}
          >
            <Plus className="h-4 w-4" />
            Add user
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

        {/* toolbar: search and role */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8aa1]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, code or phone"
              aria-label="Search users"
              className={`${control} w-full pl-9`}
            />
          </div>

          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            aria-label="Role"
            className={control}
          >
            <option value="">All roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
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
              Couldn&apos;t load users
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
              <Users className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#1c2740]">
              {filtersActive ? "No users match your filters" : "No users yet"}
            </h3>
            <p className="mt-1 max-w-xs text-sm text-[#6c7a93]">
              {filtersActive
                ? "Try a different search or clear the filters."
                : "Add your first user to give someone access."}
            </p>
            {(filtersActive || canCreate) && (
              <button
                type="button"
                onClick={
                  filtersActive ? resetFilters : () => setDrawer({ user: null })
                }
                className={`${primaryBtn} mt-5 ${focusRing}`}
              >
                {filtersActive ? "Clear filters" : "Add user"}
              </button>
            )}
          </div>
        ) : (
          <>
            <UserTable
              users={rows}
              selected={selected}
              busy={fetching || restoring}
              trashed={trashed}
              canEdit={canUpdate}
              canDelete={canDelete}
              onToggle={toggleRow}
              onTogglePage={togglePage}
              onEdit={(u) => setDrawer({ user: u })}
              onDelete={(u) => setToDelete([{ id: u.id, name: u.name }])}
              onRestore={(u) => restoreUsers([{ id: u.id, name: u.name }])}
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
            {canDelete &&
              (trashed ? (
                <button
                  type="button"
                  disabled={restoring}
                  onClick={() => restoreUsers(selectedTargets())}
                  className={`inline-flex items-center gap-1.5 rounded-lg bg-[#2f6fe8] px-3 py-1.5 font-medium hover:bg-[#1d5fe0] disabled:opacity-60 ${focusRing}`}
                >
                  <RotateCcw className="h-4 w-4" />
                  Restore
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setToDelete(selectedTargets())}
                  className={`inline-flex items-center gap-1.5 rounded-lg bg-[#e5484d] px-3 py-1.5 font-medium hover:bg-[#cf3a3f] ${focusRing}`}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ))}
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
        <UserDrawer
          key={drawer.user?.id ?? "new"}
          user={drawer.user}
          roles={roles}
          onClose={closeDrawer}
          onSaved={(mode) => {
            // the drawer slides out by itself, then calls onClose above
            setToast({
              type: "ok",
              text: mode === "created" ? "User added" : "User updated",
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
