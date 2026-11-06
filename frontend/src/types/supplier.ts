export interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  is_active: boolean;
  products_count?: number;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}
