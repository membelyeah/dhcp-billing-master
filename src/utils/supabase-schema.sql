
-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  lease_id TEXT REFERENCES public.mikrotik_leases(id),
  plan TEXT NOT NULL,
  monthly_fee NUMERIC NOT NULL,
  registration_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'terminated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE,
  due_date DATE NOT NULL,
  method TEXT CHECK (method IN ('QRIS', 'Bank Transfer', 'E-wallet', 'Cash')),
  reference TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mikrotik_leases table to store synchronized lease data
CREATE TABLE public.mikrotik_leases (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  mac_address TEXT NOT NULL,
  client_id TEXT,
  hostname TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'blocked', 'expired')),
  expiry_date TEXT NOT NULL,
  bandwidth TEXT NOT NULL CHECK (bandwidth IN ('6M/3M', '10M/5M')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indices for better performance
CREATE INDEX idx_clients_lease_id ON public.clients(lease_id);
CREATE INDEX idx_payments_client_id ON public.payments(client_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_mikrotik_leases_status ON public.mikrotik_leases(status);

-- Create RLS policies
-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mikrotik_leases ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access for all authenticated users"
  ON public.clients
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for all authenticated users"
  ON public.payments
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for all authenticated users"
  ON public.mikrotik_leases
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow insert/update/delete for authenticated users
CREATE POLICY "Allow full access for authenticated users"
  ON public.clients
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for authenticated users"
  ON public.payments
  FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for authenticated users"
  ON public.mikrotik_leases
  FOR ALL
  USING (auth.role() = 'authenticated');
