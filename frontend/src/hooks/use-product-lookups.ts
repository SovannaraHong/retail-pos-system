"use client";

import { useEffect, useState } from "react";
import { api } from "@/libs/api-client";

export interface LookupOption {
  id: number;
  name: string;
}

/** Loads the dropdown options used by the filter bar and the product drawer. */
export function useProductLookups() {
  const [categories, setCategories] = useState<LookupOption[]>([]);
  const [brands, setBrands] = useState<LookupOption[]>([]);
  const [suppliers, setSuppliers] = useState<LookupOption[]>([]);

  useEffect(() => {
    let alive = true;

    const load = async (url: string): Promise<LookupOption[]> => {
      try {
        const res = await api.get<{ data: LookupOption[] }>(url);
        return res.data;
      } catch {
        return [];
      }
    };

    Promise.all([
      load("/categories?per_page=100"),
      load("/brands?per_page=100"),
      load("/suppliers?per_page=100"),
    ]).then(([c, b, s]) => {
      if (!alive) return;
      setCategories(c);
      setBrands(b);
      setSuppliers(s);
    });

    return () => {
      alive = false;
    };
  }, []);

  return { categories, brands, suppliers };
}
