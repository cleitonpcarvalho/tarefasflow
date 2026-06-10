import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL e obrigatoria"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET deve ter pelo menos 32 caracteres"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY e obrigatoria"),
  EVOLUTION_API_URL: z
    .string()
    .url("EVOLUTION_API_URL deve ser uma URL valida"),
  EVOLUTION_API_KEY: z.string().min(1, "EVOLUTION_API_KEY e obrigatoria"),
  EVOLUTION_INSTANCE_APIKEY: z.string().default(""),
  WEBHOOK_BASE_URL: z
    .string()
    .url("WEBHOOK_BASE_URL deve ser uma URL valida")
    .default("http://localhost:3001"),
  SUPABASE_URL: z.string().url("SUPABASE_URL deve ser uma URL valida"),
  SUPABASE_SERVICE_ROLE: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE e obrigatoria"),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY e obrigatoria")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Variaveis de ambiente invalidas ou ausentes: ${details}`);
}

export type Env = z.infer<typeof envSchema>;

export const env: Env = parsedEnv.data;
