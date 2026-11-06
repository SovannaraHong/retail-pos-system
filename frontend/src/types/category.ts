export interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  parent_id: number | null;

  parent?: {
    id: number;
    name: string;
  } | null;

  products_count?: number;
  children_count?: number;

  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface StoreCategoryPayload {
  name: string;
  parent_id?: number | null;
  description?: string | null;
  is_active?: boolean;
}
export interface UpdateCategoryPayload {
  name?: string;
  parent_id?: number | null;
  description?: string | null;
  is_active?: boolean;
}
