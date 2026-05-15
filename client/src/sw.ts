/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Navigation: network-first, fall back to cached index.html
registerRoute(
    new NavigationRoute(
        new NetworkFirst({ cacheName: "pages" }),
        { denylist: [/^\/api/, /^\/uploads/] }
    )
);

// Uploads: cache-first
registerRoute(
    /^\/uploads\//,
    new CacheFirst({
        cacheName: "uploads-cache",
        plugins: [
            new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }),
        ],
    }),
    "GET"
);

// Web Push — show OS notification
self.addEventListener("push", (event: Event) => {
    const pushEvent = event as PushEvent;
    const data = pushEvent.data?.json() ?? {};
    const title = data.title ?? "ESO Notification";
    const options = {
        body:      data.body ?? "",
        icon:      "/android-chrome-192x192.png",
        badge:     "/android-chrome-192x192.png",
        data:      { url: data.url ?? "/" },
        tag:       "eso-notif",
        renotify:  true,
    } as NotificationOptions & { renotify: boolean };
    (event as ExtendableEvent).waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Tap notification → focus or open the app
self.addEventListener("notificationclick", (event: Event) => {
    const notifEvent = event as NotificationEvent;
    notifEvent.notification.close();
    const url = notifEvent.notification.data?.url ?? "/";
    (event as ExtendableEvent).waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clients: readonly WindowClient[]) => {
                const existing = clients.find((c: WindowClient) => "focus" in c);
                return existing ? existing.focus() : self.clients.openWindow(url);
            })
    );
});
