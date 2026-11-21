export type PurchaseStatus = "ordered" | "received" | "cancelled";

export interface PurchaseItem {
  id: number;
  product?: {
    id: number;
    name: string;
    sku: string;
    unit: string;
  } | null;
  qty: number;
  unit_cost: number;
  line_total: number;
}

export interface Purchase {
  id: number;
  reference_no: string;
  status: PurchaseStatus;
  supplier?: {
    id: number;
    name: string;
  } | null;
  user?: {
    id: number;
    name: string;
  } | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid_amount: number;
  balance: number;
  note?: string | null;
  purchased_at?: string | null;
  received_at?: string | null;
  items_count?: number;
  items?: PurchaseItem[];
  created_at?: string | null;
}

export interface StorePurchaseItemPayload {
  product_id: number;
  qty: number;
  unit_cost: number;
}

export interface StorePurchasePayload {
  supplier_id: number;
  reference_no?: string;
  status?: "ordered" | "received";
  purchased_at?: string;
  discount?: number;
  tax?: number;
  paid_amount?: number;
  note?: string;
  items: StorePurchaseItemPayload[];
}
