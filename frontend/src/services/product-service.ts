import { api } from "@/libs/api-client";
import type {
  Product,
  StoreProductPayload,
  UpdateProductPayload,
} from "@/types/product";

export interface ProductQuery {
  page?: number;
  per_page?: number;
  search?: string;
  category_id?: number;
  brand_id?: number;
  supplier_id?: number;
  is_active?: boolean;
  track_stock?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

/**
 * Laravel returns pagination either flat ({ data, last_page, ... })
 * or nested ({ data, links, meta: { last_page, ... } }) when you use API Resources.
 * Both are supported.
 */
export interface PaginatedResponse<T> extends Partial<PaginationMeta> {
  data: T[];
  meta?: PaginationMeta;
}

function buildQuery(params?: ProductQuery): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    // Laravel's `boolean` rule accepts 1/0, not "true"/"false"
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
    if (value === undefined) return; // not sent -> backend keeps old value
    if (value === null) {
      formData.append(key, ""); // Laravel turns "" into null (clears the field)
      return;
    }
    if (value instanceof File) {
      formData.append(key, value);
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

export const ProductService = {
  getAll(params?: ProductQuery) {
    return api.get<PaginatedResponse<Product>>(
      `/products${buildQuery(params)}`,
    );
  },

  getByBarcode(code: string) {
    return api.get<{ data: Product }>(
      `/products/barcode/${encodeURIComponent(code)}`,
    );
  },

  getById(id: number) {
    return api.get<{ data: Product }>(`/products/${id}`);
  },

  create(payload: StoreProductPayload) {
    return api.post<{ data: Product }>(`/products`, toFormData(payload));
  },

  // PHP can't read multipart bodies on a real PUT, so POST + _method=PUT
  update(id: number, payload: UpdateProductPayload) {
    return api.post<{ data: Product }>(
      `/products/${id}`,
      toFormData({ ...payload, _method: "PUT" }),
    );
  },

  delete(id: number) {
    return api.delete<{ message: string }>(`/products/${id}`);
  },

  restore(id: number) {
    return api.post<{ message: string }>(`/products/${id}/restore`);
  },
};
