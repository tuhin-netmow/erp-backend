/**
 * Migration: Add sales_route_id to customers table
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('customers', 'sales_route_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'sales_routes',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });

        await queryInterface.addIndex('customers', ['sales_route_id']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('customers', 'sales_route_id');
    }
};
