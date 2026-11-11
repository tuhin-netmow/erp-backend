const { BOM, BOMItem, ProductionRun } = require('./production.models');
const { Op } = require('sequelize');
const { sequelize } = require('../../core/database/sequelize');

class ProductionRepository {
    // --- BOMs ---
    async findOneBOMByProductId(productId) {
        return await BOM.findOne({ where: { product_id: productId } });
    }

    async findAllBOMs(filters = {}, limit = 10, offset = 0) {
        const where = {};
        if (filters.product_id) where.product_id = filters.product_id;
        if (filters.search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        return await BOM.findAndCountAll({
            where,
            limit,
            offset,
            include: [
                {
                    model: require('../products/products.model').Product,
                    as: 'product',
                    attributes: ['id', 'name', 'sku']
                }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    async findBOMById(id) {
        return await BOM.findByPk(id, {
            include: [
                {
                    model: require('../products/products.model').Product,
                    as: 'product',
                    attributes: ['id', 'name', 'sku']
                },
                {
                    model: BOMItem,
                    as: 'items',
                    include: [
                        {
                            model: require('../products/products.model').Product,
                            as: 'raw_material',
                            attributes: ['id', 'name', 'sku', 'cost', 'unit_id']
                        }
                    ]
                }
            ]
        });
    }

    async createBOM(data, items) {
        const transaction = await sequelize.transaction();
        try {
            const bom = await BOM.create(data, { transaction });
            if (items && items.length > 0) {
                const bomItems = items.map(item => ({ ...item, bom_id: bom.id }));
                await BOMItem.bulkCreate(bomItems, { transaction });
            }
            await transaction.commit();
            return await this.findBOMById(bom.id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async updateBOM(id, data, items) {
        const transaction = await sequelize.transaction();
        try {
            const bom = await BOM.findByPk(id);
            if (!bom) throw new Error('BOM not found');

            await bom.update(data, { transaction });

            if (items) {
                // simple replacement strategy for now: delete all items and re-add
                // In production, sync is better to preserve IDs
                await BOMItem.destroy({ where: { bom_id: id }, transaction });
                const bomItems = items.map(item => ({ ...item, bom_id: bom.id }));
                await BOMItem.bulkCreate(bomItems, { transaction });
            }

            await transaction.commit();
            return await this.findBOMById(id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async deleteBOM(id) {
        return await BOM.destroy({ where: { id } });
    }

    // --- Production Runs ---
    async findAllRuns(filters = {}, limit = 10, offset = 0) {
        const where = {};
        if (filters.status) where.status = filters.status;
        if (filters.search) {
            where[Op.or] = [
                { run_number: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        return await ProductionRun.findAndCountAll({
            where,
            limit,
            offset,
            include: [
                {
                    model: require('../products/products.model').Product,
                    as: 'product',
                    attributes: ['id', 'name', 'sku']
                },
                {
                    model: BOM,
                    as: 'bom',
                    attributes: ['id', 'name']
                }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    async findRunById(id) {
        return await ProductionRun.findByPk(id, {
            include: [
                {
                    model: require('../products/products.model').Product,
                    as: 'product',
                    attributes: ['id', 'name', 'sku']
                },
                {
                    model: BOM,
                    as: 'bom',
                    include: [
                        { model: BOMItem, as: 'items', include: [{ model: require('../products/products.model').Product, as: 'raw_material', attributes: ['id', 'name'] }] }
                    ]
                }
            ]
        });
    }

    async createRun(data) {
        return await ProductionRun.create(data);
    }

    async updateRun(id, data) {
        const run = await ProductionRun.findByPk(id);
        if (!run) return null;
        return await run.update(data);
    }

    async deleteRun(id) {
        const run = await ProductionRun.findByPk(id);
        if (!run) return null;
        return await run.destroy();
    }
}

module.exports = new ProductionRepository();
