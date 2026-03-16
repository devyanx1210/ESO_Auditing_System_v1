import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";
import { JwtAccessPayload } from "../types/auth.types.js";
import { sendError } from "../utils/response.js";

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return sendError(res, "No token provided", 401);
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            jwtConfig.accessSecret
        ) as JwtAccessPayload;
        req.user = decoded;
        next();
    } catch (error) {
        return sendError(res, "Invalid or expired token", 401);
    }
};