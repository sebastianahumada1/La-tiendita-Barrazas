-- Create the audit_log table for tracking changes
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (to avoid errors on re-run)
DROP POLICY IF EXISTS "Allow all operations on audit_log" ON audit_log;

-- Create RLS policy (allow all since this is a simple accounting app)
CREATE POLICY "Allow all operations on audit_log"
  ON audit_log FOR ALL USING (true) WITH CHECK (true);
