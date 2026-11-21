"use client";

import { useEffect, useState } from "react";
import { SettingService } from "@/services/setting-service";
import type { StoreSettings } from "@/types/setting";

let cachedSettings: StoreSettings | null = null;
const listeners = new Set<(s: StoreSettings) => void>();

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(cachedSettings);

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings);
    } else {
      // Use getReceiptSettings so cashier and non-admin roles can also fetch it
      SettingService.getReceiptSettings()
        .then((res) => {
          if (res.data) {
            cachedSettings = res.data;
            setSettings(res.data);
            listeners.forEach((fn) => fn(res.data));
          }
        })
        .catch(() => {});
    }

    const listener = (newSettings: StoreSettings) => setSettings(newSettings);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const updateCachedSettings = (newSettings: StoreSettings) => {
    cachedSettings = newSettings;
    listeners.forEach((fn) => fn(newSettings));
  };

  return { settings, updateCachedSettings };
}

