"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export type CalendarView = "month" | "week" | "day";

interface CalendarHeaderProps {
  currentView: CalendarView;
  title: string;
  onChangeView: (view: CalendarView) => void;
  onCreateTask: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const views: Array<{ id: CalendarView; label: string }> = [
  { id: "month", label: "Mês" },
  { id: "week", label: "Semana" },
  { id: "day", label: "Dia" }
];

export function CalendarHeader({
  currentView,
  title,
  onChangeView,
  onCreateTask,
  onNext,
  onPrevious
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <button
          aria-label="Período anterior"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-tf-border text-tf-text-muted transition hover:bg-tf-bg-page"
          onClick={onPrevious}
          type="button"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          aria-label="Próximo período"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-tf-border text-tf-text-muted transition hover:bg-tf-bg-page"
          onClick={onNext}
          type="button"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <h2 className="ml-2 text-[15px] font-medium capitalize text-tf-text-primary">
          {title}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          {views.map((view) => (
            <button
              className={cn(
                "h-7 rounded-md border border-tf-border px-2.5 text-[11px] font-medium transition",
                currentView === view.id
                  ? "bg-tf-border-light text-tf-text-primary"
                  : "text-tf-text-muted hover:bg-tf-bg-page"
              )}
              key={view.id}
              onClick={() => onChangeView(view.id)}
              type="button"
            >
              {view.label}
            </button>
          ))}
        </div>
        <Button onClick={onCreateTask} type="button">
          <Plus className="h-3.5 w-3.5" />
          Nova tarefa
        </Button>
      </div>
    </div>
  );
}
