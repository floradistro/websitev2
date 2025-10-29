-- ============================================================================
-- Add date_of_birth column to customers table for ID verification
-- ============================================================================

-- Add date_of_birth column
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Create index for date_of_birth for faster lookups during ID matching
CREATE INDEX IF NOT EXISTS customers_dob_idx ON public.customers(date_of_birth);

-- Create composite index for name + DOB matching (used by ID scanner)
CREATE INDEX IF NOT EXISTS customers_name_dob_idx
ON public.customers(first_name, last_name, date_of_birth);

-- Comment on column
COMMENT ON COLUMN public.customers.date_of_birth IS 'Customer date of birth - used for age verification and ID scanning';
