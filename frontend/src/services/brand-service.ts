import { api } from "@/libs/api-client";
import { Brand, StoreBrandPayload, UpdateBrandPayload } from "@/types/brand";

export interface BrandQuery {
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

function buildQuery(param?: BrandQuery): string {
  if (!param) return "";

  const searchParam = new URLSearchParams();
  Object.entries(param).forEach(([Key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParam.append(
      Key,
      typeof value === "boolean" ? (value ? "1" : "0") : String(value),
    );
  });
  const query = searchParam.toString();
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
export const BrandService = {
  // Get all brands
  getAll: (params?: BrandQuery) =>
    api.get<PaginatedResponse<Brand>>(`/brands${buildQuery(params)}`),

  // Get brand by ID
  getById: (id: number) => api.get<{ data: Brand }>(`/brands/${id}`),

  // Create brand
  create: (payload: StoreBrandPayload) =>
    api.post<Brand>("/brands", toFormData(payload)),

  // Update brand
  update: (id: number, payload: UpdateBrandPayload) =>
    api.post<Brand>(`/brands/${id}?_method=PUT`, toFormData(payload)),

  // Delete brand
  delete: (id: number) => api.delete<void>(`/brands/${id}`),

  // Restore deleted brand
  restore: (id: number) => api.post<Brand>(`/brands/${id}/restore`),
};
