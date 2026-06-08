"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Calendar,
  CheckSquare,
  Gift,
  MessageCircle,
  Settings,
  Users,
  X
} from "lucide-react";
import { cn } from "@/lib/cn";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import type { Task } from "@/types";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const mainLinks = [
  { href: "/calendar", label: "Calendário", icon: Calendar },
  { href: "/tasks", label: "Tarefas", icon: CheckSquare, showBadge: true },
  { href: "/reminders", label: "Lembretes", icon: Bell },
  { href: "/special-dates", label: "Datas Especiais", icon: Gift },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/settings", label: "Configurações", icon: Settings }
];

const adminLinks = [
  { href: "/admin/users", label: "Usuários", icon: Users }
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [pendingTasks, setPendingTasks] = useState(0);
  const visibleAdminLinks = user?.role === "admin" ? adminLinks : [];

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    async function loadPendingTasks() {
      try {
        const response = await apiFetch<Task[]>("/tasks");

        if (!cancelled) {
          setPendingTasks((response.data ?? []).filter((task) => !task.done).length);
        }
      } catch {
        if (!cancelled) {
          setPendingTasks(0);
        }
      }
    }

    void loadPendingTasks();

    return () => {
      cancelled = true;
    };
  }, [pathname, user]);

  return (
    <>
      {open ? (
        <button
          aria-label="Fechar menu lateral"
          className="fixed inset-0 z-30 bg-slate-950/35 md:hidden"
          onClick={onClose}
          type="button"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-screen w-[220px] flex-col border-r border-tf-border bg-tf-bg-sidebar transition-transform duration-200 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-5 pb-6 pt-5">
          <div className="flex items-center justify-between gap-3">
            <Link className="flex items-center" href="/calendar">
              <BrandLogo compact />
            </Link>
            <button
              aria-label="Fechar menu"
              className="flex h-8 w-8 items-center justify-center rounded-md text-tf-text-muted hover:bg-tf-bg-page md:hidden"
              onClick={onClose}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mx-5 h-px bg-tf-border-light" />

        <nav className="flex-1 overflow-y-auto px-3">
          <NavSection label="Menu">
            {mainLinks.map((item) => (
              <NavItem
                active={pathname === item.href}
                badge={item.showBadge && pendingTasks > 0 ? pendingTasks : null}
                href={item.href}
                icon={item.icon}
                key={item.href}
                label={item.label}
                onClick={onClose}
              />
            ))}
          </NavSection>

          {visibleAdminLinks.length > 0 ? (
            <NavSection label="Admin">
              {visibleAdminLinks.map((item) => (
                <NavItem
                  active={pathname === item.href}
                  href={item.href}
                  icon={item.icon}
                  key={item.href}
                  label={item.label}
                  onClick={onClose}
                />
              ))}
            </NavSection>
          ) : null}
        </nav>

        <div className="mt-auto border-t border-tf-border-light p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tf-purple-light text-[12px] font-semibold text-tf-purple">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-tf-text-primary">
                {user?.name ?? "TarefasFlow"}
              </p>
              <p className="truncate text-[11px] text-tf-text-faint">
                {user?.email ?? "Carregando sessão"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavSection({
  children,
  label
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="pt-4">
      <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-tf-text-faint">
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({
  active,
  badge,
  href,
  icon: Icon,
  label,
  onClick
}: {
  active: boolean;
  badge?: number | null;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-[7px] text-[13px] transition",
        active
          ? "bg-tf-purple-light font-medium text-tf-purple"
          : "text-tf-text-muted hover:bg-tf-bg-page"
      )}
      href={href}
      onClick={onClick}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge ? (
        <span className="rounded-full bg-tf-purple px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function getInitials(name?: string) {
  if (!name) {
    return "TF";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
