import type { User } from "@/types";

const tokenKey = "taskflow_token";
const userKey = "taskflow_user";
const cookieMaxAge = 60 * 60 * 24 * 7;

interface JwtUserPayload {
  id: string;
  email: string;
  role: User["role"];
  name?: string;
  active?: boolean;
  whatsapp_phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(tokenKey);
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(tokenKey, token);
  }
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(tokenKey);
  }
}

export function setAuthCookie(token: string) {
  if (typeof document !== "undefined") {
    const isHttps = window.location.protocol === "https:";
    const secureFlag = isHttps ? "; Secure" : "";
    document.cookie = `${tokenKey}=${token}; path=/; max-age=${cookieMaxAge}; SameSite=Lax${secureFlag}`;
  }
}

export function clearAuthCookie() {
  if (typeof document !== "undefined") {
    document.cookie = `${tokenKey}=; path=/; max-age=0; samesite=lax`;
  }
}

export function setStoredUser(user: User) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(userKey, JSON.stringify(user));
  }
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = window.localStorage.getItem(userKey);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    window.localStorage.removeItem(userKey);
    return null;
  }
}

export function clearStoredUser() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(userKey);
  }
}

export function clearAuthStorage() {
  clearAuthToken();
  clearAuthCookie();
  clearStoredUser();
}

export function getUserFromToken(): User | null {
  const token = getAuthToken();

  if (!token) {
    return null;
  }

  try {
    const payload = decodeJwtPayload<JwtUserPayload>(token);

    return {
      id: payload.id,
      name: payload.name ?? "Usuário TarefasFlow",
      email: payload.email,
      role: payload.role,
      active: payload.active ?? true,
      whatsapp_phone: payload.whatsapp_phone ?? null,
      createdAt: payload.createdAt ?? "",
      updatedAt: payload.updatedAt ?? ""
    };
  } catch {
    return null;
  }
}

function decodeJwtPayload<TPayload>(token: string): TPayload {
  const [, payload] = token.split(".");

  if (!payload) {
    throw new Error("Token JWT invalido.");
  }

  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = window.atob(normalized);

  return JSON.parse(json) as TPayload;
}
