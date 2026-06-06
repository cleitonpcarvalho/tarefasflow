import bcrypt from "bcrypt";
import { sql } from "../config/db";
import type { UserRole } from "../types/auth";

const admin = {
  name: "TarefasFlow Admin",
  email: "admin@tarefasflow.com",
  password: "Admin@2026!",
  role: "admin" satisfies UserRole
};

async function seed() {
  try {
    const existingUsers = await sql<{ id: string }[]>`
      SELECT id
      FROM users
      WHERE email = ${admin.email}
      LIMIT 1
    `;

    if (existingUsers.length > 0) {
      console.log("Usuario admin inicial ja existe.");
      return;
    }

    const passwordHash = await bcrypt.hash(admin.password, 12);

    await sql`
      INSERT INTO users (name, email, password, role)
      VALUES (${admin.name}, ${admin.email}, ${passwordHash}, ${admin.role})
    `;

    console.log("Usuario admin inicial criado com sucesso.");
  } catch (error) {
    console.error("Erro ao executar seed inicial:", error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

void seed();
