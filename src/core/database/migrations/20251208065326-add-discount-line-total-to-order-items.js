'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('order_items', 'discount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
      after: 'unit_price'
    });

    await queryInterface.addColumn('order_items', 'line_total', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      after: 'discount'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('order_items', 'discount');
    await queryInterface.removeColumn('order_items', 'line_total');
  }
};
