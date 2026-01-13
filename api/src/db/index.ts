import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(process.env.DATABASE_PATH || "/data/app.db");

db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

export function initDatabase() {
    try {
        const migrationSQL = readFileSync(
            join(__dirname, "migrations", "0001_init.sql"),
            "utf-8"
        );
        db.exec(migrationSQL);
        console.log("Database initialized - users table created");
    } catch (error) {
        console.error("Database initialization failed:", error);
        throw error;
    }
}

initDatabase();

export default db;
