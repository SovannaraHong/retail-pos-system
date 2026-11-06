import { Brand } from "./brand";
import { Category } from "./category";
import { Supplier } from "./supplier";

export interface Product {
  id: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  image: string | null;
  image_url: string | null;
  unit: string | null;

  cost_price?: number;
  sell_price: number;
  tax_rate: number;

  track_stock: boolean;
  stock_qty: number;
  reorder_level: number;
  is_low_stock: boolean;
  is_active: boolean;

  category?: Category | null;

  brand?: Brand | null;

  supplier?: Supplier | null;

  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}
export interface StoreProductPayload {
  category_id?: number | null;
  brand_id?: number | null;
  supplier_id?: number | null;

  name: string;
  sku?: string | null;
  barcode?: string | null;
  description?: string | null;
  image?: File | null;
  unit?: string | null;

  cost_price?: number;
  sell_price: number;
  tax_rate?: number;

  track_stock?: boolean;
  stock_qty?: number;
  reorder_level?: number;
  is_active?: boolean;
}

export interface UpdateProductPayload {
  category_id?: number | null;
  brand_id?: number | null;
  supplier_id?: number | null;

  name?: string;
  sku?: string;
  barcode?: string | null;
  description?: string | null;
  image?: File | null;
  remove_image?: boolean;
  unit?: string | null;

  cost_price?: number;
  sell_price?: number;
  tax_rate?: number;

  track_stock?: boolean;
  reorder_level?: number;
  is_active?: boolean;
}
