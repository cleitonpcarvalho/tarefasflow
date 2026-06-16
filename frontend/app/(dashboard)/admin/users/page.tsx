"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  Power,
  RotateCcw,
  Search,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Users
} from "lucide-react";
import { UserModal } from "@/components/admin/UserModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useConfirm } from "@/hooks/useConfirm";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth-context";
import type { AdminUser, User } from "@/types";

type UserFilter = "all" | "admin" | "user" | "inactive";

const pageSize = 10;

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    toggleActive
  } = useAdminUsers();
  const { confirm, modalProps } = useConfirm();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>("all");
  const [page, setPage] = useState(1);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const statistics = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.active).length,
      admins: users.filter((user) => user.role === "admin").length,
      whatsapp: users.filter((user) => Boolean(user.whatsapp_phone)).length,
      activeInstances: users.filter((user) => user.instance_status === "open")
        .length
    }),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");

    return users.filter((user) => {
      if (filter === "admin" && user.role !== "admin") {
        return false;
      }

      if (filter === "user" && user.role !== "user") {
        return false;
      }

      if (filter === "inactive" && user.active) {
        return false;
      }

      return (
        !query ||
        user.name.toLocaleLowerCase("pt-BR").includes(query) ||
        user.email.toLocaleLowerCase("pt-BR").includes(query)
      );
    });
  }, [filter, search, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const visibleUsers = filteredUsers.slice(
    (Math.min(page, totalPages) - 1) * pageSize,
    Math.min(page, totalPages) * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  async function handleDeactivate(user: User) {
    const accepted = await confirm({
      title: "Desativar usuário",
      message: `Desativar ${user.name}? O usuário perderá acesso ao sistema.`,
      confirmLabel: "Desativar",
      variant: "danger"
    });

    if (accepted) {
      await toggleActive(user.id, false);
    }
  }

  function openCreateModal() {
    setUserToEdit(null);
    setIsUserModalOpen(true);
  }

  function openEditModal(user: User) {
    setUserToEdit(user);
    setIsUserModalOpen(true);
  }

  return (
    <section className="space-y-5 p-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] dark:text-tf-dark-text-primary">
            Usuários
          </h1>
          <p className="mt-1 text-sm text-[#6B7280] dark:text-tf-dark-text-muted">
            Gerencie os usuários da plataforma
          </p>
        </div>
        <Button className="h-10" onClick={openCreateModal} type="button">
          <Plus className="h-4 w-4" />
          Novo usuário
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={Users}
          label="Total de usuários"
          value={statistics.total}
        />
        <StatCard icon={UserCheck} label="Ativos" value={statistics.active} />
        <StatCard icon={ShieldCheck} label="Admins" value={statistics.admins} />
        <StatCard
          icon={Smartphone}
          label="WhatsApp vinculado"
          value={statistics.whatsapp}
        />
        <StatCard
          icon={Smartphone}
          label="Instâncias ativas"
          value={statistics.activeInstances}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-tf-dark-border dark:bg-tf-dark-bg-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF] dark:text-tf-dark-text-faint" />
            <input
              aria-label="Buscar usuários"
              className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-[#534AB7] focus:ring-4 focus:ring-[#EEEDFE] dark:border-tf-dark-border dark:bg-tf-dark-bg-sidebar dark:text-tf-dark-text-primary"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome ou email"
              value={search}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              ["all", "Todos"],
              ["admin", "Admins"],
              ["user", "Usuários"],
              ["inactive", "Inativos"]
            ].map(([value, label]) => (
              <button
                className={cn(
                  "h-9 rounded-lg px-3 text-xs font-medium transition",
                  filter === value
                    ? "bg-[#EEEDFE] text-[#534AB7] dark:bg-tf-dark-purple-light"
                    : "text-[#6B7280] hover:bg-[#F3F4F6] dark:text-tf-dark-text-muted dark:hover:bg-tf-dark-bg-sidebar"
                )}
                key={value}
                onClick={() => setFilter(value as UserFilter)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-tf-dark-border dark:bg-tf-dark-bg-card">
        <div className="overflow-x-auto">
          <table className="min-w-[1160px] w-full border-collapse text-left">
            <thead className="bg-[#F9FAFB] text-[11px] uppercase tracking-wide text-[#6B7280] dark:bg-tf-dark-bg-page dark:text-tf-dark-text-muted">
              <tr>
                <TableHeader>Nome</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Role</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>WhatsApp</TableHeader>
                <TableHeader>Instância</TableHeader>
                <TableHeader>Criado em</TableHeader>
                <TableHeader className="text-right">Ações</TableHeader>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-[#6B7280] dark:text-tf-dark-text-muted"
                    colSpan={8}
                  >
                    Carregando usuários...
                  </td>
                </tr>
              ) : visibleUsers.length ? (
                visibleUsers.map((user, index) => {
                  const isCurrentUser = user.id === currentUser?.id;

                  return (
                    <tr
                      className={cn(
                        "border-t border-slate-100 text-sm transition-colors hover:bg-[#FAFAFA] dark:border-tf-dark-border-light dark:hover:bg-tf-dark-bg-page",
                        index % 2 === 1 && "bg-[#FCFCFD] dark:bg-tf-dark-bg-page/60",
                        isCurrentUser && "bg-[#FAFAFA] dark:bg-tf-dark-bg-page"
                      )}
                      key={user.id}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-xs font-semibold text-[#534AB7] dark:bg-tf-dark-purple-light">
                            {getInitials(user.name)}
                          </span>
                          <div>
                            <p className="font-medium text-[#111827] dark:text-tf-dark-text-primary">
                              {user.name}
                            </p>
                            {isCurrentUser ? (
                              <p className="text-[11px] text-[#6B7280] dark:text-tf-dark-text-muted">
                                Você
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#6B7280] dark:text-tf-dark-text-muted">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.role === "admin" ? "purple" : "slate"}>
                          {user.role === "admin" ? "Admin" : "Usuário"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.active ? "teal" : "coral"}>
                          {user.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[#6B7280] dark:text-tf-dark-text-muted">
                        {user.whatsapp_phone ? (
                          formatPhone(user.whatsapp_phone)
                        ) : (
                          <span className="text-[#9CA3AF] dark:text-tf-dark-text-faint">
                            Não vinculado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <InstanceStatusBadge status={user.instance_status} />
                      </td>
                      <td className="px-4 py-3 text-[#6B7280] dark:text-tf-dark-text-muted">
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <ActionButton
                            label={`Editar ${user.name}`}
                            onClick={() => openEditModal(user)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </ActionButton>
                          {!isCurrentUser ? (
                            user.active ? (
                              <ActionButton
                                danger
                                label={`Desativar ${user.name}`}
                                onClick={() => void handleDeactivate(user)}
                              >
                                <Power className="h-4 w-4" />
                              </ActionButton>
                            ) : (
                              <button
                                className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-[#0F6E56] hover:bg-[#E1F5EE] dark:hover:bg-tf-dark-bg-sidebar"
                                onClick={() => void toggleActive(user.id, true)}
                                type="button"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reativar
                              </button>
                            )
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-[#6B7280] dark:text-tf-dark-text-muted"
                    colSpan={8}
                  >
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-tf-dark-border-light">
          <p className="text-xs text-[#6B7280] dark:text-tf-dark-text-muted">
            {filteredUsers.length} usuário(s)
          </p>
          <div className="flex items-center gap-2">
            <button
              aria-label="Página anterior"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-[#6B7280] disabled:opacity-40 dark:border-tf-dark-border dark:text-tf-dark-text-muted"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-20 text-center text-xs font-medium text-[#374151] dark:text-tf-dark-text-muted">
              Página {Math.min(page, totalPages)} de {totalPages}
            </span>
            <button
              aria-label="Próxima página"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-[#6B7280] disabled:opacity-40 dark:border-tf-dark-border dark:text-tf-dark-text-muted"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <UserModal
        canChangeActive={userToEdit?.id !== currentUser?.id}
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onCreate={async (data) => {
          await createUser(data);
        }}
        onUpdate={async (id, data) => {
          await updateUser(id, data);
        }}
        user={userToEdit}
      />
      <ConfirmModal {...modalProps} />
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-tf-dark-border dark:bg-tf-dark-bg-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#6B7280] dark:text-tf-dark-text-muted">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-[#111827] dark:text-tf-dark-text-primary">
            {value}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEEDFE] text-[#534AB7] dark:bg-tf-dark-purple-light">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function TableHeader({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <th className={cn("px-4 py-3 font-semibold", className)}>{children}</th>;
}

function ActionButton({
  children,
  danger,
  label,
  onClick
}: {
  children: React.ReactNode;
  danger?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-[#6B7280] hover:bg-[#F3F4F6]",
        "dark:text-tf-dark-text-muted dark:hover:bg-tf-dark-bg-sidebar",
        danger && "hover:bg-rose-50 hover:text-rose-600"
      )}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function InstanceStatusBadge({
  status
}: {
  status: AdminUser["instance_status"];
}) {
  if (status === "open") {
    return <Badge variant="teal">Conectado</Badge>;
  }

  if (status === "connecting") {
    return <Badge variant="amber">Conectando</Badge>;
  }

  if (status === "created") {
    return <Badge variant="amber">Aguardando QR</Badge>;
  }

  return <Badge variant="slate">Desconectado</Badge>;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatPhone(phone: string) {
  if (phone.length === 13 && phone.startsWith("55")) {
    return `+55 (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
  }

  return `+${phone}`;
}
