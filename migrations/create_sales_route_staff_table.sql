-- Migration: Create sales_route_staff junction table
-- Description: Creates a many-to-many relationship between sales routes and staff (users)

CREATE TABLE IF NOT EXISTS `sales_route_staff` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sales_route_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `assigned_by` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_route_user` (`sales_route_id`, `user_id`),
  KEY `idx_sales_route_id` (`sales_route_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_sales_route_staff_route` FOREIGN KEY (`sales_route_id`) REFERENCES `sales_routes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sales_route_staff_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
