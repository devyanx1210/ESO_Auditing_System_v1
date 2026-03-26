import { Request, Response } from "express";
import { getStudents } from "../services/student.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export const listStudents = async (req: Request, res: Response) => {
    try {
        const students = await getStudents();
        return sendSuccess(res, students, "Students fetched successfully");
    } catch (error: any) {
        return sendError(res, error.message, 500);
    }
};

import {
    getStudentProfile,
    updateStudentProfile,
    getStudentObligations,
    getStudentClearance,
} from "../services/student.service.js";

export const getMyProfile = async (req: Request, res: Response) => {
    try {
        const profile = await getStudentProfile(req.user!.userId);
        return sendSuccess(res, profile);
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};

export const getMyObligations = async (req: Request, res: Response) => {
    try {
        const obligations = await getStudentObligations(req.user!.userId);
        return sendSuccess(res, obligations);
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};

export const updateMyProfile = async (req: Request, res: Response) => {
    try {
        const {
            firstName, lastName, yearLevel, section, schoolYear, semester,
            address, contactNumber, guardianName, emergencyContact, shirtSize,
        } = req.body;
        if (!firstName || !lastName || !yearLevel || !section || !schoolYear || !semester)
            return sendError(res, "firstName, lastName, yearLevel, section, schoolYear, and semester are required", 400);

        const avatarPath = req.file
            ? `/uploads/avatars/${req.file.filename}`
            : undefined;

        const profile = await updateStudentProfile(req.user!.userId, {
            firstName, lastName,
            yearLevel:        Number(yearLevel),
            section,          schoolYear, semester,
            address:          address          ?? "",
            contactNumber:    contactNumber    ?? "",
            guardianName:     guardianName     ?? "",
            emergencyContact: emergencyContact ?? "",
            shirtSize:        shirtSize        ?? "",
            avatarPath,
        });
        return sendSuccess(res, profile, "Profile updated");
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};

export const getMyClearance = async (req: Request, res: Response) => {
    try {
        const clearance = await getStudentClearance(req.user!.userId);
        return sendSuccess(res, clearance);
    } catch (err: any) {
        return sendError(res, err.message, 400);
    }
};
