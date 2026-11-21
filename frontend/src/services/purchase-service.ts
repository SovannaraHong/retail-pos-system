import { api } from "@/libs/api-client";
import type { PaginatedResponse, PaginationMeta } from "./supplier-service";
import type { Purchase, StorePurchasePayload } from "@/types/purchase";

export interface PurchaseQuery {
  page?: number;
  per_page?: number;
  search?: string;
  supplier_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
}

function buildQuery(param?: PurchaseQuery): string {
  if (!param) return "";
  const searchParams = new URLSearchParams();

  Object.entries(param).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const PurchaseService = {
  getAll(params?: PurchaseQuery) {
    return api.get<PaginatedResponse<Purchase>>(`/purchases${buildQuery(params)}`);
  },

  getById(id: number) {
    return api.get<{ data: Purchase }>(`/purchases/${id}`);
  },

  create(payload: StorePurchasePayload) {
    return api.post<{ data: Purchase }>("/purchases", payload);
  },

  receive(id: number) {
    return api.post<{ data: Purchase }>(`/purchases/${id}/receive`);
  },

  cancel(id: number) {
    return api.post<{ data: Purchase }>(`/purchases/${id}/cancel`);
  },
};
