import { api } from "@/libs/api-client";
import type { StoreSettings, UpdateSettingsPayload } from "@/types/setting";

export const SettingService = {
  get() {
    return api.get<{ data: StoreSettings }>("/settings");
  },

  getReceiptSettings() {
    return api.get<{ data: StoreSettings }>("/settings/receipt");
  },

  update(payload: UpdateSettingsPayload) {
    return api.put<{ data: StoreSettings }>("/settings", payload);
  },
};
