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

export async function connectDB(): Promise<void> {
    const connection = await pool.getConnection();
    console.log("Database connected successfully");
    connection.release();
}

export default pool;

