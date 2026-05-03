import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    // 25 per worker × up to 4 workers = 100 total — stays under MySQL's default 151 max_connections
    connectionLimit: Number(process.env.DB_POOL_LIMIT) || 25,
    queueLimit: 200,       // reject after 200 queued (prevents unbounded memory growth)
    timezone: "+08:00",
});

// Idempotent schema fixes — runs on every startup, safe to repeat
const MIGRATIONS = [
    // Railway DB shipped with VARCHAR(25)/VARCHAR(50) — too short for real obligations
    `ALTER TABLE obligations MODIFY COLUMN obligation_name VARCHAR(255) NOT NULL`,
    `ALTER TABLE obligations MODIFY COLUMN description VARCHAR(500) NULL`,
    // Make receipt_filename nullable so uploads without an original filename don't crash
    `ALTER TABLE payment_submissions MODIFY COLUMN receipt_filename VARCHAR(255) NULL`,
    // Audit tables — not in original schema, created here so Railway DB gets them automatically
    `CREATE TABLE IF NOT EXISTS expenses (
        expense_id   INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        title        VARCHAR(255) NOT NULL,
        category     VARCHAR(100) NULL,
        description  VARCHAR(500) NULL,
        amount       DECIMAL(12,2) NOT NULL,
        semester     TINYINT NOT NULL,
        school_year  VARCHAR(10) NOT NULL,
        recorded_by  INT UNSIGNED NOT NULL,
        receipt_path VARCHAR(500) NULL,
        created_at   DATETIME NOT NULL DEFAULT NOW(),
        updated_at   DATETIME NOT NULL DEFAULT NOW(),
        deleted_at   DATETIME NULL,
        FOREIGN KEY (recorded_by) REFERENCES users(user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS budgets (
        budget_id        INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        title            VARCHAR(255) NOT NULL,
        description      VARCHAR(500) NULL,
        allocated_amount DECIMAL(12,2) NOT NULL,
        semester         TINYINT NOT NULL,
        school_year      VARCHAR(10) NOT NULL,
        created_by       INT UNSIGNED NOT NULL,
        created_at       DATETIME NOT NULL DEFAULT NOW(),
        updated_at       DATETIME NOT NULL DEFAULT NOW(),
        deleted_at       DATETIME NULL,
        FOREIGN KEY (created_by) REFERENCES users(user_id)
    )`,
];

export async function connectDB(): Promise<void> {
    const connection = await pool.getConnection();
    console.log("Database connected successfully");
    for (const sql of MIGRATIONS) {
        try { await connection.execute(sql); }
        catch (e: any) {
            // 1060 = duplicate column, 1061 = duplicate index — both mean already done
            if (e.errno !== 1060 && e.errno !== 1061) {
                console.warn("[migration] skipped:", e.message);
            }
        }
    }
    connection.release();
}

export default pool;

