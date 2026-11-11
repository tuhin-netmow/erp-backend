/**
 * Migration: Update users table with complete authentication and staff fields
 * Consolidates authentication fields and extended staff information into users table
 * This migration replaces the need for separate staffs table by adding all staff fields to users
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add authentication fields if they don't exist
        const authColumns = [
            {
                name: 'password',
                attributes: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                    comment: 'Hashed password for authentication. Null if user has no login access.'
                }
            },
            {
                name: 'role_id',
                attributes: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    comment: 'Role ID for permissions. Null if user has no login access.',
                    references: {
                        model: 'roles',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL'
                }
            }
        ];

        // Add staff/employee fields if they don't exist
        const staffColumns = [
            {
                name: 'first_name',
                attributes: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                    comment: 'Employee first name'
                }
            },
            {
                name: 'last_name',
                attributes: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                    comment: 'Employee last name'
                }
            },
            {
                name: 'phone',
                attributes: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                    comment: 'Contact phone number'
                }
            },
            {
                name: 'thumb_url',
                attributes: {
                    type: Sequelize.STRING(500),
                    allowNull: true,
                    comment: 'Profile thumbnail image URL'
                }
            },
            {
                name: 'position',
                attributes: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                    comment: 'Job position title'
                }
            },
            {
                name: 'department_id',
                attributes: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    comment: 'Department ID',
                    references: {
                        model: 'departments',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL'
                }
            },
            {
                name: 'hire_date',
                attributes: {
                    type: Sequelize.DATEONLY,
                    allowNull: true,
                    comment: 'Employee hire date'
                }
            },
            {
                name: 'salary',
                attributes: {
                    type: Sequelize.DECIMAL(10, 2),
                    allowNull: true,
                    comment: 'Employee salary'
                }
            },
            {
                name: 'address',
                attributes: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    comment: 'Residential address'
                }
            },
            {
                name: 'city',
                attributes: {
                    type: Sequelize.STRING(100),
                    allowNull: true
                }
            },
            {
                name: 'state',
                attributes: {
                    type: Sequelize.STRING(100),
                    allowNull: true
                }
            },
            {
                name: 'country',
                attributes: {
                    type: Sequelize.STRING(100),
                    allowNull: true
                }
            },
            {
                name: 'postal_code',
                attributes: {
                    type: Sequelize.STRING(20),
                    allowNull: true
                }
            },
            {
                name: 'status',
                attributes: {
                    type: Sequelize.ENUM('active', 'inactive', 'terminated', 'on_leave'),
                    defaultValue: 'active',
                    comment: 'Employee status'
                }
            },
            {
                name: 'notes',
                attributes: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                    comment: 'Additional notes about employee'
                }
            },
            {
                name: 'gallery_items',
                attributes: {
                    type: Sequelize.JSON,
                    allowNull: true,
                    defaultValue: null,
                    comment: 'Image gallery items for employee documents'
                }
            }
        ];

        // Combine all columns
        const allColumns = [...authColumns, ...staffColumns];

        // Add each column if it doesn't exist
        for (const column of allColumns) {
            try {
                await queryInterface.addColumn('users', column.name, column.attributes);
                console.log(`✅ Added column: ${column.name}`);
            } catch (error) {
                if (error.message.includes('Duplicate column name')) {
                    console.log(`⏭️  Column ${column.name} already exists, skipping...`);
                } else {
                    throw error;
                }
            }
        }

        // Add indexes for better query performance
        const indexesToAdd = [
            { columns: ['role_id'] },
            { columns: ['department_id'] },
            { columns: ['status'] },
            { columns: ['email'], options: { unique: true } }
        ];

        for (const index of indexesToAdd) {
            try {
                await queryInterface.addIndex('users', index.columns, index.options || {});
                console.log(`✅ Added index for: ${index.columns.join(', ')}`);
            } catch (error) {
                console.log(`⏭️  Index for ${index.columns.join(', ')} already exists`);
            }
        }

        // Make email unique if it's not already
        try {
            await queryInterface.changeColumn('users', 'email', {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true
            });
            console.log('✅ Ensured email is unique');
        } catch (error) {
            console.log('⏭️  Email already unique or error:', error.message);
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Remove columns (reverse order)
        const columnsToRemove = [
            'gallery_items',
            'notes',
            'status',
            'postal_code',
            'country',
            'state',
            'city',
            'address',
            'salary',
            'hire_date',
            'department_id',
            'position',
            'thumb_url',
            'phone',
            'last_name',
            'first_name',
            'role_id',
            'password'
        ];

        for (const columnName of columnsToRemove) {
            try {
                await queryInterface.removeColumn('users', columnName);
                console.log(`✅ Removed column: ${columnName}`);
            } catch (error) {
                console.log(`⚠️  Could not remove column ${columnName}:`, error.message);
            }
        }
    }
};