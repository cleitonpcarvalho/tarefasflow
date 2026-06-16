import type { ApiResponse } from "@/types";
import { clearAuthStorage, getAuthToken } from "./auth";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export class ApiFetchError extends Error {
  status: number;
  error: ApiResponse["error"];

  constructor(message: string, status: number, error: ApiResponse["error"]) {
    super(message);
    this.name = "ApiFetchError";
    this.status = status;
    this.error = error;
  }
}

export async function apiFetch<TData>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<TData>> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAuthToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(
    `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`,
    {
      ...options,
      headers
    }
  );

  const payload = (await response.json().catch(() => null)) as ApiResponse<TData> | null;

  if (!response.ok || !payload?.success) {
    if (response.status === 401 && typeof window !== "undefined") {
      clearAuthStorage();
      window.dispatchEvent(new Event("taskflow:logout"));

      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    throw new ApiFetchError(
      typeof payload?.error === "string"
        ? payload.error
        : payload?.message ?? "Erro ao chamar a API.",
      response.status,
      payload?.error ?? "HTTP_ERROR"
    );
  }

  return payload;
}
