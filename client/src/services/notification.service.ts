import { apiFetch } from "./api";

export interface NotificationItem {
    notificationId: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    referenceId: number | null;
    referenceType: string | null;
}

export const notificationService = {
    getAll: (token: string) =>
        apiFetch<NotificationItem[]>("/notifications", {}, token),

    markRead: (token: string, id: number) =>
        apiFetch<null>(`/notifications/${id}/read`, { method: "PATCH" }, token),

    markAllRead: (token: string) =>
        apiFetch<null>("/notifications/read-all", { method: "PATCH" }, token),
};
