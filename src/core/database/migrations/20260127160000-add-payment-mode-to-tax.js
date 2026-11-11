'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('tax_submissions', 'payment_mode', {
            type: Sequelize.ENUM('CASH', 'BANK'),
            allowNull: false,
            defaultValue: 'BANK'
        });
    },

    down: async (queryInterface) => {
        await queryInterface.removeColumn('tax_submissions', 'payment_mode');
    }
};
