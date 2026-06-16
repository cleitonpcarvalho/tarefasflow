import { CheckCircle2, Circle } from "lucide-react";
import type { Task } from "@/types";
import { Badge } from "@/components/ui/Badge";

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const StatusIcon = task.done ? CheckCircle2 : Circle;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-tf-dark-border dark:bg-tf-dark-bg-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <StatusIcon
            className={
              task.done
                ? "h-5 w-5 text-teal-500"
                : "h-5 w-5 text-slate-300 dark:text-tf-dark-text-faint"
            }
          />
          <div>
            <h2 className="text-base font-semibold text-slate-950 dark:text-tf-dark-text-primary">
              {task.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-tf-dark-text-muted">
              {task.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-3 rounded-full bg-[#534AB7]" />
          <Badge variant={task.done ? "teal" : "purple"}>
            {task.done ? "Concluida" : "Aberta"}
          </Badge>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-tf-dark-text-muted">
        <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-tf-dark-bg-sidebar">
          {task.task_date}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-tf-dark-bg-sidebar">
          {task.task_time ?? "Dia todo"}
        </span>
      </div>
    </article>
  );
}
