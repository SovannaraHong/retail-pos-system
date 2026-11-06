"use client";

import type { ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";

export default function Can({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const { can, ready } = useAuth();
  return ready && can(permission) ? <>{children}</> : null;
}
