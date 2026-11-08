import {
  Expense,
  StoreExpensePayload,
  UpdateExpensePayload,
} from "@/types/expense";
import { PaginatedResponse } from "./brand-service";
import { api } from "@/libs/api-client";

export interface ExpenseQuery {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  user_id?: number;
  date_from?: string;
  date_to?: string;
  only_trashed?: boolean;
}
export interface ExpenseListResponse extends PaginatedResponse<Expense> {
  summary?: { total_amount: number };
}

function buildQuery(param?: ExpenseQuery): string {
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

export const ExpenseService = {
  getAll(params?: ExpenseQuery, signal?: AbortSignal) {
    return api.get<ExpenseListResponse>(`/expenses${buildQuery(params)}`, {
      signal,
    });
  },

  // categories already used, for the dropdown / suggestions
  categories(signal?: AbortSignal) {
    return api.get<{ data: string[] }>("/expenses/categories", { signal });
  },

  getById(id: number) {
    return api.get<{ data: Expense }>(`/expenses/${id}`);
  },

  // JSON body (no files), so no FormData needed
  create(payload: StoreExpensePayload) {
    return api.post<{ data: Expense }>("/expenses", payload);
  },

  update(id: number, payload: UpdateExpensePayload) {
    return api.put<{ data: Expense }>(`/expenses/${id}`, payload);
  },

  // soft delete: the server answers 204 with no body
  delete(id: number) {
    return api.delete<void>(`/expenses/${id}`);
  },

  restore(id: number) {
    return api.post<{ data: Expense }>(`/expenses/${id}/restore`);
  },
};
