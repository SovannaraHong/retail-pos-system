import { api } from "@/libs/api-client";
import type {
  PaginatedResponse,
  PaginationMeta,
} from "@/services/product-service";
import type { Permission, PermissionPayload } from "@/types/permission";

// re-exported so the view imports everything from one place
export type { PaginationMeta };

export interface PermissionQuery {
  page?: number;
  per_page?: number;
  search?: string;
}

function buildQuery(params?: PermissionQuery): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const PermissionService = {
  getAll(params?: PermissionQuery, signal?: AbortSignal) {
    return api.get<PaginatedResponse<Permission>>(
      `/permissions${buildQuery(params)}`,
      { signal },
    );
  },

  getById(id: number) {
    return api.get<{ data: Permission }>(`/permissions/${id}`);
  },

  // ASSUMPTION: api.post/put accept a plain object and send it as JSON.
  // If your client only takes FormData, wrap the payload like UserService does.
  create(payload: PermissionPayload) {
    return api.post<{ data: Permission }>("/permissions", payload);
  },

  update(id: number, payload: PermissionPayload) {
    return api.put<{ data: Permission }>(`/permissions/${id}`, payload);
  },

  delete(id: number) {
    return api.delete<void>(`/permissions/${id}`);
  },
};
