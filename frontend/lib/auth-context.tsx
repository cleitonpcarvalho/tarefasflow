"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer
} from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { User } from "@/types";
import {
  clearAuthStorage,
  getAuthToken,
  getStoredUser,
  getUserFromToken,
  setAuthCookie,
  setAuthToken,
  setStoredUser
} from "./auth";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

type AuthAction =
  | { type: "LOGIN"; user: User; token: string }
  | { type: "LOGOUT" }
  | { type: "LOAD_FROM_STORAGE"; user: User | null; token: string | null };

interface AuthContextValue extends AuthState {
  login: (user: User, token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: true
};

const AuthContext = createContext<AuthContextValue | null>(null);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN":
      return {
        user: action.user,
        token: action.token,
        loading: false
      };
    case "LOGOUT":
      return {
        user: null,
        token: null,
        loading: false
      };
    case "LOAD_FROM_STORAGE":
      return {
        user: action.user,
        token: action.token,
        loading: false
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  const login = useCallback((user: User, token: string) => {
    setAuthToken(token);
    setAuthCookie(token);
    setStoredUser(user);
    dispatch({ type: "LOGIN", user, token });
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    dispatch({ type: "LOGOUT" });
    router.replace("/login");
  }, [router]);

  const loadFromStorage = useCallback(() => {
    const token = getAuthToken();
    const user = getStoredUser() ?? getUserFromToken();
    dispatch({
      type: "LOAD_FROM_STORAGE",
      user: token ? user : null,
      token
    });
  }, []);

  useEffect(() => {
    loadFromStorage();

    function handleLogout() {
      logout();
    }

    window.addEventListener("taskflow:logout", handleLogout);

    return () => {
      window.removeEventListener("taskflow:logout", handleLogout);
    };
  }, [loadFromStorage, logout]);

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
      loadFromStorage
    }),
    [state, login, logout, loadFromStorage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return context;
}
