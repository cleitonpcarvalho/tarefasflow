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
  created_at: Date | string;
  updated_at: Date | string;
}
