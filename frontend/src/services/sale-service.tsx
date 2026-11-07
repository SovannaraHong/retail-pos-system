import { api } from "@/libs/api-client";
import type {
  Sale,
  StoreSalePayload,
  VoidSalePayload,
  StoreKhqrPaymentPayload,
  KhqrPayment,
} from "@/types/sale";

export interface SaleQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  user_id?: number;
  customer_id?: number;
  shift_id?: number;
  date_from?: string;
  date_to?: string;
}

export interface KhqrPaymentQuery {
  page?: number;
  per_page?: number;
  status?: string;
  user_id?: number;
  date_from?: string;
  date_to?: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface PaginatedResponse<T> extends Partial<PaginationMeta> {
  data: T[];
  meta?: PaginationMeta;
}

function buildQuery(params?: object): string {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const SaleService = {
  // ---------------- SALES ----------------

  getAll(params?: SaleQuery) {
    return api.get<PaginatedResponse<Sale>>(`/sales${buildQuery(params)}`);
  },

  getById(id: number) {
    return api.get<{ data: Sale }>(`/sales/${id}`);
  },

  // Cash / card / bank checkout
  create(payload: StoreSalePayload) {
    return api.post<{ data: Sale }>("/sales", payload);
  },

  // Void sale
  void(id: number, payload: VoidSalePayload) {
    return api.post<{ data: Sale }>(`/sales/${id}/void`, payload);
  },

  // ---------------- KHQR PAYMENTS ----------------

  // Generate QR for checkout
  createKhqr(payload: StoreKhqrPaymentPayload) {
    return api.post<{ data: KhqrPayment }>("/khqr/payments", payload);
  },

  // Check payment status (poll every ~3 seconds)
  getKhqrById(id: number) {
    return api.get<{ data: KhqrPayment }>(`/khqr/payments/${id}`);
  },

  // Cancel pending QR payment
  cancelKhqr(id: number) {
    return api.post<{ data: KhqrPayment }>(`/khqr/payments/${id}/cancel`);
  },

  // List KHQR payments
  getKhqrAll(params?: KhqrPaymentQuery) {
    return api.get<PaginatedResponse<KhqrPayment>>(
      `/khqr/payments${buildQuery(params)}`,
    );
  },
};
