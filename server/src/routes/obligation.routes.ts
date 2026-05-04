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

// All admin roles can read and write obligations; scope is enforced in the controller.
const adminRoles = ["system_admin", "eso_officer", "eso_treasurer", "eso_vpsa", "eso_president", "class_officer", "class_secretary", "class_treasurer", "class_president", "program_officer", "program_treasurer", "program_president", "program_head", "signatory", "osas_coordinator", "dean"] as const;

router.get(  "/",                  authenticate, authorize(...adminRoles), listObligations);
router.get(  "/archived",          authenticate, authorize(...adminRoles), listArchivedObligations);
router.post( "/",                  authenticate, authorize(...adminRoles), addObligation);
router.put(  "/:id",               authenticate, authorize(...adminRoles), editObligation);
router.delete("/:id",              authenticate, authorize(...adminRoles), removeObligation);
router.post( "/:id/sync",          authenticate, authorize(...adminRoles), syncObligation);
router.patch("/:id/restore",       authenticate, authorize(...adminRoles), restoreObligationHandler);
router.delete("/:id/permanent",    authenticate, authorize("system_admin", "eso_officer", "eso_president"), permanentlyDeleteObligationHandler);

export default router;
