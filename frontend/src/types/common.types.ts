export type SortDirection = "asc" | "desc";

export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_direction?: SortDirection;
  search?: string;
}

export interface SelectOption<T = string | number> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface DateRangeFilter {
  start_date?: string;
  end_date?: string;
}

export type StatusType = "active" | "inactive" | "pending" | "completed" | "cancelled" | "low_stock" | "out_of_stock";
