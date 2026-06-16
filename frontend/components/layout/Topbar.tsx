"use client";

import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface TopbarProps {
  onMenuClick: () => void;
}

const titles: Record<string, string> = {
  "/calendar": "Calendário",
  "/tasks": "Tarefas",
  "/reminders": "Lembretes",
  "/whatsapp": "WhatsApp",
  "/admin/users": "Usuários",
  "/settings": "Configurações"
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-tf-border bg-white dark:border-tf-dark-border dark:bg-tf-dark-bg-card">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label="Abrir menu"
            className="flex h-8 w-8 items-center justify-center rounded-md text-tf-text-muted hover:bg-tf-bg-page dark:text-tf-dark-text-muted dark:hover:bg-tf-dark-bg-sidebar md:hidden"
            onClick={onMenuClick}
            type="button"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <p className="truncate text-[11px] text-tf-text-faint dark:text-tf-dark-text-faint">
              Workspace
            </p>
            <h2 className="truncate text-[15px] font-semibold text-tf-text-primary dark:text-tf-dark-text-primary">
              {titles[pathname] ?? "TarefasFlow"}
            </h2>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-4">
          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-[13px] font-medium text-tf-text-primary dark:text-tf-dark-text-primary">
              {user?.name ?? "Usuário"}
            </p>
            <p className="truncate text-[11px] text-tf-text-faint dark:text-tf-dark-text-faint">
              {user?.email}
            </p>
          </div>

          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-md text-[12px] font-medium text-tf-text-muted transition hover:text-tf-text-primary dark:text-tf-dark-text-muted dark:hover:text-tf-dark-text-primary"
            onClick={logout}
            type="button"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
