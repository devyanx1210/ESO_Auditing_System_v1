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

const ESO_IMPORT_ROLES = ["eso_officer", "eso_treasurer", "eso_vpsa", "eso_president", "osas_coordinator", "system_admin"] as const;
router.get("/check",        authenticate, authorize(...ESO_IMPORT_ROLES), handleCheckImport);
router.get("/sessions",     authenticate, authorize(...ESO_IMPORT_ROLES), handleGetImportSessions);
router.post("/",            authenticate, authorize(...ESO_IMPORT_ROLES), csvUpload.single("csv"), handleImportCSV);
router.delete("/:importId", authenticate, authorize(...ESO_IMPORT_ROLES), handleDeleteImportSession);

export default router;
