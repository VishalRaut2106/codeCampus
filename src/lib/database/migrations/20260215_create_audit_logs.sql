-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'approve', 'reject', 'delete', 'create', 'update_role', etc.
    target_id TEXT, -- ID of the user/contest/etc being acted upon
    target_name TEXT, -- Human readable name for display (e.g. "John Doe", "Weekly Contest 5")
    target_type TEXT NOT NULL, -- 'user', 'contest', 'problem', 'system'
    details JSONB, -- Extra data like "reason for rejection", "old_role -> new_role"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admins and Super Admins can view all logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
        )
    );

-- Admins and Super Admins can insert logs (server-side mostly, but good to have)
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
        )
    );

-- No one can update or delete logs (Immutable audit trail)
-- (No policies for UPDATE/DELETE implies deny all)

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
