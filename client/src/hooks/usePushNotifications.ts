import { useEffect } from "react";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(b64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function getVapidKey(): Promise<string | null> {
    try {
        const res = await fetch("/api/v1/notifications/push/vapid-key");
        if (!res.ok) return null;
        const json = await res.json();
        return json?.data?.key ?? null;
    } catch {
        return null;
    }
}

async function saveSubscription(sub: PushSubscription, token: string): Promise<void> {
    await fetch("/api/v1/notifications/push/subscribe", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(sub.toJSON()),
    });
}

export function usePushNotifications(userId: number | undefined, token: string | null) {
    useEffect(() => {
        if (!userId || !token) return;
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

        let cancelled = false;

        (async () => {
            try {
                const vapidKey = await getVapidKey();
                if (!vapidKey || cancelled) return;

                const reg = await navigator.serviceWorker.ready;
                if (cancelled) return;

                // Re-use existing subscription without asking for permission again
                const existing = await reg.pushManager.getSubscription();
                if (existing) {
                    await saveSubscription(existing, token);
                    return;
                }

                const permission = await Notification.requestPermission();
                if (permission !== "granted" || cancelled) return;

                const sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey),
                });
                if (!cancelled) await saveSubscription(sub, token);
            } catch (err) {
                console.warn("[push] Subscribe failed:", err);
            }
        })();

        return () => { cancelled = true; };
    }, [userId, token]);
}
