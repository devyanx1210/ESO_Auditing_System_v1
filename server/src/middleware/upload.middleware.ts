import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const receiptsDir = path.join(__dirname, "../../uploads/receipts");
const qrDir       = path.join(__dirname, "../../uploads/qr");
const avatarsDir  = path.join(__dirname, "../../uploads/avatars");

ensureDir(receiptsDir);
ensureDir(qrDir);
ensureDir(avatarsDir);

function makeStorage(dir: string) {
    return multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, dir),
        filename:    (_req, file,  cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, `${uuidv4()}${ext}`);
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
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG or PNG images are allowed"));
    }
};

const receiptFilter = (
    _req: any,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowed = [".jpg", ".jpeg", ".png", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG, PNG, or PDF files are allowed"));
    }
};

export const uploadReceipt = multer({
    storage:    makeStorage(receiptsDir),
    fileFilter: receiptFilter,
    limits:     { fileSize: 5 * 1024 * 1024 },
}).single("receipt");

export const uploadQR = multer({
    storage:    makeStorage(qrDir),
    fileFilter: imageFilter,
    limits:     { fileSize: 2 * 1024 * 1024 },
}).single("qrCode");

export const uploadAvatar = multer({
    storage:    makeStorage(avatarsDir),
    fileFilter: imageFilter,
    limits:     { fileSize: 3 * 1024 * 1024 },
}).single("avatar");
