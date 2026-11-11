
module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Drop the unique constrain
        try {
            await queryInterface.removeIndex('attendances', ['staff_id', 'date']);
        } catch (e) {
            console.log('Index might not exist or already removed', e.message);
        }

        // Add total_hours column
        await queryInterface.addColumn('attendances', 'total_hours', {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 0
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Remove total_hours column
        await queryInterface.removeColumn('attendances', 'total_hours');

        // Re-add unique constraint
        await queryInterface.addIndex('attendances', ['staff_id', 'date'], { unique: true });
    }
};
