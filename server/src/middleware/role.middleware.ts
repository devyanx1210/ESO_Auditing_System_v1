import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types/auth.types.js";
import { sendError } from "../utils/response.js";

export const authorize = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return sendError(res, "Unauthorized", 401);
        }

        if (!allowedRoles.includes(req.user.role)) {
            return sendError(res, "Forbidden - insufficient permissions", 403);
        }

        next();
    };
};