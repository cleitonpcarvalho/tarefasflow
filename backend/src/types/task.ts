export type TaskColor = "purple" | "teal" | "coral" | "amber";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  task_date: string;
  task_time: string | null;
  color: TaskColor;
  done: boolean;
  rrule: string | null;
  is_recurring: boolean;
  parent_id: string | null;
  recurrence_end: string | null;
  excluded_dates: string[];
  done_dates: string[];
  is_virtual?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  task_date: Date | string;
  task_time: string | null;
  color: TaskColor;
  done: boolean;
  rrule: string | null;
  is_recurring: boolean;
  parent_id: string | null;
  recurrence_end: Date | string | null;
  excluded_dates: string[];
  done_dates: string[];
  created_at: Date | string;
  updated_at: Date | string;
}
