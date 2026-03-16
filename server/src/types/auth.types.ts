export type UserRole =
    | "system_admin"
    | "eso_officer"
    | "class_officer"
    | "program_head"
    | "signatory"
    | "dean"
    | "student";

export interface JwtAccessPayload {
    userId: number;
    email: string;
    role: UserRole;
    departmentId: number | null;
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
    departmentId: number;
    yearLevel: number;
    section: string;
    schoolYear: string;
    semester: "1st" | "2nd" | "Summer";
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
    departmentId: number | null;
    status: string;
}
