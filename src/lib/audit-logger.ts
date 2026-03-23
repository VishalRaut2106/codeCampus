import { SupabaseClient } from '@supabase/supabase-js'

export type AuditAction = 'approve' | 'reject' | 'delete' | 'create' | 'update' | 'change_role' | 'restrict' | 'unrestrict'
export type AuditTargetType = 'user' | 'contest' | 'problem' | 'submission' | 'system'

/**
 * Logs an administrative action to the audit_logs table.
 * 
 * @param supabase The Supabase client instance (server component or route handler client)
 * @param adminId The UUID of the admin performing the action
 * @param action The type of action performed
 * @param targetId The ID of the item being acted upon
 * @param targetName The human-readable name of the item (for display)
 * @param targetType The type of item
 * @param details Optional JSON object with more details (e.g., changes made)
 */
export async function logAdminAction(
  supabase: SupabaseClient,
  adminId: string,
  action: AuditAction,
  targetId: string,
  targetName: string,
  targetType: AuditTargetType,
  details?: Record<string, any>
) {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      admin_id: adminId,
      action,
      target_id: targetId,
      target_name: targetName,
      target_type: targetType,
      details
    })

    if (error) {
      console.error('Failed to log audit action:', error)
      // We don't throw here to avoid failing the main action just because logging failed
    }
  } catch (err) {
    console.error('Unexpected error logging audit action:', err)
  }
}
