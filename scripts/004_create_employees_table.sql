-- Create the employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the employee_payments table
CREATE TABLE IF NOT EXISTS employee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'transferencia')),
  amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_employee_payments_employee_id ON employee_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_payments_date ON employee_payments(date);
CREATE INDEX IF NOT EXISTS idx_employee_payments_payment_type ON employee_payments(payment_type);

-- Enable RLS (Row Level Security)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Allow all operations on employees" ON employees;
DROP POLICY IF EXISTS "Allow all operations on employee_payments" ON employee_payments;

-- Create RLS policies (allow all since this is a simple accounting app)
CREATE POLICY "Allow all operations on employees"
  ON employees FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on employee_payments"
  ON employee_payments FOR ALL USING (true) WITH CHECK (true);

