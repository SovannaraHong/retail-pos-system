import { api } from "@/libs/api-client";
import type { Permission, Role, RolePayload } from "@/types/role";
import type { PaginatedResponse } from "./product-service";

export interface RoleQuery {
  page?: number;
  per_page?: number;
  search?: string;
}

function buildQuery(params?: RoleQuery): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.append(k, String(v));
  });
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export const RoleService = {
  getAll(params?: RoleQuery, signal?: AbortSignal) {
    return api.get<PaginatedResponse<Role>>(`/roles${buildQuery(params)}`, {
      signal,
    });
  },
  getById(id: number) {
    return api.get<{ data: Role }>(`/roles/${id}`);
  },
  create(payload: RolePayload) {
    return api.post<{ data: Role }>(`/roles`, payload);
  },
  update(id: number, payload: RolePayload) {
    return api.put<{ data: Role }>(`/roles/${id}`, payload);
  },
  delete(id: number) {
    return api.delete<{ message?: string }>(`/roles/${id}`);
  },
};

export const PermissionService = {
  getAll() {
    return api.get<{ data: Permission[] }>(`/permissions`);
  },
};
