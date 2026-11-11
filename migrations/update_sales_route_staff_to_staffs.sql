DROP TABLE IF EXISTS `sales_route_staff`;

CREATE TABLE `sales_route_staff` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sales_route_id` INT NOT NULL,
  `staff_id` INT NOT NULL,
  `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `assigned_by` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_route_staff` (`sales_route_id`, `staff_id`),
  KEY `idx_sales_route_id` (`sales_route_id`),
  KEY `idx_staff_id` (`staff_id`),
  CONSTRAINT `fk_sales_route_staff_route` FOREIGN KEY (`sales_route_id`) REFERENCES `sales_routes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sales_route_staff_staff` FOREIGN KEY (`staff_id`) REFERENCES `staffs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
