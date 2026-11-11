/**
 * Migration: Add sort_order to categories table
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('categories', 'sort_order', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
            after: 'is_active'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('categories', 'sort_order');
    }
};
