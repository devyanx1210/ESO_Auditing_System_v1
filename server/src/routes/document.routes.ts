import { Router } from "express";
import { authenticate }         from "../middleware/auth.middleware.js";
import { authorize }            from "../middleware/role.middleware.js";
import { uploadPdfTemplate }    from "../middleware/upload.middleware.js";
import * as ctrl                from "../controllers/document.controller.js";
import type { UserRole }        from "../types/auth.types.js";

const router = Router();

const adminRoles: UserRole[] = [
    "system_admin", "eso_officer", "program_head",
    "program_officer", "signatory", "dean", "class_officer",
];

router.use(authenticate, authorize(...adminRoles));

// Template CRUD
router.get   ("/",                        ctrl.handleGetTemplates);
router.get   ("/approved-students",       ctrl.handleGetApprovedStudents);
router.get   ("/:id",                     ctrl.handleGetTemplate);
router.post  ("/",                        ctrl.handleCreateTemplate);
router.put   ("/:id",                     ctrl.handleUpdateTemplate);
router.delete("/:id",                     ctrl.handleDeleteTemplate);
router.patch ("/:id/set-default",         ctrl.handleSetDefault);

// PDF template
router.get   ("/:id/pdf-file",            ctrl.handleGetPdfFile);
router.post  ("/:id/upload-pdf",          uploadPdfTemplate, ctrl.handleUploadPdf);
router.delete("/:id/pdf",                 ctrl.handleRemovePdf);
router.patch ("/:id/positions",           ctrl.handleSavePositions);

// Print merge — returns a PDF stream
router.get   ("/:id/print-merge",         ctrl.handlePrintMerge);

export default router;
