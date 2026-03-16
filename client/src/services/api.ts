const BASE_URL = "http://localhost:5000/api/v1";

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
    token?: string | null
): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

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
        throw new Error(json.message || "Request failed");
    }

    return json.data;
}
