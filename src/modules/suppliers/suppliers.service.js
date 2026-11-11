const SupplierRepository = require('./suppliers.repository');

class SupplierService {
    async getAllSuppliers(filters = {}, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            const result = await SupplierRepository.findAll(filters, limit, offset);
            return {
                data: result.rows,
                total: result.count
            };
        } catch (err) {
            throw new Error(`Failed to get suppliers: ${err.message}`);
        }
    }

    async getSupplierById(id) {
        const supplier = await SupplierRepository.findById(id);
        if (!supplier) {
            throw new Error('Supplier not found');
        }

        const supplierData = supplier.toJSON ? supplier.toJSON() : supplier;

        if (supplierData.latitude) {
            supplierData.latitude = parseFloat(supplierData.latitude);
        }
        if (supplierData.longitude) {
            supplierData.longitude = parseFloat(supplierData.longitude);
        }

        return supplierData;
    }

    async createSupplier(data, userId) {
        // Handle automatic code generation if not provided
        if (!data.code) {
            try {
                const { generateNumber } = require('../settings/numbering.helper');
                data.code = await generateNumber('supplier');
            } catch (err) {
                console.error('Error generating automatic supplier code:', err);
                // Fallback to timestamp if settings fetch fails
                data.code = `SUPP-${Date.now()}`;
            }
        }
        else {
            // Check if code already exists
            const existing = await SupplierRepository.findByCode(data.code);
            if (existing) {
                throw new Error('Supplier with this code already exists');
            }
        }

        // Check if email already exists (if provided)
        if (data.email) {
            const existing = await SupplierRepository.findByEmail(data.email);
            if (existing) {
                throw new Error('Supplier with this email already exists');
            }
        }

        return await SupplierRepository.create({ ...data, created_by: userId });
    }

    async updateSupplier(id, data) {
        // If code is being updated, check for duplicates
        if (data.code) {
            const existing = await SupplierRepository.findByCode(data.code);
            if (existing && existing.id !== parseInt(id)) {
                throw new Error('Supplier with this code already exists');
            }
        }

        // If email is being updated, check for duplicates
        if (data.email) {
            const existing = await SupplierRepository.findByEmail(data.email);
            if (existing && existing.id !== parseInt(id)) {
                throw new Error('Supplier with this email already exists');
            }
        }

        const supplier = await SupplierRepository.update(id, data);
        if (!supplier) {
            throw new Error('Supplier not found');
        }
        return supplier;
    }

    async deleteSupplier(id) {
        const supplier = await SupplierRepository.delete(id);
        if (!supplier) {
            throw new Error('Supplier not found');
        }
        return supplier;
    }

    async getSupplierStats() {
        const stats = await SupplierRepository.getStats();

        // Format to match customer request
        return [
            {
                label: "All Active Suppliers",
                value: stats.activeSuppliers,
                color: "bg-emerald-600"
            },
            {
                label: "Total Suppliers",
                value: stats.totalSuppliers,
                color: "bg-blue-600"
            },
            {
                label: "New Suppliers",
                value: stats.newSuppliers,
                color: "bg-violet-600"
            },
            {
                label: "Inactive Suppliers",
                value: stats.inactiveSuppliers,
                color: "bg-rose-600"
            },
            {
                label: "Total Purchase Amount",
                value: stats.totalPurchase,
                color: "bg-indigo-600",
                isCurrency: true
            },
            {
                label: "Total Paid",
                value: stats.totalPaid,
                color: "bg-emerald-600",
                isCurrency: true
            },
            {
                label: "Total Due",
                value: stats.totalDue,
                color: "bg-rose-600",
                isCurrency: true
            }
        ];
    }
}

module.exports = new SupplierService();
