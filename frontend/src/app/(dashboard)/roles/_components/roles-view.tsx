"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Plus, Search, ShieldOff } from "lucide-react";
import { RoleService } from "@/services/role-service";
import { PermissionService } from "@/services/role-service";
import type { PaginationMeta } from "@/services/product-service";
import type { Permission, Role } from "@/types/role";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { parseApiError } from "@/libs/api-error";
import { focusRing } from "@/libs/format";
import { ConfirmDelete } from "@/shared/confirm-delete";
import { Pagination } from "@/shared/pagination";
import { PageSkeleton, TableSkeleton } from "@/shared/page-skeleton";
import { RoleDrawer } from "./role-drawer";
import { RoleTable } from "./role-table";
import { RoleDetailModal } from "./role-detail-modal";

// ---- settings ----
const DEFAULT_PER_PAGE = 10;
const SEARCH_DELAY_MS = 400;
const TOAST_MS = 2800;
const MAX_SKELETON_ROWS = 8;

// ---- styles ----
const card =
  "rounded-2xl border border-[#e9eef7] bg-white shadow-[0_1px_3px_rgba(30,60,120,0.05)]";
const control =
  "h-10 rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] px-3 text-sm text-[#1c2740] focus:border-[#2f6fe8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6fe8]/20";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#2f6fe8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d5fe0]";

export function RolesView() {
  const router = useRouter();
  const { ready, can } = useAuth();

  // ---- filters ----
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, SEARCH_DELAY_MS);

  const filterKey = `${debouncedSearch}|${perPage}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (p: number) => setPageState({ key: filterKey, page: p });

  // ---- permissions list (for the drawer) ----
  const [permissions, setPermissions] = useState<Permission[]>([]);

  // ---- data ----
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  const [result, setResult] = useState<{
    key: string | null;
    rows: Role[];
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
  const fetching = result.key !== requestKey;
  const error = fetching ? null : result.error;
  const showSkeleton = firstLoad || (fetching && result.error !== null);

  // ---- ui ----
  const [drawer, setDrawer] = useState<{ role: Role | null } | null>(null);
  const [viewing, setViewing] = useState<Role | null>(null);
  const [toDelete, setToDelete] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  const closeViewing = useCallback(() => setViewing(null), []);
  const closeDrawer = useCallback(() => setDrawer(null), []);
  const editFromModal = useCallback((r: Role) => {
    setViewing(null);
    setDrawer({ role: r });
  }, []);

  useEffect(() => {
    if (ready && !can("roles.view")) router.replace("/forbidden");
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const canView = can("roles.view");

  // fetch roles
  useEffect(() => {
    if (!ready || !canView) return;
    let cancelled = false;

    RoleService.getAll(params)
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

  // fetch permissions once (only needed when the user can create / update)
  const needsPermissions = can("roles.create") || can("roles.update");
  useEffect(() => {
    if (!ready || !needsPermissions) return;
    let cancelled = false;
    PermissionService.getAll()
      .then((res) => !cancelled && setPermissions(res.data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ready, needsPermissions]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  const filtersActive = search !== "";
  const resetFilters = () => setSearch("");

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await RoleService.delete(toDelete.id);
      setToast({ type: "ok", text: "Role deleted" });
      setToDelete(null);
      if (rows.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (err) {
      // e.g. 409 "Cannot delete: 3 user(s) still use this role."
      setToast({ type: "error", text: parseApiError(err).message });
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  if (!ready) return <PageSkeleton />;
  if (!can("roles.view")) return null;

  const canCreate = can("roles.create");
  const canUpdate = can("roles.update");
  const canDelete = can("roles.delete");

  return (
    <div className="w-full space-y-5">
      {/* header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-[#7d8aa1]">
            <span>Management</span>
            <span>/</span>
            <span className="font-semibold text-[#1d5fe0]">Roles</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#1c2740]">
            Roles
          </h2>
          <p className="mt-1 text-sm text-[#6c7a93]">
            {firstLoad
              ? "Loading roles…"
              : `${meta.total} ${meta.total === 1 ? "role" : "roles"} in your store`}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setDrawer({ role: null })}
            className={`${primaryBtn} ${focusRing}`}
          >
            <Plus className="h-4 w-4" />
            Add role
          </button>
        )}
      </header>

      <section className={`${card} overflow-hidden`}>
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8aa1]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by role name"
              aria-label="Search roles"
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

        {/* body */}
        {showSkeleton ? (
          <TableSkeleton rows={Math.min(perPage, MAX_SKELETON_ROWS)} />
        ) : error ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="rounded-2xl bg-[#ffe9ec] p-4 text-[#e5484d]">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#1c2740]">
              Couldn&apos;t load roles
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
              <ShieldOff className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#1c2740]">
              {filtersActive ? "No roles match your search" : "No roles yet"}
            </h3>
            <p className="mt-1 max-w-xs text-sm text-[#6c7a93]">
              {filtersActive
                ? "Try a different search."
                : "Add your first role to control what your team can do."}
            </p>
            {(filtersActive || canCreate) && (
              <button
                type="button"
                onClick={
                  filtersActive ? resetFilters : () => setDrawer({ role: null })
                }
                className={`${primaryBtn} mt-5 ${focusRing}`}
              >
                {filtersActive ? "Clear filters" : "Add role"}
              </button>
            )}
          </div>
        ) : (
          <>
            <RoleTable
              roles={rows}
              busy={fetching}
              canEdit={canUpdate}
              canDelete={canDelete}
              onView={setViewing}
              onEdit={(r) => setDrawer({ role: r })}
              onDelete={setToDelete}
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

      {toast && (
        <div
          role="status"
          className={`fixed right-6 top-6 z-[60] rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            toast.type === "ok" ? "bg-[#1f9d55]" : "bg-[#e5484d]"
          }`}
        >
          {toast.text}
        </div>
      )}

      {viewing && (
        <RoleDetailModal
          role={viewing}
          canEdit={canUpdate}
          onClose={closeViewing}
          onEdit={editFromModal}
        />
      )}

      {drawer && (
        <RoleDrawer
          key={drawer.role?.id ?? "new"}
          role={drawer.role}
          permissions={permissions}
          onClose={closeDrawer}
          onSaved={(mode) => {
            setToast({
              type: "ok",
              text: mode === "created" ? "Role added" : "Role updated",
            });
            if (mode === "created") setPage(1);
            reload();
          }}
        />
      )}

      {toDelete && (
        <ConfirmDelete
          count={1}
          name={toDelete.name}
          busy={deleting}
          onCancel={() => setToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
