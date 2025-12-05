-- Create the caja_menor_records table for individual caja menor entries
CREATE TABLE IF NOT EXISTS caja_menor_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  value DECIMAL(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_caja_menor_records_date ON caja_menor_records(date);
CREATE INDEX IF NOT EXISTS idx_caja_menor_records_category ON caja_menor_records(category);

-- Enable RLS (Row Level Security)
ALTER TABLE caja_menor_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (to avoid errors on re-run)
DROP POLICY IF EXISTS "Allow all operations on caja_menor_records" ON caja_menor_records;

-- Create RLS policy (allow all since this is a simple accounting app)
CREATE POLICY "Allow all operations on caja_menor_records"
  ON caja_menor_records FOR ALL USING (true) WITH CHECK (true);

