const API = "http://localhost:5000/api/v1";

export interface ImportCheckResult {
    exists:      boolean;
    importedAt:  string | null;
    recordCount: number;
}

export interface ImportResult {
    imported: number;
    skipped:  number;
    errors:   string[];
}

export interface ImportSession {
    importId:     number;
    schoolYear:   string;
    semester:     string;
    recordCount:  number;
    skippedCount: number;
    errorCount:   number;
    importedAt:   string;
    importedBy:   string;
}

export const studentImportService = {
    check: async (
        token: string,
        params: { schoolYear: string; semester: string }
    ): Promise<ImportCheckResult> => {
        const q = new URLSearchParams({
            schoolYear: params.schoolYear,
            semester:   params.semester,
        });
        const res  = await fetch(`${API}/student-import/check?${q}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message ?? "Check failed");
        return json.data;
    },

    import: async (
        token: string,
        params: { schoolYear: string; semester: string },
        file: File
    ): Promise<ImportResult> => {
        const form = new FormData();
        form.append("schoolYear", params.schoolYear);
        form.append("semester",   params.semester);
        form.append("csv",        file);

        const res  = await fetch(`${API}/student-import`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: form,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message ?? "Import failed");
        return json.data;
    },

    getSessions: async (token: string): Promise<ImportSession[]> => {
        const res  = await fetch(`${API}/student-import/sessions`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message ?? "Failed to load sessions");
        return json.data;
    },

    deleteSession: async (token: string, importId: number): Promise<void> => {
        const res  = await fetch(`${API}/student-import/${importId}`, {
            method:  "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message ?? "Delete failed");
    },
};
