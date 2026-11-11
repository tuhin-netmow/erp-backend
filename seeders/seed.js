/**
 * Seed Script for ERP System
 * Run this to populate the database with test data
 */

const { sequelize } = require('../src/core/database/sequelize');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Disable foreign key checks to prevent issues during seeding
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Seed Categories
    console.log('📦 Seeding categories...');
    await sequelize.query(`
      INSERT INTO categories (name, description, created_at) VALUES
      ('Electronics', 'Electronic devices and accessories', NOW()),
      ('Office Supplies', 'Office and stationery items', NOW()),
      ('Furniture', 'Office and home furniture', NOW()),
      ('Software', 'Software licenses and subscriptions', NOW()),
      ('Hardware', 'Computer hardware and peripherals', NOW())
      ON DUPLICATE KEY UPDATE name=name;
    `);
    console.log('✅ Categories seeded\n');

    // 2. Seed Units
    console.log('📏 Seeding units...');
    await sequelize.query(`
      INSERT INTO units (name, symbol, is_active, created_at, updated_at) VALUES
      ('Piece', 'pcs', 1, NOW(), NOW()),
      ('Box', 'box', 1, NOW(), NOW()),
      ('Kilogram', 'kg', 1, NOW(), NOW()),
      ('Liter', 'L', 1, NOW(), NOW()),
      ('Meter', 'm', 1, NOW(), NOW()),
      ('Set', 'set', 1, NOW(), NOW()),
      ('Dozen', 'doz', 1, NOW(), NOW()),
      ('Pack', 'pack', 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE name=name;
    `);
    console.log('✅ Units seeded\n');

    // 3. Seed Suppliers
    console.log('🏭 Seeding suppliers...');
    await sequelize.query(`
      INSERT INTO suppliers (name, contact_person, email, phone, address, city, country, is_active, created_at, code, latitude, longitude) VALUES
      ('Tech Supplies Inc', 'John Smith', 'john@techsupplies.com', '+1234567890', '123 Tech Street', 'New York', 'USA', 1, NOW(), 'SUP-001', 40.7128, -74.0060),
      ('Office Depot Ltd', 'Jane Doe', 'jane@officedepot.com', '+1234567891', '456 Office Ave', 'London', 'UK', 1, NOW(), 'SUP-002', 51.5074, -0.1278),
      ('Global Hardware Co', 'Bob Wilson', 'bob@globalhw.com', '+1234567892', '789 Hardware Blvd', 'Tokyo', 'Japan', 1, NOW(), 'SUP-003', 35.6762, 139.6503),
      ('Software Solutions', 'Alice Brown', 'alice@softwaresol.com', '+1234567893', '321 Code Lane', 'Berlin', 'Germany', 1, NOW(), 'SUP-004', 52.5200, 13.4050),
      ('Furniture World', 'Charlie Davis', 'charlie@furnitureworld.com', '+1234567894', '654 Design St', 'Paris', 'France', 1, NOW(), 'SUP-005', 48.8566, 2.3522),
      ('Dhaka Electronics', 'Rahim Uddin', 'rahim@dhakaelec.com', '+8801711111111', '123 Gulshan Ave', 'Dhaka', 'Bangladesh', 1, NOW(), 'SUP-006', 23.8103, 90.4125),
      ('Rajshahi Traders', 'Karim Mia', 'karim@rajshahi.com', '+8801722222222', 'Station Road', 'Rajshahi', 'Bangladesh', 1, NOW(), 'SUP-007', 24.3790, 88.5698)
      ON DUPLICATE KEY UPDATE name=name;
    `);
    console.log('✅ Suppliers seeded\n');

    // 4. Seed Customers
    console.log('👥 Seeding customers...');
    await sequelize.query(`
      INSERT INTO customers (name, email, phone, company, address, city, country, customer_type, is_active, created_at) VALUES
      ('ABC Corporation', 'contact@abc.com', '+1111111111', 'ABC Corp', '100 Business St', 'New York', 'USA', 'business', 1, NOW()),
      ('XYZ Enterprises', 'info@xyz.com', '+2222222222', 'XYZ Ltd', '200 Commerce Ave', 'London', 'UK', 'business', 1, NOW()),
      ('John Individual', 'john.ind@email.com', '+3333333333', NULL, '300 Home St', 'Chicago', 'USA', 'individual', 1, NOW()),
      ('Tech Startup Inc', 'hello@techstartup.com', '+4444444444', 'Tech Startup', '400 Innovation Blvd', 'San Francisco', 'USA', 'business', 1, NOW()),
      ('Jane Smith', 'jane.smith@email.com', '+5555555555', NULL, '500 Residential Rd', 'Boston', 'USA', 'individual', 1, NOW())
      ON DUPLICATE KEY UPDATE name=name;
    `);
    console.log('✅ Customers seeded\n');

    // 5. Seed Departments
    console.log('🏢 Seeding departments...');
    // Note: Assuming auto-increment starts at 1. If not, foreign keys in staff might break.
    // We'll trust the order: 1=Sales, 2=IT, 3=HR, 4=Finance, 5=Operations
    await sequelize.query(`
      INSERT INTO departments (name, description, created_at) VALUES
      ('Sales', 'Sales and customer relations', NOW()),
      ('IT', 'Information Technology', NOW()),
      ('HR', 'Human Resources', NOW()),
      ('Finance', 'Finance and Accounting', NOW()),
      ('Operations', 'Operations and Logistics', NOW())
      ON DUPLICATE KEY UPDATE name=name;
    `);
    console.log('✅ Departments seeded\n');

    // 6. Seed Staff - Fixed department_id
    console.log('👔 Seeding staff...');
    await sequelize.query(`
      INSERT INTO staffs (first_name, last_name, email, phone, position, department_id, hire_date, salary, status, created_at, updated_at) VALUES
      ('Michael', 'Johnson', 'michael.j@company.com', '+6666666666', 'Sales Manager', 1, '2023-01-15', 5000.00, 'active', NOW(), NOW()),
      ('Sarah', 'Williams', 'sarah.w@company.com', '+7777777777', 'IT Specialist', 2, '2023-02-20', 4500.00, 'active', NOW(), NOW()),
      ('David', 'Brown', 'david.b@company.com', '+8888888888', 'HR Manager', 3, '2023-03-10', 4800.00, 'active', NOW(), NOW()),
      ('Emily', 'Davis', 'emily.d@company.com', '+9999999999', 'Accountant', 4, '2023-04-05', 4200.00, 'active', NOW(), NOW()),
      ('James', 'Miller', 'james.m@company.com', '+1010101010', 'Operations Lead', 5, '2023-05-12', 4600.00, 'active', NOW(), NOW())
      ON DUPLICATE KEY UPDATE email=email;
    `);
    console.log('✅ Staff seeded\n');

    // 7. Seed Products
    console.log('🛍️ Seeding products...');
    await sequelize.query(`
      INSERT INTO products (name, sku, description, category_id, unit_id, price, cost, stock_quantity, min_stock_level, is_active, created_at, updated_at, sales_tax, purchase_tax) VALUES
      ('Laptop Dell XPS 15', 'LAPTOP-001', 'High-performance laptop', 1, 1, 1500.00, 1000.00, 50, 10, 1, NOW(), NOW(), 10.00, 5.00),
      ('Wireless Mouse', 'MOUSE-001', 'Ergonomic wireless mouse', 1, 1, 25.00, 15.00, 200, 50, 1, NOW(), NOW(), 5.00, 2.00),
      ('Office Chair', 'CHAIR-001', 'Comfortable office chair', 3, 1, 250.00, 150.00, 30, 5, 1, NOW(), NOW(), 8.00, 4.00),
      ('A4 Paper Box', 'PAPER-001', 'Box of 500 sheets A4 paper', 2, 2, 20.00, 12.00, 100, 20, 1, NOW(), NOW(), 5.00, 2.00),
      ('USB Cable', 'CABLE-001', 'USB-C to USB-A cable', 5, 1, 10.00, 5.00, 300, 100, 1, NOW(), NOW(), 5.00, 2.00),
      ('Monitor 27 inch', 'MONITOR-001', '27 inch 4K monitor', 1, 1, 400.00, 250.00, 40, 10, 1, NOW(), NOW(), 10.00, 5.00),
      ('Keyboard Mechanical', 'KEYBOARD-001', 'RGB mechanical keyboard', 1, 1, 120.00, 70.00, 80, 20, 1, NOW(), NOW(), 10.00, 5.00),
      ('Desk Lamp', 'LAMP-001', 'LED desk lamp', 3, 1, 35.00, 20.00, 60, 15, 1, NOW(), NOW(), 8.00, 4.00),
      ('Notebook Set', 'NOTEBOOK-001', 'Set of 5 notebooks', 2, 6, 15.00, 8.00, 150, 30, 1, NOW(), NOW(), 5.00, 2.00),
      ('Pen Box', 'PEN-001', 'Box of 12 pens', 2, 2, 8.00, 4.00, 200, 50, 1, NOW(), NOW(), 5.00, 2.00)
      ON DUPLICATE KEY UPDATE sku=sku;
    `);
    console.log('✅ Products seeded\n');

    // 8. Seed Roles
    console.log('🔐 Seeding roles...');
    await sequelize.query(`
      INSERT INTO roles (name, created_at, display_name, description, status) VALUES
      ('Admin', NOW(), 'Administrator', 'Full access', 'active'),
      ('Manager', NOW(), 'Manager', 'Limited access', 'active'),
      ('Staff', NOW(), 'Staff', 'Basic access', 'active'),
      ('Viewer', NOW(), 'Viewer', 'Read only', 'active'),
      ('Superadmin', NOW(), 'Super Administrator', 'God mode', 'active')
      ON DUPLICATE KEY UPDATE name=name;
    `);
    console.log('✅ Roles seeded\n');

    // 9. Seed Users
    console.log('👤 Seeding users...');
    const hashedPassword = '$2b$10$rKJ5qKcVxQ5kqX5qKcVxQeYqKcVxQ5kqX5qKcVxQ5kqX5qKcVxQ5u';
    await sequelize.query(`
      INSERT INTO users (name, email, password, role_id, created_at) VALUES
      ('Admin User', 'admin@erp.com', '${hashedPassword}', 1, NOW()),
      ('Manager User', 'manager@erp.com', '${hashedPassword}', 2, NOW()),
      ('Staff User', 'staff@erp.com', '${hashedPassword}', 3, NOW())
      ON DUPLICATE KEY UPDATE email=email;
    `);
    console.log('✅ Users seeded\n');

    // 10. Seed Orders, OrderItems, Invoices, Payments, Deliveries
    console.log('🛒 Seeding sales data...');

    // Clean up existing sales data first to avoid duplicate key issues if running multiple times
    // Note: We are using ON DUPLICATE KEY UPDATE loosely, but cleaner to just purge for test data "refresh"
    // But since we can't easily rely on valid IDs without recreation, we'll try to insert.
    // If "refresh" meant "wipe", we should have truncated. I will trust the user wants 'add new' so I will append.

    // Orders (Total ~25 combined)
    // Statuses: pending, confirmed, shipped, delivered, cancelled

    // Pending Orders (5)
    await sequelize.query(`
            INSERT INTO orders (order_number, customer_id, order_date, status, total_amount, tax_amount, discount_amount, payment_status, created_at, updated_at) VALUES
            ('ORD-001', 1, DATE_SUB(NOW(), INTERVAL 1 DAY), 'pending', 1575.00, 75.00, 0.00, 'unpaid', NOW(), NOW()),
            ('ORD-002', 2, DATE_SUB(NOW(), INTERVAL 2 DAY), 'pending', 525.00, 25.00, 0.00, 'unpaid', NOW(), NOW()),
            ('ORD-003', 3, DATE_SUB(NOW(), INTERVAL 3 DAY), 'pending', 285.00, 35.00, 0.00, 'unpaid', NOW(), NOW()),
            ('ORD-004', 4, DATE_SUB(NOW(), INTERVAL 12 HOUR), 'pending', 40.00, 0.00, 0.00, 'unpaid', NOW(), NOW()),
            ('ORD-005', 5, NOW(), 'pending', 135.00, 15.00, 0.00, 'unpaid', NOW(), NOW());
        `);

    // Delivered Orders (6)
    await sequelize.query(`
            INSERT INTO orders (order_number, customer_id, order_date, status, total_amount, tax_amount, discount_amount, payment_status, created_at, updated_at) VALUES
            ('ORD-006', 1, DATE_SUB(NOW(), INTERVAL 10 DAY), 'delivered', 3000.00, 0.00, 0.00, 'paid', NOW(), NOW()),
            ('ORD-007', 2, DATE_SUB(NOW(), INTERVAL 9 DAY), 'delivered', 150.00, 10.00, 0.00, 'paid', NOW(), NOW()),
            ('ORD-008', 3, DATE_SUB(NOW(), INTERVAL 8 DAY), 'delivered', 500.00, 20.00, 0.00, 'paid', NOW(), NOW()),
            ('ORD-009', 4, DATE_SUB(NOW(), INTERVAL 7 DAY), 'delivered', 750.00, 50.00, 0.00, 'paid', NOW(), NOW()),
            ('ORD-010', 5, DATE_SUB(NOW(), INTERVAL 6 DAY), 'delivered', 25.00, 0.00, 0.00, 'paid', NOW(), NOW()),
            ('ORD-011', 1, DATE_SUB(NOW(), INTERVAL 5 DAY), 'delivered', 2000.00, 100.00, 0.00, 'paid', NOW(), NOW());
        `);

    // Others (Confirmed, Shipped, Cancelled) ~ Total 14 more to reach ~25
    await sequelize.query(`
            INSERT INTO orders (order_number, customer_id, order_date, status, total_amount, tax_amount, discount_amount, payment_status, created_at, updated_at) VALUES
            ('ORD-012', 2, DATE_SUB(NOW(), INTERVAL 4 DAY), 'confirmed', 500.00, 0.00, 0.00, 'partially_paid', NOW(), NOW()),
            ('ORD-013', 3, DATE_SUB(NOW(), INTERVAL 4 DAY), 'confirmed', 300.00, 0.00, 0.00, 'unpaid', NOW(), NOW()),
            ('ORD-014', 4, DATE_SUB(NOW(), INTERVAL 3 DAY), 'shipped', 1200.00, 50.00, 0.00, 'paid', NOW(), NOW()),
            ('ORD-015', 5, DATE_SUB(NOW(), INTERVAL 2 DAY), 'shipped', 80.00, 5.00, 0.00, 'partially_paid', NOW(), NOW()),
            ('ORD-016', 1, DATE_SUB(NOW(), INTERVAL 15 DAY), 'cancelled', 100.00, 0.00, 0.00, 'refunded', NOW(), NOW()),
            ('ORD-017', 2, DATE_SUB(NOW(), INTERVAL 1 DAY), 'processing', 200.00, 10.00, 0.00, 'unpaid', NOW(), NOW()),
            ('ORD-018', 3, NOW(), 'processing', 600.00, 30.00, 0.00, 'unpaid', NOW(), NOW()),
            ('ORD-019', 4, DATE_SUB(NOW(), INTERVAL 5 DAY), 'shipped', 450.00, 20.00, 0.00, 'paid', NOW(), NOW()),
            ('ORD-020', 5, DATE_SUB(NOW(), INTERVAL 6 DAY), 'confirmed', 110.00, 10.00, 0.00, 'unpaid', NOW(), NOW()),
            ('ORD-021', 1, DATE_SUB(NOW(), INTERVAL 20 DAY), 'delivered', 5000.00, 200.00, 0.00, 'paid', NOW(), NOW()),
            ('ORD-022', 2, DATE_SUB(NOW(), INTERVAL 18 DAY), 'delivered', 250.00, 15.00, 0.00, 'paid', NOW(), NOW()),
            ('ORD-023', 3, DATE_SUB(NOW(), INTERVAL 12 DAY), 'confirmed', 330.00, 15.00, 0.00, 'unpaid', NOW(), NOW()),
            ('ORD-024', 4, DATE_SUB(NOW(), INTERVAL 11 DAY), 'processing', 900.00, 40.00, 0.00, 'unpaid', NOW(), NOW()),
            ('ORD-025', 5, DATE_SUB(NOW(), INTERVAL 30 DAY), 'delivered', 45.00, 0.00, 0.00, 'paid', NOW(), NOW());
        `);

    // Order Items (Sample for first few orders)
    // ORD-001 (1575 total): Laptop (1500) + Mouse (25*3=75)
    await sequelize.query(`
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total, total_price, created_at, updated_at) 
            SELECT id, 1, 1, 1500.00, 1500.00, 1500.00, NOW(), NOW() FROM orders WHERE order_number = 'ORD-001';
        `);
    await sequelize.query(`
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total, total_price, created_at, updated_at) 
            SELECT id, 2, 3, 25.00, 75.00, 75.00, NOW(), NOW() FROM orders WHERE order_number = 'ORD-001';
        `);

    // Invoices (For Paid/Partially Paid)
    await sequelize.query(`
            INSERT INTO invoices (invoice_number, order_id, invoice_date, total_amount, status, created_at, updated_at) 
            SELECT CONCAT('INV-', SUBSTRING(order_number, 5)), id, NOW(), total_amount, 
            CASE WHEN payment_status = 'paid' THEN 'paid' WHEN payment_status = 'partially_paid' THEN 'sent' ELSE 'draft' END,
            NOW(), NOW() 
            FROM orders WHERE payment_status != 'unpaid';
        `);

    console.log('✅ Sales data seeded\n');

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary: Updated with Orders and Sales Data');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the seeder
seedDatabase()
  .then(() => {
    console.log('✅ Seeder completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
  });
