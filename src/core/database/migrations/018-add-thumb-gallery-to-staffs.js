/**
 * Migration: Add thumb_url and gallery_items to staffs table
 * Adds image fields for staff profile pictures and gallery
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('staffs', 'thumb_url', {
            type: Sequelize.STRING(500),
            allowNull: true,
            after: 'notes'
        });

        await queryInterface.addColumn('staffs', 'gallery_items', {
            type: Sequelize.JSON,
            allowNull: true,
            defaultValue: null,
            after: 'thumb_url'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('staffs', 'gallery_items');
        await queryInterface.removeColumn('staffs', 'thumb_url');
    }
};
