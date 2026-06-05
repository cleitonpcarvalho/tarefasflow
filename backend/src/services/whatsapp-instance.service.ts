import { sql } from "../config/db";
import type { EvolutionConnectionState } from "./evolution.service";

export interface WhatsappInstance {
  id: string;
  user_id: string;
  instance_name: string;
  instance_token: string | null;
  status: EvolutionConnectionState;
  phone_number: string | null;
  webhook_set: boolean;
  created_at: string;
  updated_at: string;
}

interface WhatsappInstanceRow {
  id: string;
  user_id: string;
  instance_name: string;
  instance_token: string | null;
  status: EvolutionConnectionState;
  phone_number: string | null;
  webhook_set: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

interface CreateWhatsappInstanceData {
  userId: string;
  instanceName: string;
  instanceToken: string | null;
  status: EvolutionConnectionState;
  webhookSet?: boolean;
}

export async function createWhatsappInstance({
  userId,
  instanceName,
  instanceToken,
  status,
  webhookSet = true
}: CreateWhatsappInstanceData): Promise<WhatsappInstance> {
  const rows = await sql<WhatsappInstanceRow[]>`
    INSERT INTO whatsapp_instances (
      user_id, instance_name, instance_token, status, webhook_set
    )
    VALUES (
      ${userId},
      ${instanceName},
      ${instanceToken},
      ${status},
      ${webhookSet}
    )
    RETURNING id, user_id, instance_name, instance_token, status,
      phone_number, webhook_set, created_at, updated_at
  `;

  return toWhatsappInstance(rows[0]);
}

export async function getWhatsappInstanceByUserId(
  userId: string
): Promise<WhatsappInstance | null> {
  const rows = await sql<WhatsappInstanceRow[]>`
    SELECT id, user_id, instance_name, instance_token, status, phone_number,
      webhook_set, created_at, updated_at
    FROM whatsapp_instances
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  return rows[0] ? toWhatsappInstance(rows[0]) : null;
}

export async function getWhatsappInstanceByName(
  instanceName: string
): Promise<WhatsappInstance | null> {
  const rows = await sql<WhatsappInstanceRow[]>`
    SELECT id, user_id, instance_name, instance_token, status, phone_number,
      webhook_set, created_at, updated_at
    FROM whatsapp_instances
    WHERE instance_name = ${instanceName}
    LIMIT 1
  `;

  return rows[0] ? toWhatsappInstance(rows[0]) : null;
}

export async function getOwnedWhatsappInstance(
  instanceName: string,
  userId: string
): Promise<WhatsappInstance | null> {
  const rows = await sql<WhatsappInstanceRow[]>`
    SELECT id, user_id, instance_name, instance_token, status, phone_number,
      webhook_set, created_at, updated_at
    FROM whatsapp_instances
    WHERE instance_name = ${instanceName}
      AND user_id = ${userId}
    LIMIT 1
  `;

  return rows[0] ? toWhatsappInstance(rows[0]) : null;
}

export async function updateWhatsappInstanceStatus(
  instanceName: string,
  status: EvolutionConnectionState
): Promise<WhatsappInstance | null> {
  const rows = await sql<WhatsappInstanceRow[]>`
    UPDATE whatsapp_instances
    SET status = ${status}, updated_at = NOW()
    WHERE instance_name = ${instanceName}
    RETURNING id, user_id, instance_name, instance_token, status,
      phone_number, webhook_set, created_at, updated_at
  `;

  return rows[0] ? toWhatsappInstance(rows[0]) : null;
}

export async function deleteWhatsappInstanceRecord(
  instanceName: string,
  userId: string
): Promise<{ deleted: true } | null> {
  const rows = await sql<{ id: string }[]>`
    DELETE FROM whatsapp_instances
    WHERE instance_name = ${instanceName}
      AND user_id = ${userId}
    RETURNING id
  `;

  return rows.length > 0 ? { deleted: true } : null;
}

export function toWhatsappInstance(row: WhatsappInstanceRow): WhatsappInstance {
  return {
    id: row.id,
    user_id: row.user_id,
    instance_name: row.instance_name,
    instance_token: row.instance_token,
    status: row.status,
    phone_number: row.phone_number,
    webhook_set: row.webhook_set,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}
