export const ADMIN_ROLES = ["admin", "superadmin"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];
