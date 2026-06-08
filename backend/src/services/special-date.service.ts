import { sql } from "../config/db";

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

interface SpecialDateRow {
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
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CreateSpecialDateInput {
  name: string;
  month: number;
  day: number;
  notify_on_day?: boolean;
  notify_1_day_before?: boolean;
  notify_1_week_before?: boolean;
  notify_1_month_before?: boolean;
}

export interface UpdateSpecialDateInput {
  name?: string;
  month?: number;
  day?: number;
  active?: boolean;
  notify_on_day?: boolean;
  notify_1_day_before?: boolean;
  notify_1_week_before?: boolean;
  notify_1_month_before?: boolean;
}

// Dia das Mães = 2° domingo de maio (dia 14 como aproximação — varia por ano)
// Dia dos Pais = 2° domingo de agosto (dia 9 como aproximação — varia por ano)
const NATIONAL_DATES = [
  { name: "Dia da Mulher", month: 3, day: 8 },
  { name: "Dia dos Namorados", month: 6, day: 12 },
  { name: "Dia das Crianças", month: 10, day: 12 },
  { name: "Dia das Mães", month: 5, day: 14 },
  { name: "Dia dos Pais", month: 8, day: 9 }
] as const;

export async function getSpecialDates(userId: string): Promise<SpecialDate[]> {
  const rows = await sql<SpecialDateRow[]>`
    SELECT id, user_id, name, month, day, is_national, active,
           notify_on_day, notify_1_day_before, notify_1_week_before,
           notify_1_month_before, created_at, updated_at
    FROM special_dates
    WHERE user_id = ${userId}
    ORDER BY month ASC, day ASC
  `;
  return rows.map(toSpecialDate);
}

export async function createSpecialDate(
  data: CreateSpecialDateInput,
  userId: string
): Promise<SpecialDate> {
  const rows = await sql<SpecialDateRow[]>`
    INSERT INTO special_dates (
      user_id, name, month, day,
      notify_on_day, notify_1_day_before, notify_1_week_before, notify_1_month_before
    )
    VALUES (
      ${userId}, ${data.name}, ${data.month}, ${data.day},
      ${data.notify_on_day ?? true},
      ${data.notify_1_day_before ?? false},
      ${data.notify_1_week_before ?? false},
      ${data.notify_1_month_before ?? false}
    )
    RETURNING id, user_id, name, month, day, is_national, active,
              notify_on_day, notify_1_day_before, notify_1_week_before,
              notify_1_month_before, created_at, updated_at
  `;
  return toSpecialDate(rows[0]);
}

export async function updateSpecialDate(
  id: string,
  data: UpdateSpecialDateInput,
  userId: string
): Promise<SpecialDate | null> {
  const rows = await sql<SpecialDateRow[]>`
    UPDATE special_dates SET
      name                  = COALESCE(${data.name ?? null}, name),
      month                 = COALESCE(${data.month ?? null}, month),
      day                   = COALESCE(${data.day ?? null}, day),
      active                = COALESCE(${data.active ?? null}, active),
      notify_on_day         = COALESCE(${data.notify_on_day ?? null}, notify_on_day),
      notify_1_day_before   = COALESCE(${data.notify_1_day_before ?? null}, notify_1_day_before),
      notify_1_week_before  = COALESCE(${data.notify_1_week_before ?? null}, notify_1_week_before),
      notify_1_month_before = COALESCE(${data.notify_1_month_before ?? null}, notify_1_month_before)
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, user_id, name, month, day, is_national, active,
              notify_on_day, notify_1_day_before, notify_1_week_before,
              notify_1_month_before, created_at, updated_at
  `;
  return rows[0] ? toSpecialDate(rows[0]) : null;
}

export async function deleteSpecialDate(
  id: string,
  userId: string
): Promise<{ deleted: true } | null> {
  const rows = await sql<{ id: string }[]>`
    DELETE FROM special_dates
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;
  return rows.length > 0 ? { deleted: true } : null;
}

export async function initNationalDatesForUser(userId: string): Promise<void> {
  const existing = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM special_dates
    WHERE user_id = ${userId} AND is_national = true
  `;

  if ((existing[0]?.count ?? 0) > 0) {
    return;
  }

  for (const date of NATIONAL_DATES) {
    await sql`
      INSERT INTO special_dates (user_id, name, month, day, is_national, active)
      VALUES (${userId}, ${date.name}, ${date.month}, ${date.day}, true, false)
    `;
  }
}

function toSpecialDate(row: SpecialDateRow): SpecialDate {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    month: row.month,
    day: row.day,
    is_national: row.is_national,
    active: row.active,
    notify_on_day: row.notify_on_day,
    notify_1_day_before: row.notify_1_day_before,
    notify_1_week_before: row.notify_1_week_before,
    notify_1_month_before: row.notify_1_month_before,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
    updated_at:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : row.updated_at
  };
}
