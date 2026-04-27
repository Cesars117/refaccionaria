import { createClient } from '@libsql/client';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Faltan TURSO_DATABASE_URL o TURSO_AUTH_TOKEN en el archivo .env");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function push() {
  try {
    console.log("Leyendo migrate.sql...");
    const sql = fs.readFileSync('migrate.sql', 'utf8');
    
    // Split by semicolons but be careful with strings/comments if needed.
    // For prisma-generated scripts, simple split usually works if we filter empty.
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Ejecutando ${statements.length} sentencias en Turso...`);

    for (const statement of statements) {
      await client.execute(statement);
    }

    console.log("¡Sincronización con Turso completada con éxito!");
  } catch (error) {
    console.error("Error sincronizando con Turso:", error);
    process.exit(1);
  }
}

push();
