"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { AdminUser, ApiResponse, User, UserRole } from "@/types";

export interface AdminUsersFilters {
  search?: string;
  role?: UserRole;
  active?: boolean;
}

export interface CreateAdminUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateAdminUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  active?: boolean;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (filters: AdminUsersFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();

      if (filters.search?.trim()) {
        query.set("search", filters.search.trim());
      }

      if (filters.role) {
        query.set("role", filters.role);
      }

      if (filters.active !== undefined) {
        query.set("active", String(filters.active));
      }

      const response = await apiFetch<AdminUser[]>(
        `/admin/users${query.size ? `?${query.toString()}` : ""}`
      );
      const data = response.data ?? [];
      setUsers(data);
      return data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar usuários.";
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (data: CreateAdminUserInput) => {
    setError(null);

    try {
      const response = await apiFetch<User>("/admin/users", {
        method: "POST",
        body: JSON.stringify(data)
      });
      const user: AdminUser = {
        ...unwrapData(response),
        instance_status: null
      };
      setUsers((current) => [user, ...current]);
      return user;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao criar usuário.";
      setError(message);
      throw error;
    }
  }, []);

  const updateUser = useCallback(
    async (id: string, data: UpdateAdminUserInput) => {
      let previousUsers: AdminUser[] = [];

      setUsers((current) => {
        previousUsers = current;
        return current.map((user) =>
          user.id === id ? { ...user, ...data } : user
        );
      });
      setError(null);

      try {
        const response = await apiFetch<User>(`/admin/users/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data)
        });
        const user = unwrapData(response);

        setUsers((current) =>
          current.map((item) => {
            if (item.id !== id) {
              return item;
            }

            return {
              ...user,
              instance_status: item.instance_status
            };
          })
        );
        return { ...user, instance_status: null };
      } catch (error) {
        setUsers(previousUsers);
        const message =
          error instanceof Error ? error.message : "Erro ao atualizar usuário.";
        setError(message);
        throw error;
      }
    },
    []
  );

  const toggleActive = useCallback(
    (id: string, active: boolean) => updateUser(id, { active }),
    [updateUser]
  );

  return {
    users,
    loading,
    error,
    total: users.length,
    fetchUsers,
    createUser,
    updateUser,
    toggleActive
  };
}

function unwrapData<TData>(response: ApiResponse<TData>) {
  if (!response.data) {
    throw new Error("Resposta inválida da API.");
  }

  return response.data;
}
