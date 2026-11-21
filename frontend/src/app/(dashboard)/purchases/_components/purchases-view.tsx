"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, ClipboardList, Filter } from "lucide-react";
import { PurchaseService } from "@/services/purchase-service";
import { SupplierService } from "@/services/supplier-service";
import type { Purchase, StorePurchasePayload } from "@/types/purchase";
import type { Supplier } from "@/types/supplier";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { TableSkeleton } from "@/shared/page-skeleton";
import { Pagination } from "@/shared/pagination";

import { PurchaseTable } from "./purchase-table";
import { PurchaseDrawer } from "./purchase-drawer";
import { PurchaseDetailModal } from "./purchase-detail-modal";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DELAY_MS = 400;

export function PurchasesView() {
  const { can } = useAuth();
  const canCreate = can("purchases.create") || can("admin");
  const canView = can("purchases.view") || can("admin");

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, SEARCH_DELAY_MS);

  // Suppliers for filter dropdown
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Purchases list state
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [meta, setMeta] = useState({
    last_page: 1,
    total: 0,
    from: null as number | null,
    to: null as number | null,
  });
  const [error, setError] = useState<string | null>(null);

  // Modals & Drawers state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Load suppliers once
  useEffect(() => {
    SupplierService.getAll({ per_page: 100 })
      .then((res) => setSuppliers(res.data || []))
      .catch(() => {});
  }, []);

  // Fetch purchases
  const fetchPurchases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await PurchaseService.getAll({
        page,
        per_page: perPage,
        search: debouncedSearch.trim() || undefined,
        status: status || undefined,
        supplier_id: supplierId ? Number(supplierId) : undefined,
      });

      setPurchases(res.data || []);
      const m = res.meta || res;
      setMeta({
        last_page: m.last_page || 1,
        total: m.total || 0,
        from: m.from ?? null,
        to: m.to ?? null,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load purchase orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [page, perPage, debouncedSearch, status, supplierId]);

  // Handlers
  const handleCreate = async (payload: StorePurchasePayload) => {
    await PurchaseService.create(payload);
    fetchPurchases();
  };

  const handleReceive = async (id: number) => {
    if (!confirm("Are you sure you want to receive this order? This will immediately add products to your stock inventory.")) {
      return;
    }
    try {
      await PurchaseService.receive(id);
      fetchPurchases();
      if (selectedPurchase?.id === id) {
        setDetailModalOpen(false);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to receive purchase order.");
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this purchase order?")) {
      return;
    }
    try {
      await PurchaseService.cancel(id);
      fetchPurchases();
      if (selectedPurchase?.id === id) {
        setDetailModalOpen(false);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to cancel purchase order.");
    }
  };

  const handleView = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1c2740]">Purchase Orders</h1>
          <p className="text-xs text-[#7d8aa1]">
            Track inventory replenishment, supplier shipments, and payables
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f6fe8] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d5fe0]"
          >
            <Plus size={16} />
            <span>New Purchase</span>
          </button>
        )}
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border border-[#e9eef7] bg-white p-5 shadow-[0_1px_3px_rgba(30,60,120,0.05)]">
        {/* Filters Bar */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search size={16} className="absolute left-3 top-3 text-[#7d8aa1]" />
              <input
                type="search"
                placeholder="Search reference no..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-lg border border-[#dfe6f2] bg-[#f8fafc] pl-9 pr-3 text-xs text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:bg-white"
              />
            </div>

            {/* Supplier Filter */}
            <select
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value ? Number(e.target.value) : "");
                setPage(1);
              }}
              className="h-10 rounded-lg border border-[#dfe6f2] bg-[#f8fafc] px-3 text-xs text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:bg-white"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg border border-[#dfe6f2] bg-[#f8fafc] px-3 text-xs text-[#1c2740] outline-none transition focus:border-[#2f6fe8] focus:bg-white"
            >
              <option value="">All Statuses</option>
              <option value="received">Received</option>
              <option value="ordered">Ordered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 rounded-xl border border-[#ffd5d9] bg-[#fff1f2] p-3 text-xs font-medium text-[#d64545]">
            {error}
          </div>
        )}

        {/* Content Table */}
        {loading ? (
          <TableSkeleton rows={perPage} />
        ) : (
          <PurchaseTable
            purchases={purchases}
            loading={loading}
            onView={handleView}
            onReceive={handleReceive}
            onCancel={handleCancel}
            canManage={canCreate}
          />
        )}

        {/* Pagination Footer */}
        {!loading && purchases.length > 0 && (
          <div className="mt-5 border-t border-[#eef2f9] pt-4">
            <Pagination
              page={page}
              lastPage={meta.last_page}
              total={meta.total}
              from={meta.from}
              to={meta.to}
              perPage={perPage}
              onPage={setPage}
              onPerPage={(n: number) => {
                setPerPage(n);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* New Purchase Drawer */}
      <PurchaseDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Purchase Detail Modal */}
      <PurchaseDetailModal
        purchase={selectedPurchase}
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onReceive={handleReceive}
        onCancel={handleCancel}
        canManage={canCreate}
      />
    </div>
  );
}
