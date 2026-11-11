'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const tableInfo = await queryInterface.describeTable('invoices');

        if (!tableInfo.e_invoice_uuid) {
            await queryInterface.addColumn('invoices', 'e_invoice_uuid', {
                type: Sequelize.STRING(255),
                allowNull: true,
            });
        }

        if (!tableInfo.e_invoice_status) {
            // ENUM types can be tricky in migrations if the enum type doesn't exist yet or needs updating
            // For safety in this environment, using STRING or checking existence is better, but let's try adding the column.
            await queryInterface.addColumn('invoices', 'e_invoice_status', {
                type: Sequelize.STRING(50), // storing as string for flexibility: 'PENDING', 'GENERATED', 'submitted', 'valid', 'error'
                allowNull: true,
                defaultValue: 'PENDING'
            });
        }

        if (!tableInfo.e_invoice_qr_url) {
            await queryInterface.addColumn('invoices', 'e_invoice_qr_url', {
                type: Sequelize.TEXT,
                allowNull: true,
            });
        }

        if (!tableInfo.e_invoice_long_id) {
            await queryInterface.addColumn('invoices', 'e_invoice_long_id', {
                type: Sequelize.STRING(255),
                allowNull: true,
            });
        }

        if (!tableInfo.submission_date) {
            await queryInterface.addColumn('invoices', 'submission_date', {
                type: Sequelize.DATE,
                allowNull: true
            });
        }
    },

    down: async (queryInterface, Sequelize) => {
        const tableInfo = await queryInterface.describeTable('invoices');

        if (tableInfo.e_invoice_uuid) await queryInterface.removeColumn('invoices', 'e_invoice_uuid');
        if (tableInfo.e_invoice_status) await queryInterface.removeColumn('invoices', 'e_invoice_status');
        if (tableInfo.e_invoice_qr_url) await queryInterface.removeColumn('invoices', 'e_invoice_qr_url');
        if (tableInfo.e_invoice_long_id) await queryInterface.removeColumn('invoices', 'e_invoice_long_id');
        if (tableInfo.submission_date) await queryInterface.removeColumn('invoices', 'submission_date');
    }
};
