import { api } from "@/libs/api-client";
import type { AuthUser, LoginRequest, LoginResponse } from "@/types/auth";

export const authService = {
  login: (payload: LoginRequest) =>
    api.post<LoginResponse>("/login", payload, {
      auth: false,
    }),

  logout: () => api.post<unknown>("/logout"),

  me: () => api.get<AuthUser>("/me"),
};
