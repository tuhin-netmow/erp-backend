// Migration script to add map columns to sales_routes table
require('dotenv').config();
const { sequelize } = require('../src/core/database/sequelize');

async function runMigration() {
    try {
        console.log('Running migration: Add map columns to sales_routes table...');

        // Add zoom_level column
        await sequelize.query(`
            ALTER TABLE sales_routes 
            ADD COLUMN zoom_level INT NULL
            COMMENT 'Map zoom level';
        `).catch(err => {
            if (!err.message.includes('Duplicate column name')) throw err;
            console.log('  - zoom_level already exists, skipping');
        });

        // Add country column
        await sequelize.query(`
            ALTER TABLE sales_routes 
            ADD COLUMN country VARCHAR(100) NULL
            COMMENT 'Country name';
        `).catch(err => {
            if (!err.message.includes('Duplicate column name')) throw err;
            console.log('  - country already exists, skipping');
        });

        // Add state column
        await sequelize.query(`
            ALTER TABLE sales_routes 
            ADD COLUMN state VARCHAR(100) NULL
            COMMENT 'State or Province';
        `).catch(err => {
            if (!err.message.includes('Duplicate column name')) throw err;
            console.log('  - state already exists, skipping');
        });

        // Add city column
        await sequelize.query(`
            ALTER TABLE sales_routes 
            ADD COLUMN city VARCHAR(100) NULL
            COMMENT 'City';
        `).catch(err => {
            if (!err.message.includes('Duplicate column name')) throw err;
            console.log('  - city already exists, skipping');
        });

        // Add postal_code column
        await sequelize.query(`
            ALTER TABLE sales_routes 
            ADD COLUMN postal_code VARCHAR(20) NULL
            COMMENT 'Postal Code';
        `).catch(err => {
            if (!err.message.includes('Duplicate column name')) throw err;
            console.log('  - postal_code already exists, skipping');
        });

        // Add center_lat column
        await sequelize.query(`
            ALTER TABLE sales_routes 
            ADD COLUMN center_lat FLOAT NULL
            COMMENT 'Map center latitude';
        `).catch(err => {
            if (!err.message.includes('Duplicate column name')) throw err;
            console.log('  - center_lat already exists, skipping');
        });

        // Add center_lng column
        await sequelize.query(`
            ALTER TABLE sales_routes 
            ADD COLUMN center_lng FLOAT NULL
            COMMENT 'Map center longitude';
        `).catch(err => {
            if (!err.message.includes('Duplicate column name')) throw err;
            console.log('  - center_lng already exists, skipping');
        });

        // Add coverage_radius column
        await sequelize.query(`
            ALTER TABLE sales_routes 
            ADD COLUMN coverage_radius FLOAT NULL
            COMMENT 'Coverage radius in km/miles';
        `).catch(err => {
            if (!err.message.includes('Duplicate column name')) throw err;
            console.log('  - coverage_radius already exists, skipping');
        });

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
