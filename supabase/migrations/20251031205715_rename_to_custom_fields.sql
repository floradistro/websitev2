-- Rename blueprint_fields to custom_fields
-- This standardizes field naming across the entire system
ALTER TABLE products RENAME COLUMN blueprint_fields TO custom_fields;
