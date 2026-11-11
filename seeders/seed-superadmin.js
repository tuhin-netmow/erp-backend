/**
 * Seed Script for Superadmin Role
 * Ensures 'Superadmin' role exists.
 */

const { sequelize } = require('../src/core/database/sequelize');
const { Role, RoleSettings } = require('../src/modules/roles/role.model');

async function seedSuperadmin() {
    try {
        console.log('🌱 Checking for Superadmin role...');

        const existingRole = await Role.findOne({ where: { name: 'Superadmin' } });

        if (existingRole) {
            console.log('✅ Superadmin role already exists. Skipping...');
        } else {
            console.log('📦 Creating Superadmin role...');

            // Create the role
            const role = await Role.create({
                name: 'Superadmin',
                display_name: 'Super Administrator',
                description: 'Full system access with immutable permissions.',
                status: 'active',
                permissions: [] // or ['*'] if you implement wildcard permissions logic later
            });

            // Create default settings (empty menus for now, or full access if logic dictates)
            await RoleSettings.create({
                role_id: role.id,
                menu: JSON.stringify([]),
                dashboard: JSON.stringify([]),
                custom: JSON.stringify({})
            });

            console.log('✅ Superadmin role created successfully.');
        }

    } catch (error) {
        console.error('❌ Error seeding Superadmin:', error.message);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Run the seeder
seedSuperadmin()
    .then(() => {
        console.log('✅ Seeder completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Seeder failed:', error);
        process.exit(1);
    });
