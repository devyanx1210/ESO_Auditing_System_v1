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
self.addEventListener("push", (event) => {
    const data = (event as PushEvent).data?.json() ?? {};
    const title = data.title ?? "ESO Notification";
    const options: NotificationOptions = {
        body:      data.body ?? "",
        icon:      "/android-chrome-192x192.png",
        badge:     "/android-chrome-192x192.png",
        data:      { url: data.url ?? "/" },
        tag:       "eso-notif",
        renotify:  true,
    };
    (event as ExtendableEvent).waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Tap notification → focus or open the app
self.addEventListener("notificationclick", (event) => {
    (event as NotificationEvent).notification.close();
    const url = (event as NotificationEvent).notification.data?.url ?? "/";
    (event as ExtendableEvent).waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clients) => {
                const existing = clients.find((c) => "focus" in c);
                return existing ? existing.focus() : self.clients.openWindow(url);
            })
    );
});
