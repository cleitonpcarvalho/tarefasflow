"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Trash2
} from "lucide-react";
import { ReminderModal } from "@/components/tasks/ReminderModal";
import { RecurringDeleteModal } from "@/components/tasks/RecurringDeleteModal";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Button } from "@/components/ui/Button";
import { useTasks } from "@/hooks/useTasks";
import { cn } from "@/lib/cn";
import { formatCompactDate, todayKey } from "@/lib/date";
import type { CreateTaskInput, Task } from "@/types";

type TaskFilter = "all" | "pending" | "done";

const COLOR_MAP: Record<Task["color"], string> = {
  purple: "#534AB7",
  teal: "#2A9D8F",
  coral: "#E76F51",
  amber: "#E9C46A"
};

export default function TasksPage() {
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [search, setSearch] = useState("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskForReminder, setTaskForReminder] = useState<Task | null>(null);
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);
  const {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    toggleDone,
    deleteTask
  } = useTasks();

  useEffect(() => {
    const now = new Date();
    void fetchTasks(now.getMonth() + 1, now.getFullYear());
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return tasks.filter((task) => {
      if (filter === "pending" && task.done) {
        return false;
      }

      if (filter === "done" && !task.done) {
        return false;
      }

      if (
        normalizedSearch &&
        !task.title.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      return true;
    });
  }, [filter, search, tasks]);

  const groupedTasks = useMemo(() => groupTasksByDate(filteredTasks), [
    filteredTasks
  ]);

  async function handleSaveTask(data: CreateTaskInput) {
    if (taskToEdit) {
      await updateTask(taskToEdit.id, data);
      return;
    }

    await createTask(data);
  }

  function handleCloseTaskModal() {
    setIsTaskModalOpen(false);
    setTaskToEdit(null);
  }

  async function handleDeleteTask(task: Task) {
    if (task.is_recurring) {
      setTaskPendingDelete(task);
      return;
    }

    await deleteTask(task.id);
  }

  async function handleDeleteRecurringTask(scope: "this" | "all") {
    if (!taskPendingDelete) {
      return;
    }

    await deleteTask(taskPendingDelete.id, scope);
    setTaskPendingDelete(null);
  }

  return (
    <section className="space-y-5 p-5">
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-tf-dark-border dark:bg-tf-dark-bg-card lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] dark:text-tf-dark-text-primary">
            Tarefas
          </h1>
          <p className="mt-1 text-sm text-[#6b7280] dark:text-tf-dark-text-muted">
            Gerencie as tarefas do mês atual.
          </p>
        </div>

        <Button
          onClick={() => {
            setTaskToEdit(null);
            setIsTaskModalOpen(true);
          }}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Nova tarefa
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-tf-dark-border dark:bg-tf-dark-bg-card lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "Todas" },
            { id: "pending", label: "Pendentes" },
            { id: "done", label: "Concluídas" }
          ].map((item) => (
            <button
              className={cn(
                "h-9 rounded-lg px-3 text-sm font-semibold transition",
                filter === item.id
                  ? "bg-[#EEEDFE] text-[#534AB7] dark:bg-tf-dark-purple-light"
                  : "text-[#6b7280] hover:bg-[#f3f4f6] dark:text-tf-dark-text-muted dark:hover:bg-tf-dark-bg-sidebar"
              )}
              key={item.id}
              onClick={() => setFilter(item.id as TaskFilter)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="relative block w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280] dark:text-tf-dark-text-muted" />
          <input
            className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm outline-none transition focus:border-[#534AB7] focus:ring-4 focus:ring-[#EEEDFE] dark:border-tf-dark-border dark:bg-tf-dark-bg-sidebar dark:text-tf-dark-text-primary"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por título"
            value={search}
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-[#6b7280] dark:border-tf-dark-border dark:bg-tf-dark-bg-card dark:text-tf-dark-text-muted">
          Carregando tarefas...
        </p>
      ) : groupedTasks.length > 0 ? (
        <div className="space-y-5">
          {groupedTasks.map((group) => (
            <section className="space-y-3" key={group.date}>
              <h2 className="text-sm font-semibold text-[#6b7280] dark:text-tf-dark-text-muted">
                {formatCompactDate(group.date)}
              </h2>
              <div className="space-y-2">
                {group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    onDelete={() => handleDeleteTask(task)}
                    onEdit={() => {
                      setTaskToEdit(task);
                      setIsTaskModalOpen(true);
                    }}
                    onReminder={() => setTaskForReminder(task)}
                    onToggle={() => toggleDone(task.id)}
                    task={task}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-10 text-center dark:border-tf-dark-border dark:bg-tf-dark-bg-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-[#EEEDFE] text-[#534AB7] dark:bg-tf-dark-purple-light">
            <Check className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold text-[#111827] dark:text-tf-dark-text-primary">
            Nenhuma tarefa encontrada
          </h2>
          <p className="mt-1 text-sm text-[#6b7280] dark:text-tf-dark-text-muted">
            Ajuste os filtros ou crie uma nova tarefa.
          </p>
        </div>
      )}

      <TaskModal
        initialDate={todayKey()}
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        onSave={handleSaveTask}
        task={taskToEdit}
      />

      {taskForReminder ? (
        <ReminderModal
          isOpen={Boolean(taskForReminder)}
          onClose={() => setTaskForReminder(null)}
          task={taskForReminder}
        />
      ) : null}

      <RecurringDeleteModal
        onCancel={() => setTaskPendingDelete(null)}
        onDelete={handleDeleteRecurringTask}
        task={taskPendingDelete}
      />
    </section>
  );
}

function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
  onReminder
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReminder: () => void;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-tf-dark-border dark:bg-tf-dark-bg-card sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <button
          aria-label="Alternar tarefa concluída"
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition",
            task.done
              ? "border-[#534AB7] bg-[#534AB7] text-white"
              : "border-slate-300 text-transparent hover:border-[#534AB7] dark:border-tf-dark-border"
          )}
          onClick={onToggle}
          type="button"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <div className="min-w-0">
          <p className="text-xs text-[#6b7280] dark:text-tf-dark-text-muted">
            {task.task_time ?? "Dia todo"}
          </p>
          <h3
            className={cn(
              "truncate text-sm font-semibold text-[#111827] dark:text-tf-dark-text-primary",
              task.done && "line-through opacity-70"
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              {task.is_recurring ? (
                <RefreshCw className="h-3 w-3 text-[#534AB7]" />
              ) : null}
              {task.title}
            </span>
          </h3>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <span
          style={{
            display: "inline-block",
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: COLOR_MAP[task.color ?? "purple"],
            flexShrink: 0
          }}
          title={task.color}
        />
        <div className="flex items-center gap-1">
          <IconButton label="Editar" onClick={onEdit}>
            <Edit3 className="h-4 w-4" />
          </IconButton>
          <IconButton label="Lembrete" onClick={onReminder}>
            <Bell className="h-4 w-4" />
          </IconButton>
          <IconButton label="Excluir" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </article>
  );
}

function IconButton({
  children,
  label,
  onClick
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition hover:bg-[#f3f4f6] hover:text-[#111827] dark:text-tf-dark-text-muted dark:hover:bg-tf-dark-bg-sidebar dark:hover:text-tf-dark-text-primary"
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function groupTasksByDate(tasks: Task[]) {
  const sortedTasks = [...tasks].sort((left, right) => {
    const dateOrder = left.task_date.localeCompare(right.task_date);

    if (dateOrder !== 0) {
      return dateOrder;
    }

    if (left.task_time && right.task_time) {
      return left.task_time.localeCompare(right.task_time);
    }

    if (left.task_time) {
      return -1;
    }

    if (right.task_time) {
      return 1;
    }

    return left.title.localeCompare(right.title);
  });
  const groups = new Map<string, Task[]>();

  for (const task of sortedTasks) {
    groups.set(task.task_date, [...(groups.get(task.task_date) ?? []), task]);
  }

  return Array.from(groups.entries()).map(([date, groupTasks]) => ({
    date,
    tasks: groupTasks
  }));
}
