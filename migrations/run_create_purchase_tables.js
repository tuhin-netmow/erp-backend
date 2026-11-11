// Migration script to create new purchase-related tables
require('dotenv').config();
const { sequelize } = require('../src/core/database/sequelize');

async function runMigration() {
    try {
        console.log('Running migration: Create purchase invoices, payments, and receipts tables...');

        // Create purchase_invoices table
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS purchase_invoices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                invoice_number VARCHAR(50) NOT NULL UNIQUE,
                purchase_order_id INT NOT NULL,
                invoice_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                due_date DATE NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                status ENUM('draft', 'received', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
                created_by INT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('  ✓ purchase_invoices table created');

        // Create purchase_payments table
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS purchase_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                invoice_id INT NULL,
                purchase_order_id INT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                payment_method VARCHAR(50) NOT NULL,
                reference_number VARCHAR(100) NULL,
                status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
                created_by INT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
                FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('  ✓ purchase_payments table created');

        // Create purchase_receipts table
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS purchase_receipts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                receipt_number VARCHAR(50) NOT NULL UNIQUE,
                purchase_order_id INT NOT NULL,
                receipt_date DATE NULL,
                received_by VARCHAR(255) NULL,
                status ENUM('pending', 'partial', 'completed', 'rejected') DEFAULT 'pending',
                notes TEXT NULL,
                received_at DATETIME NULL,
                created_by INT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('  ✓ purchase_receipts table created');

        console.log('✅ Migration completed successfully!');
        console.log('New tables created:');
        console.log('  - purchase_invoices');
        console.log('  - purchase_payments');
        console.log('  - purchase_receipts');

        process.exit(0);
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('⚠️  Tables already exist. Skipping migration.');
            process.exit(0);
        } else {
            console.error('❌ Migration failed:', error.message);
            process.exit(1);
        }
    }
}

runMigration();
