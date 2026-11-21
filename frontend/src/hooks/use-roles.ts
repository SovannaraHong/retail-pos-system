import { useEffect, useState } from "react";
import { UserService } from "@/services/user-service";
import type { Role } from "@/types/user";

/** Loads the roles once, for the role filter and the role dropdown. */
export function useRoles(): Role[] {
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const ctrl = new AbortController();

    UserService.roles(ctrl.signal)
      .then((res) => setRoles(res.data))
      .catch(() => {
        // aborted, or the user cannot list roles: the dropdowns stay empty
      });

    return () => ctrl.abort();
  }, []);

  return roles;
}
