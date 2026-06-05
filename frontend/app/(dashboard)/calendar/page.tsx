"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { DayPanel } from "@/components/calendar/DayPanel";
import { ReminderModal } from "@/components/tasks/ReminderModal";
import { TaskModal } from "@/components/tasks/TaskModal";
import { useTasks } from "@/hooks/useTasks";
import { todayKey } from "@/lib/date";
import type { CreateTaskInput, Task } from "@/types";

export default function CalendarPage() {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(todayKey());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskForReminder, setTaskForReminder] = useState<Task | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string | null>(null);
  const [dayPanelOpen, setDayPanelOpen] = useState(true);
  const {
    tasks,
    loading,
    error,
    fetchTasks,
    fetchTasksByDate,
    createTask,
    updateTask,
    toggleDone,
    deleteTask
  } = useTasks();

  const effectiveSelectedDate = selectedDate ?? todayKey();
  const selectedTasks = useMemo(
    () => fetchTasksByDate(effectiveSelectedDate),
    [effectiveSelectedDate, fetchTasksByDate]
  );

  useEffect(() => {
    void fetchTasks(currentMonth, currentYear);
  }, [currentMonth, currentYear, fetchTasks]);

  function moveMonth(direction: number) {
    const nextDate = new Date(currentYear, currentMonth - 1 + direction, 1);
    setCurrentMonth(nextDate.getMonth() + 1);
    setCurrentYear(nextDate.getFullYear());
    setSelectedDate(toMonthDateKey(nextDate));
  }

  function handleCreateTask(date: string) {
    setTaskToEdit(null);
    setModalInitialDate(date);
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
    setIsTaskModalOpen(true);
  }

  async function handleDeleteTask(id: string) {
    await deleteTask(id);
  }

  function handleAddReminder(task: Task) {
    setTaskForReminder(task);
    setIsReminderModalOpen(true);
  }

  function handleCloseTaskModal() {
    setIsTaskModalOpen(false);
    setTaskToEdit(null);
    setModalInitialDate(null);
  }

  return (
    <section className="flex h-[calc(100vh-56px)] overflow-hidden">
      <div className="min-w-0 flex-1 overflow-y-auto p-5">
        {error ? (
          <p className="mb-3 rounded-md bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700">
            {error}
          </p>
        ) : null}

        <div className={loading ? "opacity-60" : ""}>
          <CalendarGrid
            currentMonth={currentMonth}
            currentYear={currentYear}
            onCreateTask={handleCreateTask}
            onNextMonth={() => moveMonth(1)}
            onPrevMonth={() => moveMonth(-1)}
            onSelectDate={setSelectedDate}
            selectedDate={effectiveSelectedDate}
            tasks={tasks}
          />
        </div>
      </div>

      <div className="hidden lg:block">
        <DayPanel
          date={effectiveSelectedDate}
          onAddReminder={handleAddReminder}
          onCreateTask={() => handleCreateTask(effectiveSelectedDate)}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
          onToggleDone={toggleDone}
          onToggleOpen={() => setDayPanelOpen((current) => !current)}
          open={dayPanelOpen}
          tasks={selectedTasks}
        />
      </div>

      <TaskModal
        initialDate={modalInitialDate ?? undefined}
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
    </section>
  );
}

function toMonthDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
}
