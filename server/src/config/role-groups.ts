// Role groupings used across services for filtering and access control.
// When a new officer role is added to the roles table, add it to the right group here.

export const CLASS_ROLES   = ["class_officer", "class_secretary", "class_treasurer", "class_president"] as const;
export const PROGRAM_ROLES = ["program_officer", "program_treasurer", "program_president"] as const;
export const ESO_ROLES     = ["eso_officer", "eso_treasurer", "eso_vpsa", "eso_president"] as const;
export const SIGNATORY_ROLES = ["signatory", "osas_coordinator"] as const;
export const HEAD_ROLES    = ["program_head"] as const;
export const DEAN_ROLES    = ["dean"] as const;

export const ALL_ADMIN_ROLES = [
    ...CLASS_ROLES,
    ...PROGRAM_ROLES,
    ...ESO_ROLES,
    ...SIGNATORY_ROLES,
    ...HEAD_ROLES,
    ...DEAN_ROLES,
] as const;

export type AdminRole = typeof ALL_ADMIN_ROLES[number];

export function isClassRole(role: string)    { return (CLASS_ROLES as readonly string[]).includes(role); }
export function isProgramRole(role: string)  { return (PROGRAM_ROLES as readonly string[]).includes(role); }
export function isEsoRole(role: string)      { return (ESO_ROLES as readonly string[]).includes(role); }
export function isSignatoryRole(role: string){ return (SIGNATORY_ROLES as readonly string[]).includes(role); }
