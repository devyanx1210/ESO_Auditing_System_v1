import multer from "multer";
import path from "path";
import cloudinary from "../config/cloudinary.js";

// All files go through memory first, then get pushed to Cloudinary.
// Nothing is written to the local disk.
const memory = multer.memoryStorage();

// ── Cloudinary helpers ───────────────────────────────────────────────────────

export async function uploadToCloudinary(
    buffer: Buffer,
    folder: string,
    resourceType: "image" | "raw" = "image"
): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: resourceType },
            (error, result) => {
                if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        stream.end(buffer);
    });
}

export async function deleteFromCloudinary(
    url: string,
    resourceType: "image" | "raw" = "image"
): Promise<void> {
    try {
        // Extract public_id from URL: everything after /upload/v{digits}/
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+)/);
        if (!match) return;
        let publicId = match[1];
        // For images Cloudinary stores public_id without extension; for raw it keeps it
        if (resourceType === "image") publicId = publicId.replace(/\.[^/.]+$/, "");
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch { /* ignore delete errors — file may already be gone */ }
}

// ── File filters ─────────────────────────────────────────────────────────────

const ALLOWED_IMAGE_EXTS  = new Set([".jpg", ".jpeg", ".png"]);
const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png"]);
const ALLOWED_RECEIPT_EXTS  = new Set([".jpg", ".jpeg", ".png", ".pdf"]);
const ALLOWED_RECEIPT_MIMES = new Set(["image/jpeg", "image/png", "application/pdf"]);
const ALLOWED_PDF_MIMES     = new Set(["application/pdf"]);

const imageFilter = (
    _req: any,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_IMAGE_EXTS.has(ext) && ALLOWED_IMAGE_MIMES.has(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG or PNG images are allowed"));
};

const receiptFilter = (
    _req: any,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_RECEIPT_EXTS.has(ext) && ALLOWED_RECEIPT_MIMES.has(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG, or PDF files are allowed"));
};

const pdfFilter = (
    _req: any,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".pdf" && ALLOWED_PDF_MIMES.has(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
};

// ── Multer instances (memory storage, validation only) ───────────────────────

export const uploadReceipt = multer({
    storage:    memory,
    fileFilter: receiptFilter,
    limits:     { fileSize: 5 * 1024 * 1024 },
}).single("receipt");

export const uploadQR = multer({
    storage:    memory,
    fileFilter: imageFilter,
    limits:     { fileSize: 2 * 1024 * 1024 },
}).single("qrCode");

export const uploadAvatar = multer({
    storage:    memory,
    fileFilter: imageFilter,
    limits:     { fileSize: 3 * 1024 * 1024 },
}).single("avatar");

export const uploadProof = multer({
    storage:    memory,
    fileFilter: receiptFilter,
    limits:     { fileSize: 5 * 1024 * 1024 },
}).single("proof");

export const uploadPdfTemplate = multer({
    storage:    memory,
    fileFilter: pdfFilter,
    limits:     { fileSize: 20 * 1024 * 1024 },
}).single("pdf");
