import { createAdminClient } from '../supabase/admin';
const logger = console;

export type AdminAction =
  | 'user_role_change'
  | 'user_suspended'
  | 'user_suspension_lifted'
  | 'user_deleted'
  | 'feature_flag_update'
  | 'abuse_log_reviewed'
  | 'abuse_log_escalated'
  | 'admin_viewed_user';

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: AdminAction;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export async function logAdminAction(params: {
  adminId: string;
  action: AdminAction;
  targetType: 'user' | 'feature_flag' | 'abuse_log' | 'system';
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from('admin_audit_log').insert({
      admin_id: params.adminId,
      action: params.action,
      target_type: params.targetType,
      target_id: params.targetId || null,
      metadata: params.metadata || {},
      ip_address: params.ipAddress || null
    });
  } catch (err) {
    logger.error({ msg: 'Failed to write admin audit log', error: err, params });
  }
}

export async function getRecentAuditLog(limit = 50): Promise<AdminAuditLog[]> {
  const admin = createAdminClient();
  const { data } = await admin.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(limit);
  return data || [];
}
