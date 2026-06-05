import { sql } from "../config/db";
import type { UserRole } from "../types/auth";

export type WhatsappLogDirection = "inbound" | "outbound";

interface RequesterContext {
  requesterId: string;
  requesterRole: UserRole;
}

export interface WhatsappLog {
  id: string;
  user_id: string | null;
  direction: WhatsappLogDirection;
  content: string;
  media_type: string | null;
  processed: boolean;
  created_at: string;
}

interface WhatsappLogRow {
  id: string;
  user_id: string | null;
  direction: WhatsappLogDirection;
  content: string;
  media_type: string | null;
  processed: boolean;
  created_at: Date | string;
}

export interface CreateWhatsappLogData {
  userId?: string | null;
  direction: WhatsappLogDirection;
  content: string;
  mediaType?: string | null;
  processed?: boolean;
}

export interface WhatsappLogFilters {
  direction?: WhatsappLogDirection;
  limit?: number;
}

const whatsappLogSelectColumns = `
  id, user_id, direction, content, media_type, processed, created_at
`;

export async function createWhatsappLog({
  userId = null,
  direction,
  content,
  mediaType = null,
  processed = false
}: CreateWhatsappLogData): Promise<WhatsappLog> {
  const rows = await sql<WhatsappLogRow[]>`
    INSERT INTO whatsapp_logs (
      user_id, direction, content, media_type, processed
    )
    VALUES (
      ${userId},
      ${direction},
      ${content},
      ${mediaType},
      ${processed}
    )
    RETURNING id, user_id, direction, content, media_type, processed, created_at
  `;

  return toWhatsappLog(rows[0]);
}

export async function listWhatsappLogs({
  requesterId,
  requesterRole,
  filters = {}
}: RequesterContext & { filters?: WhatsappLogFilters }): Promise<WhatsappLog[]> {
  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (requesterRole === "user") {
    params.push(requesterId);
    conditions.push(`user_id = $${params.length}`);
  }

  if (filters.direction) {
    params.push(filters.direction);
    conditions.push(`direction = $${params.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  params.push(filters.limit ?? 20);

  const rows = await sql.unsafe<WhatsappLogRow[]>(
    `
      SELECT ${whatsappLogSelectColumns}
      FROM whatsapp_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length}
    `,
    params
  );

  return rows.map(toWhatsappLog);
}

function toWhatsappLog(row: WhatsappLogRow): WhatsappLog {
  return {
    id: row.id,
    user_id: row.user_id,
    direction: row.direction,
    content: row.content,
    media_type: row.media_type,
    processed: row.processed,
    created_at: new Date(row.created_at).toISOString()
  };
}
