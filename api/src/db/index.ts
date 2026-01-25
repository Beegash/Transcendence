import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(process.env.DATABASE_PATH || "/data/app.db");

// Enable WAL mode for better concurrency allowing simultaneous reads and writes without blocking
db.pragma("journal_mode = WAL");
// Set 5s busy timeout to prevent "database is locked" errors during concurrent writes
db.pragma("busy_timeout = 5000");

import { readdirSync } from "fs";

export async function initDatabase() {
    try {
        const migrationsDir = join(__dirname, "migrations");
        const files = readdirSync(migrationsDir)
            .filter(f => f.endsWith(".sql"))
            .sort();

        // Automatically apply all SQL migrations from the migrations directory in alphabetical order
        for (const file of files) {
            console.log(`Running migration: ${file}`);
            const migrationSQL = readFileSync(join(migrationsDir, file), "utf-8");
            // Execute SQL migration for schema setup
            db.exec(migrationSQL);
        }

        // Reset all users to offline on server startup
        // This clears any stale online status from previous sessions
        // Users will be marked online again when they connect via presence WebSocket
        const result = db.prepare('UPDATE users SET is_online = FALSE WHERE is_online = TRUE').run();
        if (result.changes > 0) {
            console.log(`Reset ${result.changes} user(s) to offline status on startup`);
        }

        console.log("Database initialization complete");
    } catch (error) {
        console.error("Database initialization failed:", error);
        throw error;
    }
}

// Call initDatabase and handle potential error
initDatabase().catch(err => {
    console.error("Critical: Database initialization failed", err);
    process.exit(1);
});

export default db;
