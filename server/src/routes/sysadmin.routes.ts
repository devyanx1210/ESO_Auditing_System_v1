import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize }    from "../middleware/role.middleware.js";
import * as ctrl        from "../controllers/sysadmin.controller.js";

const router = Router();

// Public — frontend polls this to check maintenance mode
router.get("/maintenance/status", ctrl.handleMaintenanceStatus);

// All routes below require system_admin
router.use(authenticate, authorize("system_admin"));

router.get   ("/settings",                    ctrl.handleGetSettings);
router.patch ("/settings/maintenance",        ctrl.handleUpdateMaintenance);
router.patch ("/settings/semester",           ctrl.handleUpdateSemesterSettings);

router.get   ("/accounts",                    ctrl.handleGetAccounts);
router.post  ("/accounts",                    ctrl.handleCreateAccount);
router.patch ("/accounts/:userId",            ctrl.handleUpdateAccount);
router.patch ("/accounts/:userId/status",     ctrl.handleUpdateAccountStatus);
router.delete("/accounts/:userId",            ctrl.handleDeleteAccount);

router.get   ("/students/advancement-preview", ctrl.handlePreviewAdvancement);
router.post  ("/students/advance-year",        ctrl.handleExecuteAdvancement);

router.get   ("/audit-logs",                  ctrl.handleGetAuditLogs);
router.get   ("/programs",                    ctrl.handleGetPrograms);
router.get   ("/roles",                       ctrl.handleGetRoles);
router.get   ("/workflow",                    ctrl.handleGetWorkflow);
router.put   ("/workflow",                    ctrl.handleUpdateWorkflow);

export default router;
