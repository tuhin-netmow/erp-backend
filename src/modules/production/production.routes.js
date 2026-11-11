const express = require('express');
const router = express.Router();
const productionController = require('./production.controller');
const { verifyToken } = require('../../core/middleware/auth');
const { moduleCheck } = require('../../core/middleware/moduleCheck');

router.moduleName = 'Production';

// Check permissions - assuming 'production' module access is required
router.use(verifyToken);
// router.use(moduleCheck('production')); // Enable when module permissions are set up

router.routesMeta = [
    // --- Production Batches (Alias for Runs) ---
    {
        path: '/batches',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => productionController.getRuns(req, res),
        description: 'List production batches',
        database: {
            tables: ['production_runs', 'products', 'boms'],
            mainTable: 'production_runs',
            fields: {
                production_runs: ['id', 'run_number', 'product_id', 'bom_id', 'status', 'quantity', 'start_date', 'end_date', 'notes', 'created_by'],
                products: ['id', 'name', 'sku'],
                boms: ['id', 'name']
            },
            relationships: [
                'production_runs.product_id -> products.id (FK)',
                'production_runs.bom_id -> boms.id (FK)'
            ]
        },
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)',
            status: 'Filter by status (scheduled, in_progress, completed)',
            search: 'Search by run number'
        },
        sampleResponse: {
            success: true,
            message: 'Production batches retrieved successfully',
            pagination: { total: 10, page: 1, limit: 10 },
            data: [
                {
                    id: 1,
                    run_number: 'BATCH-1738400000000',
                    product_id: 15,
                    bom_id: 2,
                    quantity: 100,
                    status: 'in_progress',
                    start_date: '2026-02-01T00:00:00.000Z',
                    product: { id: 15, name: 'Widget X' }
                }
            ]
        }
    },
    {
        path: '/batches',
        method: 'POST',
        middlewares: [], // Add validation middleware
        handler: (req, res) => productionController.createRun(req, res),
        description: 'Initiate a new production batch',
        database: {
            requiredFields: ['product_id', 'quantity'],
            optionalFields: ['bom_id', 'start_date', 'notes']
        },
        sampleRequest: {
            product_id: 15,
            quantity: 50,
            start_date: '2026-02-01',
            notes: 'Urgent batch for client X'
        },
        sampleResponse: {
            success: true,
            message: 'Production batch created successfully',
            data: { id: 2, run_number: 'BATCH-1738401000000', status: 'scheduled' }
        }
    },
    {
        path: '/batches/:id',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => productionController.getRunById(req, res),
        description: 'Get production batch details',
        database: { mainTable: 'production_runs' }
    },
    {
        path: '/batches/:id',
        method: 'PUT',
        middlewares: [],
        handler: (req, res) => productionController.updateRun(req, res),
        description: 'Update batch status (Scheduled -> In Progress -> Completed)',
        sampleRequest: { status: 'in_progress', notes: 'Started production line 1' }
    },
    {
        path: '/batches/:id',
        method: 'DELETE',
        middlewares: [],
        handler: (req, res) => productionController.deleteRun(req, res),
        description: 'Cancel a production batch'
    },

    // --- Production Runs ---
    {
        path: '/runs',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => productionController.getRuns(req, res),
        description: 'List production runs',
        database: {
            tables: ['production_runs', 'products', 'boms'],
            mainTable: 'production_runs',
            fields: {
                production_runs: ['id', 'run_number', 'product_id', 'bom_id', 'status', 'quantity', 'start_date', 'end_date', 'notes', 'created_by'],
                products: ['id', 'name', 'sku'],
                boms: ['id', 'name']
            },
            relationships: [
                'production_runs.product_id -> products.id (FK)',
                'production_runs.bom_id -> boms.id (FK)'
            ]
        },
        queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10)',
            status: 'Filter by status (scheduled, in_progress, completed)',
            search: 'Search by run number'
        },
        sampleResponse: {
            success: true,
            message: 'Production runs retrieved successfully',
            pagination: { total: 10, page: 1, limit: 10 },
            data: [
                {
                    id: 1,
                    run_number: 'RUN-1738400000000',
                    product_id: 15,
                    bom_id: 2,
                    quantity: 100,
                    status: 'in_progress',
                    start_date: '2026-02-01T00:00:00.000Z',
                    product: { id: 15, name: 'Widget X' }
                }
            ]
        }
    },
    {
        path: '/runs',
        method: 'POST',
        middlewares: [], // Add validation middleware
        handler: (req, res) => productionController.createRun(req, res),
        description: 'Initiate a new production run',
        database: {
            requiredFields: ['product_id', 'quantity'],
            optionalFields: ['bom_id', 'start_date', 'notes']
        },
        sampleRequest: {
            product_id: 15,
            quantity: 50,
            start_date: '2026-02-01',
            notes: 'Urgent batch for client X'
        },
        sampleResponse: {
            success: true,
            message: 'Production run created successfully',
            data: { id: 2, run_number: 'RUN-1738401000000', status: 'scheduled' }
        }
    },
    {
        path: '/runs/:id',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => productionController.getRunById(req, res),
        description: 'Get production run details',
        database: { mainTable: 'production_runs' }
    },
    {
        path: '/runs/:id',
        method: 'PUT',
        middlewares: [],
        handler: (req, res) => productionController.updateRun(req, res),
        description: 'Update status (Scheduled -> In Progress -> Completed)',
        sampleRequest: { status: 'in_progress', notes: 'Started production line 1' }
    },
    {
        path: '/runs/:id',
        method: 'DELETE',
        middlewares: [],
        handler: (req, res) => productionController.deleteRun(req, res),
        description: 'Cancel a production run'
    },

    // --- Bill of Materials (BOM) ---
    {
        path: '/boms',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => productionController.getBOMs(req, res),
        description: 'List all BOMs',
        queryParams: {
            page: 'Page number',
            limit: 'Items per page',
            search: 'Product Name',
            product_id: 'Filter by finished good ID'
        },
        database: {
            tables: ['boms', 'bom_items', 'products'],
            mainTable: 'boms'
        }
    },
    {
        path: '/boms',
        method: 'POST',
        middlewares: [],
        handler: (req, res) => productionController.createBOM(req, res),
        description: 'Create a new BOM',
        database: { requiredFields: ['product_id', 'name', 'items'] },
        sampleRequest: {
            product_id: 15,
            name: 'BOM for Widget X v1',
            items: [
                { product_id: 10, quantity: 2.5, wastage_percent: 5 },
                { product_id: 11, quantity: 1, wastage_percent: 0 }
            ]
        },
        sampleResponse: {
            success: true,
            message: 'BOM created successfully',
            data: { id: 5, name: 'BOM for Widget X v1' }
        }
    },
    {
        path: '/boms/:id',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => productionController.getBOMById(req, res),
        description: 'Get BOM details (including ingredients)'
    },
    {
        path: '/boms/:id',
        method: 'PUT',
        middlewares: [],
        handler: (req, res) => productionController.updateBOM(req, res),
        description: 'Update a BOM',
        sampleRequest: { name: 'BOM for Widget X v2' }
    },
    {
        path: '/boms/:id',
        method: 'DELETE',
        middlewares: [],
        handler: (req, res) => productionController.deleteBOM(req, res),
        description: 'Delete a BOM'
    },

    // --- Finished Goods ---
    {
        path: '/finished-goods',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => productionController.getFinishedGoods(req, res),
        description: 'List finished goods inventory',
        queryParams: { page: 'Page number', limit: 'Items per page', search: 'Name/SKU' },
        database: { mainTable: 'products' }
    },
    {
        path: '/finished-goods',
        method: 'POST',
        middlewares: [],
        handler: (req, res) => productionController.createFinishedGood(req, res),
        description: 'Manually add finished goods (Product Type = finished_good)',
        sampleRequest: {
            name: 'Widget X',
            sku: 'FG-WIDGET-X',
            price: 150.00,
            cost: 85.00,
            stock_quantity: 0,
            unit_id: 1
        },
        sampleResponse: {
            success: true,
            message: 'Finished good created successfully',
            data: { id: 20, name: 'Widget X', product_type: 'finished_good' }
        }
    },
    {
        path: '/finished-goods/:id',
        method: 'GET',
        middlewares: [],
        handler: (req, res) => productionController.getFinishedGoodById(req, res),
        description: 'Get details of a finished good'
    },
    {
        path: '/finished-goods/:id',
        method: 'PUT',
        middlewares: [],
        handler: (req, res) => productionController.updateFinishedGood(req, res),
        description: 'Update finished good details'
    },
    {
        path: '/finished-goods/:id',
        method: 'DELETE',
        middlewares: [],
        handler: (req, res) => productionController.deleteFinishedGood(req, res),
        description: 'Remove a finished good record'
    }
];

router.routesMeta.forEach(r => {
    router[r.method.toLowerCase()](r.path, ...r.middlewares, r.handler);
});

module.exports = router;
