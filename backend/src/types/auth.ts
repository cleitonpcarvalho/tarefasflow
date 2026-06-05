export type UserRole = "admin" | "user";

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface PublicUser extends JwtPayload {
  name: string;
  active: boolean;
  whatsapp_phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  active: boolean;
  whatsapp_phone: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}
