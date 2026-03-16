import { Router } from "express";
import {
    listObligations,
    addObligation,
    editObligation,
    removeObligation,
    syncObligation,
} from "../controllers/obligation.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

const adminRoles = ["system_admin", "eso_officer", "class_officer", "program_head", "signatory", "dean"] as const;

router.get(  "/",    authenticate, authorize(...adminRoles), listObligations);
router.post( "/",    authenticate, authorize("system_admin", "eso_officer"), addObligation);
router.put(  "/:id", authenticate, authorize("system_admin", "eso_officer"), editObligation);
router.delete("/:id",   authenticate, authorize("system_admin", "eso_officer"), removeObligation);
router.post( "/:id/sync", authenticate, authorize("system_admin", "eso_officer"), syncObligation);

export default router;
