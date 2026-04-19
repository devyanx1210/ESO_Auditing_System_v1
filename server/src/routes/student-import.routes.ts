import { Router } from "express";
import multer      from "multer";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize }    from "../middleware/role.middleware.js";
import {
    handleCheckImport,
    handleImportCSV,
    handleGetImportSessions,
    handleDeleteImportSession,
} from "../controllers/student-import.controller.js";

const router = Router();

// Store CSV in memory (max 10 MB)
const csvUpload = multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) cb(null, true);
        else cb(new Error("Only CSV files are accepted"));
    },
});

router.get("/check",        authenticate, authorize("eso_officer"), handleCheckImport);
router.get("/sessions",     authenticate, authorize("eso_officer"), handleGetImportSessions);
router.post("/",            authenticate, authorize("eso_officer"), csvUpload.single("csv"), handleImportCSV);
router.delete("/:importId", authenticate, authorize("eso_officer"), handleDeleteImportSession);

export default router;
