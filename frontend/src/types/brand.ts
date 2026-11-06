export interface Brand {
  id: number;
  name: string;
  is_active: boolean;
  products_count?: number;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}
