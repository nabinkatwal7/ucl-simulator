import fs from "fs";
import path from "path";

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "career.db");

export const dbPath = process.env.SQLITE_DB_PATH ?? DEFAULT_DB_PATH;

export function ensureDbDir() {
  const dir = path.dirname(dbPath);
  fs.mkdirSync(dir, { recursive: true });
}
