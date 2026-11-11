-- Add initial_stock column to products table
-- This column tracks the original stock quantity when a product was created

ALTER TABLE products 
ADD COLUMN initial_stock INT NULL 
COMMENT 'Initial stock quantity when product was created'
AFTER stock_quantity;
