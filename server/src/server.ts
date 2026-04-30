import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";

// Fail fast if critical env vars are missing
const REQUIRED_ENV = [
    "DB_HOST", "DB_USER", "DB_NAME",
    "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET",
];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(", ")}`);
    process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === "production";

// Trust the first proxy (Cloudflare / nginx) so req.ip reflects the real client IP
// Required for accurate rate limiting and audit log IPs behind a tunnel
app.set("trust proxy", 1);

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: isProd ? {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "blob:"],
        },
    } : false,
}));

// CORS — LAN_MODE allows all origins (safe on a private school network)
const LAN_MODE = process.env.LAN_MODE === "true";
const ALLOWED_ORIGINS = [
    "http://localhost:5174",
    "http://localhost:5173",
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
    ...(process.env.TUNNEL_URL ? [process.env.TUNNEL_URL] : []),
];
app.use(cors({
    origin: (origin, cb) => {
        if (LAN_MODE || !origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".trycloudflare.com")) {
            cb(null, true);
        } else {
            cb(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
    credentials: true,
}));

// Rate limiting — generous for shared school WiFi IPs
app.use("/api", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 2000 : 10000,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again later.",
}));

// Stricter limit on auth endpoints (brute-force protection)
app.use("/api/v1/auth/login", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: LAN_MODE ? 500 : 30,   // LAN: many users share one IP
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many login attempts, please try again later.",
}));

// Prevent mass account creation spam
app.use("/api/v1/auth/register", rateLimit({
    windowMs: 60 * 60 * 1000,
    max: LAN_MODE ? 200 : 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many registration attempts, please try again later.",
}));

// Prevent email spam via forgot-password and resend-verification
const emailRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: LAN_MODE ? 50 : 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many email requests, please try again later.",
});
app.use("/api/v1/auth/forgot-password",      emailRateLimit);
app.use("/api/v1/auth/resend-verification",  emailRateLimit);

// Prevent brute-force on reset-password tokens
app.use("/api/v1/auth/reset-password", rateLimit({
    windowMs: 15 * 60 * 1000,
    max: LAN_MODE ? 50 : 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many password reset attempts, please try again later.",
}));

app.use(compression());
app.use(morgan(isProd ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/api/v1", routes);

app.get("/health", (_req, res) => {
    res.json({ status: "OK" });
});

// Serve built React frontend in production / LAN mode
const clientDist = path.join(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("/{*path}", (_req, res) => {
        res.sendFile(path.join(clientDist, "index.html"));
    });
}

app.use(errorHandler);

const startServer = async () => {
    await connectDB();
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
    // Must exceed Cloudflare tunnel's 60s keep-alive to prevent spurious 400 warnings
    server.keepAliveTimeout = 65_000;
    server.headersTimeout   = 66_000;
};

startServer();

export default app;
