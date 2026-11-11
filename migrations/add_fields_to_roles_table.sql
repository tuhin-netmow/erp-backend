-- Migration to add new fields to roles table
ALTER TABLE roles ADD COLUMN display_name VARCHAR(255) NULL AFTER name;
ALTER TABLE roles ADD COLUMN description TEXT NULL AFTER display_name;
ALTER TABLE roles ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active' AFTER description;
ALTER TABLE roles ADD COLUMN permissions TEXT NULL AFTER status;
