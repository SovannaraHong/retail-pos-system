export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  employee_code: string | null;
  phone: string | null;
  image: string | null;
  image_url: string | null;
  is_active: boolean;
  role: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
  permission: string[];
}
