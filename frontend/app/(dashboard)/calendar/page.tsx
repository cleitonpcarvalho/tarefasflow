"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarHeader,
  type CalendarView
} from "@/components/calendar/CalendarHeader";
import { apiFetch } from "@/lib/api";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { DayView } from "@/components/calendar/DayView";
import { DayPanel } from "@/components/calendar/DayPanel";
import { MobileDaySheet } from "@/components/calendar/MobileDaySheet";
import { WeekView } from "@/components/calendar/WeekView";
import { ReminderModal } from "@/components/tasks/ReminderModal";
import { RecurringDeleteModal } from "@/components/tasks/RecurringDeleteModal";
import { TaskModal } from "@/components/tasks/TaskModal";
import { useTasks } from "@/hooks/useTasks";
import {
  formatDayTitle,
  formatMonthYear,
  parseDateKey,
  todayKey,
  toDateKey
} from "@/lib/date";
import type { CreateTaskInput, Task } from "@/types";

export default function CalendarPage() {
  const now = new Date();
  const [currentView, setCurrentView] = useState<CalendarView>("month");
  const [viewDate, setViewDate] = useState(now);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayKey());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskForReminder, setTaskForReminder] = useState<Task | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string | null>(null);
  const [modalInitialTime, setModalInitialTime] = useState<string | null>(null);
  const [dayPanelOpen, setDayPanelOpen] = useState(true);
  const [dayPanelWidth, setDayPanelWidth] = useState(240);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [resizingDayPanel, setResizingDayPanel] = useState(false);
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);
  const {
    tasks,
    loading,
    error,
    fetchTasks,
    fetchTasksForRange,
    fetchTasksByDate,
    createTask,
    updateTask,
    toggleDone,
    deleteTask
  } = useTasks();

  const [onboardingStatus, setOnboardingStatus] = useState<{
    onboarding_completed: boolean;
    onboarding_skipped: boolean;
    instance_status: string | null;
  } | null>(null);
  const [dismissedOnboarding, setDismissedOnboarding] = useState(false);
  const [onboardingStatusError, setOnboardingStatusError] = useState("");

  useEffect(() => {
    apiFetch<{
      onboarding_completed: boolean;
      onboarding_skipped: boolean;
      instance_status: string | null;
    }>(
      "/profile/onboarding-status"
    )
      .then((res) => {
        if (res.data) {
          setOnboardingStatus(res.data);
          setOnboardingStatusError("");
        }
      })
      .catch((fetchError) => {
        console.error("Erro ao carregar status do onboarding.", fetchError);
        setOnboardingStatusError(
          "Não foi possível carregar o status da configuração. Tente novamente mais tarde."
        );
      });
  }, []);

  async function handleDismissOnboarding() {
    setDismissedOnboarding(true);
    try {
      await apiFetch("/profile/skip-onboarding", { method: "POST" });
    } catch (dismissError) {
      console.error("Erro ao dispensar aviso do onboarding.", dismissError);
      setDismissedOnboarding(false);
      setOnboardingStatusError(
        "Não foi possível dispensar o aviso de configuração. Tente novamente."
      );
    }
  }

  const effectiveSelectedDate = selectedDate ?? todayKey();
  const currentMonth = viewDate.getMonth() + 1;
  const currentYear = viewDate.getFullYear();
  const whatsappDisconnected =
    onboardingStatus?.instance_status !== "open";
  const showOnboardingReminder =
    !onboardingStatus?.onboarding_completed &&
    !onboardingStatus?.onboarding_skipped &&
    !dismissedOnboarding;
  const selectedTasks = useMemo(
    () => fetchTasksByDate(effectiveSelectedDate),
    [effectiveSelectedDate, fetchTasksByDate]
  );

  useEffect(() => {
    if (currentView === "week") {
      const [weekStart, weekEnd] = getWeekRange(viewDate);
      void fetchTasksForRange(weekStart, weekEnd);
      return;
    }

    void fetchTasks(currentMonth, currentYear);
  }, [
    currentMonth,
    currentView,
    currentYear,
    fetchTasks,
    fetchTasksForRange,
    viewDate
  ]);

  useEffect(() => {
    const storedWidth = Number(
      window.localStorage.getItem("taskflow_panel_width")
    );

    if (Number.isFinite(storedWidth) && storedWidth >= 200 && storedWidth <= 480) {
      setDayPanelWidth(storedWidth);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "taskflow_panel_width",
      String(dayPanelWidth)
    );
  }, [dayPanelWidth]);

  useEffect(() => {
    if (!resizingDayPanel) {
      return;
    }

    function handleMouseMove(event: MouseEvent) {
      setDayPanelWidth(
        Math.min(480, Math.max(200, window.innerWidth - event.clientX))
      );
    }

    function handleMouseUp() {
      setResizingDayPanel(false);
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingDayPanel]);

  function movePeriod(direction: number) {
    const nextDate = new Date(viewDate);

    if (currentView === "month") {
      nextDate.setDate(1);
      nextDate.setMonth(nextDate.getMonth() + direction);
    } else if (currentView === "week") {
      nextDate.setDate(nextDate.getDate() + direction * 7);
    } else {
      nextDate.setDate(nextDate.getDate() + direction);
    }

    setViewDate(nextDate);
    setSelectedDate(toDateKey(nextDate));
  }

  function handleCreateTask(date: string, time?: string) {
    setTaskToEdit(null);
    setModalInitialDate(date);
    setModalInitialTime(time ?? null);
    setIsTaskModalOpen(true);
  }

  async function handleSaveTask(data: CreateTaskInput) {
    if (taskToEdit) {
      await updateTask(taskToEdit.id, data);
      return;
    }

    await createTask(data);
  }

  function handleEditTask(task: Task) {
    setTaskToEdit(task);
    setModalInitialDate(task.task_date);
    setModalInitialTime(task.task_time);
    setIsTaskModalOpen(true);
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

  function handleAddReminder(task: Task) {
    setTaskForReminder(task);
    setIsReminderModalOpen(true);
  }

  function handleCloseTaskModal() {
    setIsTaskModalOpen(false);
    setTaskToEdit(null);
    setModalInitialDate(null);
    setModalInitialTime(null);
  }

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setViewDate(parseDateKey(date));

    if (isMobile) {
      setIsMobileSheetOpen(true);
    }
  }

  function handleChangeView(view: CalendarView) {
    setCurrentView(view);
    setViewDate(parseDateKey(effectiveSelectedDate));
  }

  return (
    <section className="flex h-[calc(100vh-56px)] overflow-hidden">
      <div className="min-w-0 flex-1 overflow-y-auto p-5">
        {error ? (
          <p className="mb-3 rounded-md bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700">
            {error}
          </p>
        ) : null}

        {onboardingStatusError ? (
          <p className="mb-3 rounded-md bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700">
            {onboardingStatusError}
          </p>
        ) : null}

        {onboardingStatus ? (
          whatsappDisconnected ? (
            <div
              className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F59E0B] bg-[#FFF8E7] px-4 py-3 dark:border-amber-700 dark:bg-amber-900/30"
            >
              <span className="text-sm font-medium text-[#92400E] dark:text-amber-200">
                ⚠️ Seu agente ainda não está conectado. Conecte seu WhatsApp para começar a receber lembretes.
              </span>
              <Link
                className="shrink-0 rounded-lg bg-[#534AB7] px-4 py-2 text-sm font-semibold text-white"
                href="/onboarding"
              >
                Conectar WhatsApp
              </Link>
            </div>
          ) : showOnboardingReminder ? (
            <div
              className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-tf-border bg-white px-4 py-3 dark:border-tf-dark-border dark:bg-tf-dark-bg-card"
            >
              <span className="text-sm font-medium text-tf-text-primary dark:text-tf-dark-text-primary">
                🚀 Complete a configuração do TarefasFlow para aproveitar todos os recursos.
              </span>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  className="rounded-lg bg-[#534AB7] px-4 py-2 text-sm font-semibold text-white"
                  href="/onboarding"
                >
                  Continuar configuração
                </Link>
                <button
                  className="text-sm font-medium text-tf-text-muted hover:underline dark:text-tf-dark-text-muted"
                  onClick={() => void handleDismissOnboarding()}
                  type="button"
                >
                  Dispensar
                </button>
              </div>
            </div>
          ) : null
        ) : null}

        <div className={loading ? "space-y-3 opacity-60" : "space-y-3"}>
          <CalendarHeader
            currentView={currentView}
            onChangeView={handleChangeView}
            onCreateTask={() => handleCreateTask(effectiveSelectedDate)}
            onNext={() => movePeriod(1)}
            onPrevious={() => movePeriod(-1)}
            title={getCalendarTitle(currentView, viewDate)}
          />

          {currentView === "month" ? (
            <CalendarGrid
              currentMonth={currentMonth}
              currentYear={currentYear}
              onSelectDate={handleSelectDate}
              selectedDate={effectiveSelectedDate}
              tasks={tasks}
            />
          ) : null}

          {currentView === "week" ? (
            <WeekView
              currentDate={viewDate}
              onCreateTask={handleCreateTask}
              onSelectTask={handleEditTask}
              tasks={tasks}
            />
          ) : null}

          {currentView === "day" ? (
            <DayView
              date={toDateKey(viewDate)}
              onCreateTask={handleCreateTask}
              onDeleteTask={handleDeleteTask}
              onSelectTask={handleEditTask}
              tasks={tasks.filter(
                (task) => task.task_date === toDateKey(viewDate)
              )}
            />
          ) : null}
        </div>
      </div>

      {currentView === "month" ? (
        <div className="hidden lg:block">
          <DayPanel
            date={effectiveSelectedDate}
            onAddReminder={handleAddReminder}
            onCreateTask={() => handleCreateTask(effectiveSelectedDate)}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
            onToggleDone={toggleDone}
            onToggleOpen={() => setDayPanelOpen((current) => !current)}
            onResizeStart={(event) => {
              event.preventDefault();
              setResizingDayPanel(true);
            }}
            open={dayPanelOpen}
            resizing={resizingDayPanel}
            tasks={selectedTasks}
            width={dayPanelWidth}
          />
        </div>
      ) : null}

      {isMobile ? (
        <MobileDaySheet
          date={selectedDate}
          isOpen={isMobileSheetOpen}
          onAddReminder={handleAddReminder}
          onClose={() => setIsMobileSheetOpen(false)}
          onCreateTask={() => {
            setIsMobileSheetOpen(false);
            setIsTaskModalOpen(true);
          }}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
          onToggleDone={toggleDone}
          tasks={selectedTasks}
        />
      ) : null}

      <TaskModal
        initialDate={modalInitialDate ?? undefined}
        initialTime={modalInitialTime ?? undefined}
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        onSave={handleSaveTask}
        task={taskToEdit}
      />

      {taskForReminder ? (
        <ReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
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

function getWeekRange(date: Date): [Date, Date] {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return [start, end];
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mql.addEventListener("change", handler);

    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

function getCalendarTitle(view: CalendarView, date: Date) {
  if (view === "month") {
    return formatMonthYear(date.getMonth() + 1, date.getFullYear());
  }

  if (view === "day") {
    return formatDayTitle(toDateKey(date));
  }

  const [start, end] = getWeekRange(date);
  const startLabel = start.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short"
  });
  const endLabel = end.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  return `${startLabel} – ${endLabel}`;
}
