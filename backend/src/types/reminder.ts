export interface Reminder {
  id: string;
  task_id: string;
  user_id: string;
  minutes_before: number;
  sent_at: string | null;
  created_at: string;
}

export interface ReminderRow {
  id: string;
  task_id: string;
  user_id: string;
  minutes_before: number;
  sent_at: Date | string | null;
  created_at: Date | string;
}
