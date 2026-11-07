export interface Sale {
  id: number;
  invoice_no: string;
  status: string;

  cashier?: {
    id: number;
    name: string;
  } | null;

  customer?: {
    id: number;
    name: string;
  } | null;

  shift_id: number | null;

  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid_amount: number;
  change_amount: number;

  note: string | null;
  sold_at: string | null;

  items_count?: number;
  items?: SaleItem[];
  payments?: Payment[];
}

export interface SaleItem {
  id: number;
  product_id: number;
  product_name: string;
  sku?: string | null;
  qty: number;
  unit_price: number;
  cost_price?: number;
  discount: number;
  tax: number;
  line_total: number;
}

export interface Payment {
  id: number;
  method: "cash" | "card" | "bank";
  amount: number;
  reference: string | null;
}

export interface StoreSalePayload {
  customer_id?: number | null;
  discount?: number;
  note?: string | null;

  items: {
    product_id: number;
    qty: number;
    discount?: number;
  }[];

  payments: {
    method: "cash" | "card" | "bank";
    amount: number;
    reference?: string | null;
  }[];
}

export interface VoidSalePayload {
  reason: string;
}

// KHQR payment

export interface StoreKhqrPaymentPayload {
  customer_id?: number | null;
  discount?: number;
  note?: string | null;

  items: {
    product_id: number;
    qty: number;
    discount?: number;
  }[];
}

export interface KhqrPayment {
  id: number;
  reference: string;
  status: "pending" | "paid" | "expired" | "cancelled" | "needs_review";
  amount: number;
  currency: string;
  qr?: string;
  md5: string;
  expires_at: string | null;
  seconds_left: number;
  paid_at: string | null;
  from_account: string | null;
  error: string | null;

  cashier?: {
    id: number;
    name: string;
  } | null;

  sale?: Sale | null;
  created_at: string | null;
}
