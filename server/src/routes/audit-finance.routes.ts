import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize }    from "../middleware/role.middleware.js";
import * as ctrl        from "../controllers/audit-finance.controller.js";
import type { UserRole } from "../types/auth.types.js";

const router = Router();

const auditRoles: UserRole[] = ["system_admin", "eso_officer"];

router.use(authenticate, authorize(...auditRoles));

router.get   ("/summary",          ctrl.getSummary);
router.get   ("/income",           ctrl.getIncome);
router.get   ("/expenses",         ctrl.getExpenses);
router.get   ("/chart",            ctrl.getChart);
router.get   ("/school-years",     ctrl.getSchoolYears);
router.get   ("/ledger",           ctrl.getLedger);
router.post  ("/expenses",         ctrl.createExpense);
router.put   ("/expenses/:id",     ctrl.editExpense);
router.delete("/expenses/:id",     ctrl.removeExpense);
router.get   ("/budgets",          ctrl.getBudgets);
router.post  ("/budgets",          ctrl.createBudget);
router.put   ("/budgets/:id",      ctrl.editBudget);
router.delete("/budgets/:id",      ctrl.removeBudget);

export default router;
