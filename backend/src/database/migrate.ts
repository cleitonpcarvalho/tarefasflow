import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "../config/db";

async function migrate() {
  const migrationsDir = join(process.cwd(), "src", "database", "migrations");

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS _migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    const migrationFiles = readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort((left, right) => left.localeCompare(right));

    for (const filename of migrationFiles) {
      const alreadyApplied = await isMigrationApplied(filename);

      if (alreadyApplied) {
        console.log(`Migration ${filename} ja aplicada, pulando.`);
        continue;
      }

      const legacyApplied = await isLegacyMigrationApplied(filename);

      if (legacyApplied) {
        await markMigrationAsApplied(filename);
        console.log(`Migration ${filename} detectada como aplicada, pulando.`);
        continue;
      }

      const migrationPath = join(migrationsDir, filename);
      const migration = readFileSync(migrationPath, "utf8");

      await sql.begin(async (transaction) => {
        await transaction.unsafe(migration);
        await transaction`
          INSERT INTO _migrations (filename)
          VALUES (${filename})
          ON CONFLICT (filename) DO NOTHING
        `;
      });

      console.log(`Migration ${filename} executada com sucesso.`);
    }
  } catch (error) {
    console.error("Erro ao executar migrations:", error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

void migrate();

async function isMigrationApplied(filename: string) {
  const rows = await sql<{ filename: string }[]>`
    SELECT filename
    FROM _migrations
    WHERE filename = ${filename}
    LIMIT 1
  `;

  return rows.length > 0;
}

async function markMigrationAsApplied(filename: string) {
  await sql`
    INSERT INTO _migrations (filename)
    VALUES (${filename})
    ON CONFLICT (filename) DO NOTHING
  `;
}

async function isLegacyMigrationApplied(filename: string) {
  if (filename !== "001_initial_schema.sql") {
    return false;
  }

  const rows = await sql<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'users'
    ) AS exists
  `;

  return rows[0]?.exists ?? false;
}
