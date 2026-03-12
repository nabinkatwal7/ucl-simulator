import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { dbPath, ensureDbDir } from "./paths";

ensureDbDir();

const sqlite = new Database(dbPath);
sqlite.pragma("foreign_keys = ON");

sqlite.exec(
  "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
);

const migrationsDir = path.join(
  process.cwd(),
  "src",
  "server",
  "db",
  "migrations"
);
const files = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

const applied = new Set(
  sqlite
    .prepare("SELECT name FROM _migrations")
    .all()
    .map((row: { name: string }) => row.name)
);

const insert = sqlite.prepare("INSERT INTO _migrations (name) VALUES (?)");

const applyMigration = sqlite.transaction((name: string, sql: string) => {
  sqlite.exec(sql);
  insert.run(name);
});

for (const file of files) {
  if (applied.has(file)) {
    continue;
  }

  const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
  applyMigration(file, sql);
  console.log(`Applied ${file}`);
}

sqlite.close();
