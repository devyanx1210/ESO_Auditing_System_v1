import { Request, Response, NextFunction } from "express";

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error("Unhandled error:", err);
    const isProd = process.env.NODE_ENV === "production";
    return res.status(500).json({
        success: false,
        message: isProd ? "Internal Server Error" : err.message,
    });
};