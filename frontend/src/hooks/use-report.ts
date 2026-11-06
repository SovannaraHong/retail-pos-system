"use client";

import { useEffect, useState } from "react";

type Result<T> = { key: string; data: T | null; error: string | null };

export function useReport<T>(key: string, fetcher: () => Promise<T>) {
  const [result, setResult] = useState<Result<T>>({
    key: "",
    data: null,
    error: null,
  });

  useEffect(() => {
    let live = true;

    fetcher()
      .then((data) => live && setResult({ key, data, error: null }))
      .catch(
        (e) =>
          live &&
          setResult((prev) => ({
            key,
            data: prev.data,
            error: e?.response?.data?.message ?? e?.message ?? "Failed to load",
          })),
      );

    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return {
    data: result.data,
    loading: result.key !== key,
    error: result.key === key ? result.error : null,
  };
}
