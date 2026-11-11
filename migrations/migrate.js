/**
 * Migration Runner
 * This script runs all pending migrations in the migrations folder
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: console.log
    }
);

async function runMigrations() {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Create migrations table if it doesn't exist
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Get all migration files
        const migrationsDir = path.join(__dirname, '../src/core/database/migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.js'))
            .sort();

        console.log(`Found ${files.length} migration files.`);

        // Get executed migrations
        const [executedMigrations] = await sequelize.query(
            'SELECT name FROM migrations'
        );
        const executedNames = executedMigrations.map(m => m.name);

        // Run pending migrations
        for (const file of files) {
            if (executedNames.includes(file)) {
                console.log(`⏭️  Skipping ${file} (already executed)`);
                continue;
            }

            console.log(`▶️  Running migration: ${file}`);
            const migration = require(path.join(migrationsDir, file));

            try {
                await migration.up(sequelize.getQueryInterface(), Sequelize);

                // Record migration
                await sequelize.query(
                    'INSERT INTO migrations (name) VALUES (?)',
                    { replacements: [file] }
                );

                console.log(`✅ Successfully executed: ${file}`);
            } catch (error) {
                if (error.message.includes('Duplicate key name') || error.message.includes('Duplicate column name') || error.message.includes('already exists')) {
                    console.log(`⚠️  Warning on ${file}: ${error.message}. Recording as executed and continuing...`);
                    await sequelize.query(
                        'INSERT INTO migrations (name) VALUES (?) ON DUPLICATE KEY UPDATE executed_at = CURRENT_TIMESTAMP',
                        { replacements: [file] }
                    );
                } else {
                    console.error(`❌ Error executing ${file}:`, error.message);
                    throw error;
                }
            }
        }

        console.log('✅ All migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

runMigrations();
