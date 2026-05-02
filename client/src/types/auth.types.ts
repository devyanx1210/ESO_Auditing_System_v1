export type UserRole =
    | "system_admin"
    | "eso_officer"
    | "eso_treasurer"
    | "eso_vpsa"
    | "eso_president"
    | "class_officer"
    | "class_secretary"
    | "class_treasurer"
    | "class_president"
    | "program_officer"
    | "program_treasurer"
    | "program_president"
    | "program_head"
    | "signatory"
    | "osas_coordinator"
    | "dean"
    | "student";

export interface JwtAccessPayload {
    userId: number;
    email: string;
    role: UserRole;
    programId: number | null;
    yearLevel?: number | null;
    section?: string | null;
}

export interface JwtRefreshPayload {
    userId: number;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface RegisterInput {
    firstName: string;
    lastName: string;
    middleName?: string;
    email: string;
    password: string;
    studentNo: string;
    programId: number;
    yearLevel: number;
    section: string;
    schoolYear: string;
    semester: number;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthenticatedUser {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    programId: number | null;
    status: string;
    yearLevel?: number | null;
    section?: string | null;
}
