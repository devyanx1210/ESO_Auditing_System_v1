import { useEffect, useState } from "react";

function applyTheme(dark: boolean) {
    if (dark) document.documentElement.classList.add("dark");
    else       document.documentElement.classList.remove("dark");
}

export function useTheme() {
    const [darkMode, setDarkModeState] = useState<boolean>(() => {
        return localStorage.getItem("theme") === "dark";
    });

    const [notificationsEnabled, setNotifState] = useState<boolean>(() => {
        return localStorage.getItem("notificationsEnabled") !== "false";
    });

    // Apply theme on mount and whenever darkMode changes
    useEffect(() => {
        applyTheme(darkMode);
        localStorage.setItem("theme", darkMode ? "dark" : "light");
    }, [darkMode]);

    // Listen for cross-component theme changes (dispatched below)
    useEffect(() => {
        const onTheme = () => {
            const isDark = localStorage.getItem("theme") === "dark";
            setDarkModeState(isDark); // will trigger the effect above
        };
        const onNotif = () => {
            setNotifState(localStorage.getItem("notificationsEnabled") !== "false");
        };
        window.addEventListener("themechange", onTheme);
        window.addEventListener("notifchange", onNotif);
        return () => {
            window.removeEventListener("themechange", onTheme);
            window.removeEventListener("notifchange", onNotif);
        };
    }, []);

    function setDarkMode(value: boolean | ((prev: boolean) => boolean)) {
        const next = typeof value === "function" ? value(darkMode) : value;
        setDarkModeState(next);
        // Notify sibling components after this render
        setTimeout(() => window.dispatchEvent(new Event("themechange")), 0);
    }

    function setNotificationsEnabled(value: boolean | ((prev: boolean) => boolean)) {
        const next = typeof value === "function" ? value(notificationsEnabled) : value;
        setNotifState(next);
        localStorage.setItem("notificationsEnabled", String(next));
        setTimeout(() => window.dispatchEvent(new Event("notifchange")), 0);
    }

    return { darkMode, setDarkMode, notificationsEnabled, setNotificationsEnabled };
}
