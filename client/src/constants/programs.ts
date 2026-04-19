// Shared program name constants used across admin and student pages

export const PROGRAM_NAMES: Record<string, string> = {
    CpE: "Computer Engineering",
    CE:  "Civil Engineering",
    ECE: "Electronics Engineering",
    EE:  "Electrical Engineering",
    ME:  "Mechanical Engineering",
};

export const PROGRAMS_LIST = Object.entries(PROGRAM_NAMES).map(([code, name]) => ({ code, name }));

export function programLabel(code: string): string {
    return PROGRAM_NAMES[code] ?? code;
}
