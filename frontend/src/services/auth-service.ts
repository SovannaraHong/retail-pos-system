import { api } from "@/libs/api-client";
import type { LoginRequest, LoginResponse } from "@/types/auth";

export const authService = {
  login: (payload: LoginRequest) =>
    api.post<LoginResponse>("/api/login", payload, { auth: false }),

  logout: () => api.post<unknown>("/logout"),
};
