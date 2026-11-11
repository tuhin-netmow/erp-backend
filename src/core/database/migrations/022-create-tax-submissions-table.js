'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('tax_submissions', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            tax_type: {
                type: Sequelize.STRING(50),
                allowNull: false
            },
            period_start: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            period_end: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            amount: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false
            },
            submission_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            reference_number: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            attachment_url: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('PENDING', 'SUBMITTED', 'PAID'),
                allowNull: false,
                defaultValue: 'SUBMITTED'
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('tax_submissions');
    }
};
