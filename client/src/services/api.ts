const BASE_URL = "/api/v1";

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

/** Thrown when the server returns 401. Triggers auto-logout. */
export class AuthError extends Error {
    readonly status = 401;
    constructor(message: string) {
        super(message);
        this.name = "AuthError";
    }
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
    token?: string | null
): Promise<T> {
    const headers: Record<string, string> = {};

    // Let the browser set Content-Type automatically for FormData (multipart boundary)
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    const text = await res.text();
    let json: ApiResponse<T>;
    try {
        json = JSON.parse(text);
    } catch {
        throw new Error(res.status === 429 ? "Too many requests — please wait and try again." : `Server error (${res.status})`);
    }

    if (!res.ok) {
        if (res.status === 401) {
            // Signal all listeners (AuthContext) to log the user out
            window.dispatchEvent(new Event("eso:auth:expired"));
            throw new AuthError(json.message || "Session expired. Please log in again.");
        }
        throw new Error(json.message || "Request failed");
    }

    return json.data;
}
