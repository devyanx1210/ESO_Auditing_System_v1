import { Router } from "express";
import {
    listObligations,
    listArchivedObligations,
    addObligation,
    editObligation,
    removeObligation,
    syncObligation,
    restoreObligationHandler,
    permanentlyDeleteObligationHandler,
} from "../controllers/obligation.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

const adminRoles = ["system_admin", "eso_officer", "eso_treasurer", "eso_vpsa", "eso_president", "class_officer", "class_secretary", "class_treasurer", "class_president", "program_officer", "program_treasurer", "program_president", "program_head", "signatory", "osas_coordinator", "dean"] as const;

router.get(  "/",                  authenticate, authorize(...adminRoles), listObligations);
router.get(  "/archived",          authenticate, authorize(...adminRoles), listArchivedObligations);
router.post( "/",                  authenticate, authorize("system_admin", "eso_officer"), addObligation);
router.put(  "/:id",               authenticate, authorize("system_admin", "eso_officer"), editObligation);
router.delete("/:id",              authenticate, authorize("system_admin", "eso_officer"), removeObligation);
router.post( "/:id/sync",          authenticate, authorize("system_admin", "eso_officer"), syncObligation);
router.patch("/:id/restore",       authenticate, authorize("system_admin", "eso_officer"), restoreObligationHandler);
router.delete("/:id/permanent",    authenticate, authorize("system_admin", "eso_officer"), permanentlyDeleteObligationHandler);

export default router;
