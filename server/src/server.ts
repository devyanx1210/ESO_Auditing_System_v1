import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
const ALLOWED_ORIGINS = [
    "http://localhost:5174",
    "http://localhost:5173",
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
    ...(process.env.TUNNEL_URL  ? [process.env.TUNNEL_URL]  : []),
];
app.use(cors({
    origin: (origin, cb) => {
        // allow server-to-server (no origin) or any trycloudflare.com tunnel
        if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".trycloudflare.com")) {
            cb(null, true);
        } else {
            cb(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
    credentials: true,
}));

// General API limit — generous because students share school WiFi (shared IP)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "production" ? 2000 : 10000,
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api", limiter);

// Stricter limit on auth endpoints only (brute force protection)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: "Too many login attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api/v1/auth/login", authLimiter);

app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/uploads", (_req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
}, express.static(path.join(__dirname, "../uploads")));

app.use("/api/v1", routes);

app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "ESO Auditing API is running" });
});

app.use(errorHandler);

const startServer = async () => {
    await connectDB();
    const server = app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
    });
    // Must be > Cloudflare tunnel's 60s keep-alive to prevent 400 warnings
    server.keepAliveTimeout = 65_000;
    server.headersTimeout   = 66_000;
};

startServer();

export default app;