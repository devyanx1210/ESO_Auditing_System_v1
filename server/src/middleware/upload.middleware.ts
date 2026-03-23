import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_ROOT = process.env.UPLOAD_PATH ?? "uploads";

function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function makeStorage(subDir: string) {
    const dir = path.join(UPLOAD_ROOT, subDir);
    ensureDir(dir);
    return multer.diskStorage({
        destination: (_req, _file, cb) => {
            ensureDir(dir);
            cb(null, dir);
        },
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
            cb(null, unique);
        },
    });
}

const imageFilter = (
    _req: any,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowed = [".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only JPG or PNG images are allowed"));
};

const receiptFilter = (
    _req: any,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowed = [".jpg", ".jpeg", ".png", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only JPG, PNG, or PDF files are allowed"));
};

export const uploadReceipt = multer({
    storage:    makeStorage("receipts"),
    fileFilter: receiptFilter,
    limits:     { fileSize: 5 * 1024 * 1024 },
}).single("receipt");

export const uploadQR = multer({
    storage:    makeStorage("qr"),
    fileFilter: imageFilter,
    limits:     { fileSize: 2 * 1024 * 1024 },
}).single("qrCode");

export const uploadAvatar = multer({
    storage:    makeStorage("avatars"),
    fileFilter: imageFilter,
    limits:     { fileSize: 3 * 1024 * 1024 },
}).single("avatar");

export const uploadProof = multer({
    storage:    makeStorage("proofs"),
    fileFilter: receiptFilter,
    limits:     { fileSize: 5 * 1024 * 1024 },
}).single("proof");
