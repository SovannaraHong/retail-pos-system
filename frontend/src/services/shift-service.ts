import { api, ApiError } from "@/libs/api-client";
import type { PaginatedResponse } from "@/services/product-service";
import type { CloseShiftPayload, OpenShiftPayload, Shift } from "@/types/shift";

export interface ShiftQuery {
  page?: number;
  per_page?: number;
  status?: "open" | "closed";
  user_id?: number;
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
}

function buildQuery(params?: ShiftQuery): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const ShiftService = {
  // list of shifts (needs the shifts.view permission)
  getAll(params?: ShiftQuery, signal?: AbortSignal) {
    return api.get<PaginatedResponse<Shift>>(`/shifts${buildQuery(params)}`, {
      signal,
    });
  },

  // returns null when the cashier has no open shift (404 is normal here)
  async current(signal?: AbortSignal): Promise<Shift | null> {
    try {
      const res = await api.get<{ data: Shift }>("/shifts/current", { signal });
      return res.data;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  // one shift with its summary (totals by payment method)
  getById(id: number, signal?: AbortSignal) {
    return api.get<{ data: Shift }>(`/shifts/${id}`, { signal });
  },

  open(payload: OpenShiftPayload) {
    return api.post<{ data: Shift }>("/shifts/open", payload);
  },

  close(payload: CloseShiftPayload) {
    return api.post<{ data: Shift }>("/shifts/close", payload);
  },
};
