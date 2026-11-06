export interface ParsedApiError {
  message: string;
  fields: Record<string, string>;
}

/** Works with fetch-style errors ({ message, errors }) and axios-style (err.response.data). */
export function parseApiError(err: unknown): ParsedApiError {
  const e = err as {
    message?: string;
    errors?: Record<string, string[] | string>;
    data?: { message?: string; errors?: Record<string, string[] | string> };
    response?: {
      data?: { message?: string; errors?: Record<string, string[] | string> };
    };
  };

  const body = e?.response?.data ?? e?.data ?? e;
  const fields: Record<string, string> = {};

  if (body?.errors && typeof body.errors === "object") {
    Object.entries(body.errors).forEach(([key, value]) => {
      fields[key] = Array.isArray(value) ? String(value[0]) : String(value);
    });
  }

  return {
    message: body?.message ?? e?.message ?? "Something went wrong. Try again.",
    fields,
  };
}
