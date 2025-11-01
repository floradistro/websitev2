-- Add parent_category_id to categories table for hierarchy support
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create index for faster parent category lookups
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_category_id);

-- Update beverage subcategories to be under Beverages parent
UPDATE categories
SET parent_category_id = (SELECT id FROM categories WHERE name = 'Beverages')
WHERE name IN ('Day Drinker (5mg)', 'Golden Hour (10mg)', 'Darkside (30mg)', 'Riptide (60mg)');

-- Add comment
COMMENT ON COLUMN categories.parent_category_id IS 'Parent category for hierarchical organization (e.g., beverage types under Beverages)';
