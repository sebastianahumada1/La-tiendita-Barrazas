-- Create the daily_records table
CREATE TABLE IF NOT EXISTS daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  day_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the sales_data table
CREATE TABLE IF NOT EXISTS sales_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the summary_data table
CREATE TABLE IF NOT EXISTS summary_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
  is_calculated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_data_record_id ON sales_data(record_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_record_id ON payment_methods(record_id);
CREATE INDEX IF NOT EXISTS idx_summary_data_record_id ON summary_data(record_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_records(date);

-- Enable RLS (Row Level Security)
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE summary_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Allow all operations on daily_records" ON daily_records;
DROP POLICY IF EXISTS "Allow all operations on sales_data" ON sales_data;
DROP POLICY IF EXISTS "Allow all operations on payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "Allow all operations on summary_data" ON summary_data;

-- Create RLS policies (allow all since this is a simple accounting app without user authentication)
CREATE POLICY "Allow all operations on daily_records"
  ON daily_records FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on sales_data"
  ON sales_data FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on payment_methods"
  ON payment_methods FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on summary_data"
  ON summary_data FOR ALL USING (true) WITH CHECK (true);
