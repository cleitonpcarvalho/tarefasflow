export type UserRole = "admin" | "user";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active?: boolean;
  whatsapp_phone: string | null;
  createdAt: string;
  updatedAt?: string;
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

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  task_date: string;
  task_time?: string | null;
  color?: TaskColor;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  task_date?: string;
  task_time?: string | null;
  color?: TaskColor;
  done?: boolean;
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

export interface AuthorizedNumber extends AuthorizedNumberPermissions {
  id: string;
  instance_id: string;
  user_id: string;
  phone: string;
  label: string | null;
  active: boolean;
  created_at: string;
}
