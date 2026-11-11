const CheckInRepository = require('./checkin.repository');

class CheckInService {
    async getAllCheckIns(filters = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await CheckInRepository.findAll(filters, limit, offset);
        return {
            data: result.rows,
            total: result.count
        };
    }

    async getCheckInById(id) {
        const checkIn = await CheckInRepository.findById(id);
        if (!checkIn) {
            throw new Error('Check-in record not found');
        }
        return checkIn;
    }

    async createCheckIn(data) {
        return await CheckInRepository.create(data);
    }

    async updateCheckIn(id, data) {
        const checkIn = await CheckInRepository.update(id, data);
        if (!checkIn) {
            throw new Error('Check-in record not found');
        }
        return checkIn;
    }

    async deleteCheckIn(id) {
        const checkIn = await CheckInRepository.delete(id);
        if (!checkIn) {
            throw new Error('Check-in record not found');
        }
        return checkIn;
    }

    async getCustomersWithCheckIns(date, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const result = await CheckInRepository.findCustomersWithCheckIns(date, limit, offset);
        return {
            data: result.rows,
            total: result.count
        };
    }
}

module.exports = new CheckInService();
