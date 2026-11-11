-- Migration: Create order_staff junction table for order-staff assignments
-- Date: 2026-01-06

CREATE TABLE IF NOT EXISTS `order_staff` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `staff_id` INT NOT NULL,
  `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `assigned_by` INT DEFAULT NULL,
  `role` VARCHAR(50) DEFAULT NULL COMMENT 'e.g., primary, support, driver',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_order_staff` (`order_id`, `staff_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_staff_id` (`staff_id`),
  CONSTRAINT `fk_order_staff_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_staff_staff` FOREIGN KEY (`staff_id`) REFERENCES `staffs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
