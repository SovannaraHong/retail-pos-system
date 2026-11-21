// types/user.ts

export interface User {
  id: number;
  name: string;
  email: string;
  employee_code: string | null;
  phone: string | null;
  image: string | null;
  image_url: string | null;
  is_active: boolean;
  role: string[]; // role NAMES (UserResource uses pluck('name'))
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Role {
  id: number;
  name: string;
}

export interface StoreUserPayload {
  name: string;
  email: string;
  password: string;
  employee_code?: string | null;
  phone?: string | null;
  pin?: string | null;
  is_active?: boolean;
  role_id?: number;
  image?: File;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string; // only sent when the admin types a new one
  employee_code?: string | null;
  phone?: string | null;
  pin?: string; // only sent when the admin types a new one
  is_active?: boolean;
  role_id?: number | null; // null = remove the role (needs the UserController patch)
  image?: File;
  remove_image?: boolean;
}
