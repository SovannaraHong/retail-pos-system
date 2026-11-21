export interface Permission {
  id: number;
  name: string; // e.g. "products.view"
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  users_count?: number;
  permissions?: Permission[];
  created_at: string | null;
  updated_at: string | null;
}

export interface RolePayload {
  name?: string;
  permissions?: number[];
}
