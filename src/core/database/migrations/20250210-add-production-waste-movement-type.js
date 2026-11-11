'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // MySQL doesn't support ALTER ENUM directly, need to recreate the column
    await queryInterface.changeColumn('stock_movements', 'movement_type', {
      type: Sequelize.ENUM('purchase', 'sale', 'adjustment', 'return', 'transfer', 'production', 'waste'),
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert to original ENUM values
    await queryInterface.changeColumn('stock_movements', 'movement_type', {
      type: Sequelize.ENUM('purchase', 'sale', 'adjustment', 'return', 'transfer'),
      allowNull: false
    });
  }
};
