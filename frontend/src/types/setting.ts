export interface StoreSettings {
  store_name: string | null;
  store_phone: string | null;
  store_address: string | null;
  store_email: string | null;
  tax_id: string | null;
  receipt_header: string | null;
  receipt_footer: string | null;
  currency?: string;
}

export type UpdateSettingsPayload = Partial<StoreSettings>;
