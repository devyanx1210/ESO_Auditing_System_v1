import { apiFetch } from "./api";
import type {
    LoginInput,
    RegisterInput,
    AuthTokens,
    AuthenticatedUser,
} from "../types/auth.types";

interface LoginResponse {
    user: AuthenticatedUser;
    tokens: AuthTokens;
}

interface RegisterResponse {
    user: AuthenticatedUser;
    tokens: AuthTokens;
}

interface RefreshResponse {
    accessToken: string;
}

export const authService = {
    login: (input: LoginInput) =>
        apiFetch<LoginResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify(input),
        }),

    register: (input: RegisterInput) =>
        apiFetch<RegisterResponse>("/auth/register", {
            method: "POST",
            body: JSON.stringify(input),
        }),

    refresh: (refreshToken: string) =>
        apiFetch<RefreshResponse>("/auth/refresh", {
            method: "POST",
            body: JSON.stringify({ refreshToken }),
        }),

    logout: (accessToken: string) =>
        apiFetch<null>("/auth/logout", { method: "POST" }, accessToken),

    changePassword: (accessToken: string, currentPassword: string, newPassword: string) =>
        apiFetch<null>("/auth/change-password", {
            method: "POST",
            body: JSON.stringify({ currentPassword, newPassword }),
        }, accessToken),

    getMe: (accessToken: string) =>
        apiFetch<AuthenticatedUser>("/auth/me", {}, accessToken),

    verifyPassword: (accessToken: string, password: string) =>
        apiFetch<null>("/auth/verify-password", {
            method: "POST",
            body: JSON.stringify({ password }),
        }, accessToken),
};
