export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;

  sales_count?: number;
  total_sales?: number;
  total_refunds?: number;
  net_spent?: number;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface StoreCustomerPayload {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface UpdateCustomerPayload {
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}
