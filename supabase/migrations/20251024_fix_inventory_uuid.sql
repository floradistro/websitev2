-- ============================================================================
-- FIX INVENTORY TABLE TO USE UUID PRODUCT_ID
-- Convert inventory table from integer product_id to UUID
-- ============================================================================

-- Step 1: Add a new UUID column for product_id
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS product_uuid UUID;

-- Step 2: Update the new column with UUID from products table
UPDATE public.inventory inv
SET product_uuid = p.id
FROM public.products p
WHERE inv.product_id = p.id::text::integer
   OR inv.product_id::text = p.id::text;

-- Step 3: Drop the old constraint if exists
ALTER TABLE public.inventory 
DROP CONSTRAINT IF EXISTS inventory_product_id_location_id_key;

-- Step 4: Drop the old product_id column
ALTER TABLE public.inventory 
DROP COLUMN IF EXISTS product_id CASCADE;

-- Step 5: Rename product_uuid to product_id
ALTER TABLE public.inventory 
RENAME COLUMN product_uuid TO product_id;

-- Step 6: Add back the constraint with UUID
ALTER TABLE public.inventory 
ADD CONSTRAINT inventory_product_location_unique 
UNIQUE(product_id, location_id);

-- Step 7: Add foreign key constraint
ALTER TABLE public.inventory
ADD CONSTRAINT inventory_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES public.products(id) 
ON DELETE CASCADE;

-- Step 8: Create index for performance
CREATE INDEX IF NOT EXISTS idx_inventory_product_id 
ON public.inventory(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_location_id 
ON public.inventory(location_id);

CREATE INDEX IF NOT EXISTS idx_inventory_product_location 
ON public.inventory(product_id, location_id);
