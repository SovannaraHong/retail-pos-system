import { api } from "@/libs/api-client";
import {
  StoreSupplierPayload,
  Supplier,
  UpdateSupplierPayload,
} from "@/types/supplier";

export interface SupplierQuery {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
  only_trashed?: boolean;
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

function buildQuery(param?: SupplierQuery): string {
  if (!param) return "";
  const searchParams = new URLSearchParams();

  Object.entries(param).forEach(([Key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.append(
      Key,
      typeof value === "boolean" ? (value ? "1" : "0") : String(value),
    );
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toFormData(payload: object): FormData {
  const formData = new FormData();
  Object.entries(payload).forEach(([Key, value]) => {
    if (value === undefined) return;
    if (value === null) {
      formData.append(Key, "");
      return;
    }
    if (typeof value === "boolean") {
      formData.append(Key, value ? "1" : "0");
      return;
    }
    formData.append(Key, String(value));
  });
  return formData;
}

export const SupplierService = {
  getAll(params?: SupplierQuery) {
    return api.get<PaginatedResponse<Supplier>>(
      `/suppliers${buildQuery(params)}`,
    );
  },

  getById(id: number) {
    return api.get<{ data: Supplier }>(`/suppliers/${id}`);
  },

  create(payload: StoreSupplierPayload) {
    return api.post<{ data: Supplier }>("/suppliers", toFormData(payload));
  },

  update(id: number, payload: UpdateSupplierPayload) {
    return api.post<{ data: Supplier }>(
      `/suppliers/${id}`,
      toFormData({ ...payload, _method: "PUT" }),
    );
  },

  delete(id: number) {
    return api.delete<{ message: string }>(`/suppliers/${id}`);
  },

  restore(id: number) {
    return api.post<{ message: string }>(`/suppliers/${id}/restore`);
  },
};
