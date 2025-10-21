-- Create vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  store_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  wordpress_user_id INTEGER UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS vendors_email_idx ON public.vendors(email);
CREATE INDEX IF NOT EXISTS vendors_wordpress_user_id_idx ON public.vendors(wordpress_user_id);
CREATE INDEX IF NOT EXISTS vendors_slug_idx ON public.vendors(slug);

-- Enable Row Level Security
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own vendor data
CREATE POLICY "Vendors can view own data"
  ON public.vendors
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Policy: Service role can do anything
CREATE POLICY "Service role has full access"
  ON public.vendors
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT ALL ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;

