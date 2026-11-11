
module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Add index on staff_id so FK doesn't complain when we remove the composite one
        await queryInterface.addIndex('attendances', ['staff_id']);

        // 2. Remove the unique composite index
        try {
            // Check if index exists by trying to remove it
            // Note: The previous migration (018) might have failed to remove it silently
            // We need to be careful about the index name. Sequelize usually names it 'table_field_field'
            // or we specified fields array.
            await queryInterface.removeIndex('attendances', ['staff_id', 'date']);
        } catch (e) {
            console.error('Failed to remove index again:', e.message);
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Re-add unique constraint
        await queryInterface.addIndex('attendances', ['staff_id', 'date'], { unique: true });
        // Remove simple index
        await queryInterface.removeIndex('attendances', ['staff_id']);
    }
};
