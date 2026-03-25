const API_BASE = "http://localhost:5000/api/v1";

export interface AdminProfile {
    adminId:     number;
    userId:      number;
    firstName:   string;
    lastName:    string;
    email:       string;
    role:        string;
    roleLabel:   string;
    position:    string;
    programName: string | null;
    programCode: string | null;
    yearLevel:   number | null;
    section:     string | null;
    avatarPath:  string | null;
}

export const adminAvatarUrl = (p: string) =>
    p.startsWith("http") ? p : p.startsWith("/") ? `http://localhost:5000${p}` : `http://localhost:5000/uploads/${p}`;

export const adminProfileService = {
    getProfile: async (token: string): Promise<AdminProfile> => {
        const res = await fetch(`${API_BASE}/admin/profile/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message ?? "Failed to load profile");
        return json.data;
    },

    updateProfile: async (
        token: string,
        data: { firstName: string; lastName: string; position: string; clearAvatar?: boolean },
        avatarFile?: File | null
    ): Promise<AdminProfile> => {
        const form = new FormData();
        form.append("firstName", data.firstName);
        form.append("lastName",  data.lastName);
        form.append("position",  data.position);
        if (data.clearAvatar) form.append("clearAvatar", "true");
        if (avatarFile) form.append("avatar", avatarFile);

        const res = await fetch(`${API_BASE}/admin/profile/me`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
            body: form,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message ?? "Failed to update profile");
        return json.data;
    },
};
