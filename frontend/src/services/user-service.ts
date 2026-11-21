// services/user-service.ts
import { api } from "@/libs/api-client";
import type { PaginatedResponse } from "@/services/product-service";
import type {
  Role,
  StoreUserPayload,
  UpdateUserPayload,
  User,
} from "@/types/user";

export interface UserQuery {
  page?: number;
  per_page?: number;
  search?: string;
  role_id?: number;
  is_active?: boolean;
  only_trashed?: boolean;
}

function buildQuery(params?: UserQuery): string {
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

// the user form can send an image file, so it must be multipart FormData
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

export const UserService = {
  getAll(params?: UserQuery, signal?: AbortSignal) {
    return api.get<PaginatedResponse<User>>(`/users${buildQuery(params)}`, {
      signal,
    });
  },

  getById(id: number) {
    return api.get<{ data: User }>(`/users/${id}`);
  },

  create(payload: StoreUserPayload) {
    return api.post<{ data: User }>("/users", toFormData(payload));
  },

  // PHP can't read multipart bodies on a real PUT, so POST + _method=PUT
  update(id: number, payload: UpdateUserPayload) {
    return api.post<{ data: User }>(
      `/users/${id}`,
      toFormData({ ...payload, _method: "PUT" }),
    );
  },

  // soft delete: the server answers 204 with no body
  delete(id: number) {
    return api.delete<void>(`/users/${id}`);
  },

  restore(id: number) {
    return api.post<{ data: User }>(`/users/${id}/restore`);
  },

  // roles for the dropdowns. ASSUMPTION: GET /roles returns { data: [{ id, name }] }
  roles(signal?: AbortSignal) {
    return api.get<{ data: Role[] }>("/roles", { signal });
  },
};
