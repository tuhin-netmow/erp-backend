const express = require('express');
const router = express.Router();
const databaseController = require('./database.controller');
const { verifyToken } = require('../../core/middleware/auth');

// Module name for routes-tree grouping
router.moduleName = 'System';

router.routesMeta = [
    {
        path: '/tables',
        method: 'GET',
        middlewares: [verifyToken], // Add admin check if needed
        handler: (req, res) => databaseController.getTables(req, res),
        description: 'Get list of all database tables',
        database: {
            tables: ['information_schema.tables'],
            mainTable: 'tables'
        }
    },
    {
        path: '/tables/:tableName',
        method: 'GET',
        middlewares: [verifyToken],
        handler: (req, res) => databaseController.getTableData(req, res),
        description: 'Get data from a specific table',
        database: {
            mainTable: 'dynamic'
        },
        queryParams: {
            page: 'Page number',
            limit: 'Items per page'
        }
    },
    {
        path: '/tables/:tableName',
        method: 'PUT',
        middlewares: [verifyToken],
        handler: (req, res) => databaseController.updateTableRow(req, res),
        description: 'Update a record in a specific table',
        database: {
            mainTable: 'dynamic'
        },
        bodyParams: {
            id: 'Record ID (required)',
            '...fields': 'Fields to update'
        }
    },
    {
        path: '/delete-all-data',
        method: 'GET',
        middlewares: [verifyToken],
        handler: (req, res) => databaseController.deleteAllData(req, res),
        description: 'Delete all data from all tables (Truncate)',
    },
    {
        path: '/reset-system',
        method: 'GET',
        middlewares: [], // Public for now as requested or for convenience
        handler: (req, res) => databaseController.seedFoundation(req, res),
        description: 'Delete all data and seed foundational accounts and superadmin',
    },
    {
        path: '/reset-keep-accounts',
        method: 'GET',
        middlewares: [], // Public for convenience
        handler: (req, res) => databaseController.resetKeepAccounts(req, res),
        description: 'Reset everything but keep chart of accounts only',
    },
    {
        path: '/download-db',
        method: 'GET',
        middlewares: [verifyToken],
        handler: (req, res) => databaseController.downloadDatabase(req, res),
        description: 'Download full database dump with download history tracking',
    }
];

// Register routes from metadata
router.routesMeta.forEach(r => {
    router[r.method.toLowerCase()](r.path, ...r.middlewares, r.handler);
});

module.exports = router;
