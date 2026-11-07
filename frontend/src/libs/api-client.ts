import axios, { type AxiosRequestConfig } from "axios";
import { clearSession } from "@/libs/auth-storage";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

type UnauthorizedHandler = (returnUrl: string) => void;

let onUnauthorized: UnauthorizedHandler | null = null;
let redirecting = false; // many requests can fail with 401 at once

export function setUnauthorizedHandler(fn: UnauthorizedHandler | null) {
  onUnauthorized = fn;
  redirecting = false;
}

type RequestOptions = {
  /** Send the Bearer token and log out on 401. Default true. */
  auth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { Accept: "application/json" },
});

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true, headers = {}, signal } = options;

  const config: AxiosRequestConfig = {
    method,
    url: path,
    data: body,
    headers: { ...headers },
    signal,
  };

  if (auth) {
    const token = sessionStorage.getItem("access_token");
    if (token) config.headers!.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await http.request<T>(config);
    return res.data;
  } catch (err) {
    // cancelled request: let the caller ignore it
    if (axios.isCancel(err)) throw err;

    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 0;
      const data = err.response?.data as
        | { message?: string; errors?: Record<string, string[]> }
        | undefined;

      // Token expired or revoked: clear it and go to login (once).
      if (status === 401 && auth) {
        clearSession();
        if (!redirecting) {
          redirecting = true;
          onUnauthorized?.(window.location.pathname);
        }
      }

      throw new ApiError(
        data?.message ??
          (status === 0
            ? "Cannot reach the server. Check your connection."
            : "Request failed. Please try again."),
        status,
        data?.errors,
      );
    }

    throw err;
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};
