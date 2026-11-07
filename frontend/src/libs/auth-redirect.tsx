"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setUnauthorizedHandler } from "@/libs/api-client";

export function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    setUnauthorizedHandler((returnUrl) => {
      router.replace(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    });
    return () => setUnauthorizedHandler(null);
  }, [router]);

  return null;
}
