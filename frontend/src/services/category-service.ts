import { api } from "@/libs/api-client";
import type {
  Category,
  StoreCategoryPayload,
  UpdateCategoryPayload,
} from "@/types/category";

export interface CategoryQuery {
  page?: number;
  per_page?: number;
  search?: string;
  parent_id?: number;
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

function buildQuery(params?: CategoryQuery): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.append(
      key,
      typeof value === "boolean" ? (value ? "1" : "0") : String(value),
    );
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toFormData(payload: object): FormData {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === null) {
      formData.append(key, "");
      return;
    }
    if (typeof value === "boolean") {
      formData.append(key, value ? "1" : "0");
      return;
    }
    formData.append(key, String(value));
  });
  return formData;
}

export const CategoryService = {
  getAll(params?: CategoryQuery) {
    return api.get<PaginatedResponse<Category>>(
      `/categories${buildQuery(params)}`,
    );
  },

  getById(id: number) {
    return api.get<{ data: Category }>(`/categories/${id}`);
  },

  create(payload: StoreCategoryPayload) {
    return api.post<{ data: Category }>(`/categories`, toFormData(payload));
  },

  update(id: number, payload: UpdateCategoryPayload) {
    return api.post<{ data: Category }>(
      `/categories/${id}`,
      toFormData({ ...payload, _method: "PUT" }),
    );
  },

  delete(id: number) {
    return api.delete<{ message: string }>(`/categories/${id}`);
  },

  restore(id: number) {
    return api.post<{ message: string }>(`/categories/${id}/restore`);
  },
};
