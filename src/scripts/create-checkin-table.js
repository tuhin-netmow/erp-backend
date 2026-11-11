const { sequelize } = require('../core/database/sequelize');
const { StaffCheckIn } = require('../modules/attendance/checkin.model');

async function createCheckInTable() {
    try {
        console.log('Creating staff_checkins table...');

        await StaffCheckIn.sync({ alter: true });

        console.log('✅ staff_checkins table created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to create staff_checkins table:', error);
        process.exit(1);
    }
}

createCheckInTable();
