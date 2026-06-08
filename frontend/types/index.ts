export type UserRole = "admin" | "user";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  whatsapp_phone: string | null;
  createdAt: string;
  updatedAt: string;
}

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

export interface Reminder {
  id: string;
  task_id: string;
  user_id: string;
  minutes_before: number;
  sent_at: string | null;
  created_at: string;
}

export type TaskColor = "purple" | "teal" | "coral" | "amber";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly";
export type RecurrenceMonthlyMode = "monthDay" | "monthWeekday";

export interface RecurrenceOptions {
  frequency: RecurrenceFrequency;
  interval?: number;
  weekdays?: number[];
  monthlyMode?: RecurrenceMonthlyMode;
  monthDay?: number;
  monthWeekday?: {
    week: 1 | 2 | 3 | 4 | -1;
    day: number;
  };
  until?: Date;
  count?: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  task_date: string;
  task_time?: string | null;
  color?: TaskColor;
  rrule?: string | null;
  is_recurring?: boolean;
  recurrence_end?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  task_date?: string;
  task_time?: string | null;
  color?: TaskColor;
  done?: boolean;
  rrule?: string | null;
  is_recurring?: boolean;
  recurrence_end?: string | null;
}

export interface ApiResponse<TData = unknown> {
  success: boolean;
  data: TData | null;
  message: string | null;
  error:
    | string
    | {
        code?: string;
        detail?: string;
      }
    | null;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface WhatsappStatus {
  connected: boolean;
  name: string;
}

export interface WhatsappLog {
  id: string;
  user_id: string | null;
  direction: "inbound" | "outbound";
  content: string;
  media_type: string | null;
  processed: boolean;
  created_at: string;
}

export type WhatsappInstanceStatus = "created" | "connecting" | "open" | "close";

export interface WhatsappInstance {
  id: string;
  user_id: string;
  instance_name: string;
  instance_token: string | null;
  status: WhatsappInstanceStatus;
  phone_number: string | null;
  webhook_set: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsappQRCode {
  code: string;
  pairingCode: string | null;
}

export interface AuthorizedNumberPermissions {
  can_create_task: boolean;
  can_read_tasks: boolean;
  can_delete_task: boolean;
  can_add_reminder: boolean;
}

export interface SpecialDate {
  id: string;
  user_id: string;
  name: string;
  month: number;
  day: number;
  is_national: boolean;
  active: boolean;
  notify_on_day: boolean;
  notify_1_day_before: boolean;
  notify_1_week_before: boolean;
  notify_1_month_before: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthorizedNumber extends AuthorizedNumberPermissions {
  id: string;
  instance_id: string;
  user_id: string;
  phone: string;
  label: string | null;
  active: boolean;
  created_at: string;
}
