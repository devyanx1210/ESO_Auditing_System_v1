import pool from "../config/db.js";

/**
 * Write one audit log entry.  Failures are silent — never block the main action.
 */
export async function logAction(params: {
    performedBy: number;
    action: string;
    targetType?: string | null;
    targetId?: number | null;
    details?: Record<string, unknown> | null;
    ipAddress?: string | null;
}): Promise<void> {
    try {
        await pool.execute(
            `INSERT INTO audit_logs (performed_by, action, target_type, target_id, details, ip_address, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
                params.performedBy,
                params.action,
                params.targetType   ?? null,
                params.targetId     ?? null,
                params.details      ? JSON.stringify(params.details) : null,
                params.ipAddress    ?? null,
            ]
        );
    } catch {
        // silent — audit log failure must not disrupt the request
    }
}
