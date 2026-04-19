import { useEffect, useState, useCallback } from "react";
import { AuthError } from "../services/api";

const CACHE_PREFIX = "eso_cache_";
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour max age

interface CacheEntry<T> {
    data: T;
    cachedAt: number;
}

function cacheKey(key: string) {
    return CACHE_PREFIX + key;
}

function readCache<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(cacheKey(key));
        if (!raw) return null;
        const entry: CacheEntry<T> = JSON.parse(raw);
        if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
            localStorage.removeItem(cacheKey(key));
            return null;
        }
        return entry.data;
    } catch {
        return null;
    }
}

function writeCache<T>(key: string, data: T) {
    try {
        const entry: CacheEntry<T> = { data, cachedAt: Date.now() };
        localStorage.setItem(cacheKey(key), JSON.stringify(entry));
    } catch {
        // localStorage quota exceeded — silently skip
    }
}

export function clearCache(key: string) {
    localStorage.removeItem(cacheKey(key));
}

/** Returns whether the browser is currently online */
export function useOnlineStatus() {
    const [online, setOnline] = useState(navigator.onLine);
    useEffect(() => {
        const on  = () => setOnline(true);
        const off = () => setOnline(false);
        window.addEventListener("online",  on);
        window.addEventListener("offline", off);
        return () => {
            window.removeEventListener("online",  on);
            window.removeEventListener("offline", off);
        };
    }, []);
    return online;
}

/**
 * Fetches data with offline fallback via localStorage.
 * - When online: fetches from server, caches result in localStorage
 * - When offline: returns last cached result and sets `fromCache = true`
 * - `stale` is true when the displayed data came from cache (not live)
 */
export function useOfflineCache<T>(
    cacheId: string,
    fetcher: () => Promise<T>,
    deps: unknown[] = []
): {
    data: T | null;
    loading: boolean;
    error: string;
    stale: boolean;
    online: boolean;
    refresh: () => void;
} {
    const online = useOnlineStatus();
    const [data,    setData]    = useState<T | null>(() => readCache<T>(cacheId));
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");
    const [stale,   setStale]   = useState(() => readCache<T>(cacheId) !== null);

    const load = useCallback(async () => {
        if (!navigator.onLine) {
            const cached = readCache<T>(cacheId);
            if (cached !== null) {
                setData(cached);
                setStale(true);
            } else {
                setError("You are offline and no cached data is available.");
            }
            return;
        }
        setLoading(true);
        setError("");
        try {
            const result = await fetcher();
            writeCache(cacheId, result);
            setData(result);
            setStale(false);
        } catch (e: any) {
            // Auth errors — do not fall back to cache (AuthContext handles logout)
            if (e instanceof AuthError) {
                setError(""); // AuthContext will redirect to login
                return;
            }
            // Network failed — try cache
            const cached = readCache<T>(cacheId);
            if (cached !== null) {
                setData(cached);
                setStale(true);
                setError("Could not reach server. Showing cached data.");
            } else {
                setError(e.message ?? "Failed to load data.");
            }
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cacheId, ...deps]);

    useEffect(() => { load(); }, [load]);

    // Auto-refresh when coming back online
    useEffect(() => {
        if (online) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [online]);

    return { data, loading, error, stale, online, refresh: load };
}
