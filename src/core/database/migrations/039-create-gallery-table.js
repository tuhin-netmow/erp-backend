/**
 * Migration: Create Gallery Table
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('gallery', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            filename: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            originalname: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            mimetype: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            size: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            url: {
                type: Sequelize.STRING(500),
                allowNull: false
            },
            path: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            caption: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            alt_text: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            uploaded_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });

        await queryInterface.addIndex('gallery', ['filename']);
        await queryInterface.addIndex('gallery', ['uploaded_by']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('gallery');
    }
};
