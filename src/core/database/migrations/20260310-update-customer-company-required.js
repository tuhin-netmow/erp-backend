/**
 * Migration: Make company required and name optional for customers
 * This swaps the constraints to make company name mandatory and customer name optional
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Step 1: Update existing records that have empty/NULL company but have a name
        // Copy the name to company field for those records
        await queryInterface.sequelize.query(`
            UPDATE customers
            SET company = name
            WHERE (company IS NULL OR company = '')
            AND name IS NOT NULL
            AND name != ''
        `);

        // Step 2: For records that still have NULL company (no name either),
        // set a default company name
        await queryInterface.sequelize.query(`
            UPDATE customers
            SET company = 'Unknown Company'
            WHERE company IS NULL OR company = ''
        `);

        // Step 3: Make name nullable
        await queryInterface.changeColumn('customers', 'name', {
            type: Sequelize.STRING(255),
            allowNull: true
        });

        // Step 4: Make company NOT NULL
        await queryInterface.changeColumn('customers', 'company', {
            type: Sequelize.STRING(255),
            allowNull: false
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Revert: Make name NOT NULL and company nullable
        // First, update any NULL names to use company as fallback
        await queryInterface.sequelize.query(`
            UPDATE customers
            SET name = company
            WHERE name IS NULL OR name = ''
        `);

        // Then change the constraints
        await queryInterface.changeColumn('customers', 'name', {
            type: Sequelize.STRING(255),
            allowNull: false
        });

        await queryInterface.changeColumn('customers', 'company', {
            type: Sequelize.STRING(255),
            allowNull: true
        });
    }
};
