const express = require('express');
const router = express.Router();
const SettingsRepository = require('./settings.repository');
const SettingsService = require('./settings.service');
const SettingsController = require('./settings.controller');
const { verifyToken, checkPermission } = require('../../core/middleware/auth');
const { moduleCheck } = require('../../core/middleware/moduleCheck');
const { handlerWithFields } = require('../../core/utils/zodTypeView');
const validate = require('../../core/middleware/validate');
const {
    updateCompanyProfile,
    createBranch,
    updateBranch,
    updateNumberingSequences,
    updateCurrencySettings,
    updateEmailSettings,
    createTaxRate,
    updateTaxRate,
    createPaymentMethod,
    updatePaymentMethod,
    createShippingMethod,
    updateShippingMethod,
    updateSystemPreferences,
    updateUserPreferences,
    updateLayoutSettings,
} = require('./settings.validation');

// Instantiate controller
const settingsRepository = new SettingsRepository();
const settingsService = new SettingsService(settingsRepository);
const settingsController = new SettingsController(settingsService);

// Module name for routes-tree grouping
router.moduleName = 'Settings';

// Define routes metadata with comprehensive documentation
router.routesMeta = [
    {
        path: '/company/profile',
        method: 'GET',
        middlewares: [], // Public endpoint - no authentication required
        handler: (req, res) => settingsController.getCompanyProfile(req, res),
        description: 'Get company profile information (Public)',
        database: {
            tables: ['settings'],
            mainTable: 'settings',
            fields: {
                settings: ['id', 'name', 'description', 'status']
            },
            notes: "Stores JSON profile data in 'description' column where name='company_profile'"
        },
        sampleResponse: {
            status: true,
            message: 'Company profile retrieved successfully',
            data: {
                company_name: 'ABC Corporation',
                email: 'info@abccorp.com',
                phone: '+1234567890',
                address: '123 Business Street',
                city: 'New York',
                country: 'USA',
                tax_id: 'TAX123456',
                logo_url: '/uploads/logo.png',
                website: 'https://abccorp.com',
                description: 'A leading ERP solutions provider',
                currency: 'USD',
                qr_code: '/uploads/qr-code.png'
            }
        },
        examples: [
            {
                title: 'Get company profile',
                description: 'Retrieve the publicly available company profile',
                url: '/api/settings/company/profile',
                method: 'GET',
                response: {
                    status: true,
                    message: 'Company profile retrieved successfully',
                    data: {
                        company_name: 'ABC Corporation',
                        email: 'info@abccorp.com',
                        phone: '+1234567890',
                        address: '123 Business Street',
                        city: 'New York',
                        country: 'USA',
                        website: 'https://abccorp.com',
                        description: 'A leading ERP solutions provider',
                        currency: 'USD',
                        logo_url: '/uploads/logo.png',
                        qr_code: '/uploads/qr-code.png'
                    }
                }
            }
        ]
    },
    {
        path: '/company/profile',
        method: 'PUT',
        middlewares: [verifyToken, moduleCheck('settings'), validate(updateCompanyProfile)],
        handler: handlerWithFields((req, res) => settingsController.updateCompanyProfile(req, res), updateCompanyProfile),
        description: 'Update company profile information',
        database: {
            tables: ['settings'],
            mainTable: 'settings',
            requiredFields: ['company_name', 'email'],
            sideEffects: ['Updates "description" column in settings table with JSON string']
        },
        sampleRequest: {
            company_name: 'ABC Corporation Ltd',
            email: 'contact@abccorp.com',
            phone: '+1234567891',
            website: 'https://www.abccorp.com',
            description: 'Updated description',
            currency: 'EUR',
            logo_url: 'https://example.com/logo.png',
            qr_code: 'https://example.com/qr-code.png'
        },
        sampleResponse: {
            status: true,
            message: 'Company profile updated successfully',
            data: {
                id: 1,
                company_name: 'ABC Corporation Ltd',
                updated_at: '2025-12-02T10:00:00.000Z'
            }
        },
        examples: [
            {
                title: 'Update company profile',
                description: 'Update the company contact and details',
                url: '/api/settings/company/profile',
                method: 'PUT',
                request: {
                    company_name: 'ABC Corp Global',
                    email: 'contact@abc-global.com',
                    phone: '+1987654321',
                    address: '456 Global Ave',
                    city: 'London',
                    country: 'UK',
                    website: 'https://abc-global.com',
                    currency: 'GBP',
                    qr_code: 'https://abc-global.com/qr-code.png'
                },
                response: {
                    status: true,
                    message: 'Company profile updated successfully',
                    data: {
                        company_name: 'ABC Corp Global',
                        email: 'contact@abc-global.com',
                        phone: '+1987654321',
                        address: '456 Global Ave',
                        city: 'London',
                        country: 'UK',
                        website: 'https://abc-global.com',
                        currency: 'GBP',
                        qr_code: 'https://abc-global.com/qr-code.png',
                        updated_at: '2026-01-05T12:00:00.000Z'
                    }
                }
            }
        ]
    },
    {
        path: '/layout',
        method: 'GET',
        middlewares: [verifyToken, moduleCheck('settings')],
        handler: (req, res) => settingsController.getLayoutSettings(req, res),
        description: 'Get layout configuration',
        database: {
            tables: ['settings'],
            mainTable: 'settings',
            fields: { settings: ['id', 'name', 'description'] },
            notes: "Stores JSON layout data in 'description' column where name='layout_settings'"
        },
        sampleResponse: {
            status: true,
            message: 'Settings retrieved successfully',
            data: {
                pos: {
                    columns: { mobile: 2, sm: 3, md: 4, lg: 2, xl: 3, xxl: 4 },
                    gap: 4,
                    showImages: true,
                    cardStyle: "standard"
                }
            }
        }
    },
    {
        path: '/layout',
        method: 'POST',
        middlewares: [verifyToken, moduleCheck('settings'), validate(updateLayoutSettings)],
        handler: handlerWithFields((req, res) => settingsController.updateLayoutSettings(req, res), updateLayoutSettings),
        description: 'Update layout configuration',
        database: {
            tables: ['settings'],
            mainTable: 'settings',
            sideEffects: ['Updates "description" column where name="layout_settings"']
        },
        sampleRequest: {
            pos: {
                columns: { mobile: 2, sm: 3, md: 4, lg: 2, xl: 3, xxl: 4 },
                gap: 4,
                showImages: true,
                cardStyle: "standard"
            }
        },
        sampleResponse: {
            status: true,
            message: 'Settings updated successfully',
            data: {
                pos: {
                    columns: { mobile: 2, sm: 3, md: 4, lg: 2, xl: 3, xxl: 4 },
                    gap: 4,
                    showImages: true,
                    cardStyle: "standard"
                }
            }
        },
    },
    {
        path: '/einvoice',
        method: 'GET',
        middlewares: [verifyToken, moduleCheck('settings')],
        handler: (req, res) => settingsController.getEInvoiceSettings(req, res),
        description: 'Get E-Invoice configuration'
    },
    {
        path: '/einvoice',
        method: 'POST',
        middlewares: [verifyToken, moduleCheck('settings')],
        handler: (req, res) => settingsController.updateEInvoiceSettings(req, res),
        description: 'Update E-Invoice configuration'
    },
    {
        path: '/google-maps',
        method: 'GET',
        middlewares: [verifyToken, moduleCheck('settings')],
        handler: (req, res) => settingsController.getGoogleMapsSettings(req, res),
        description: 'Get Google Maps API configuration'
    },
    {
        path: '/google-maps',
        method: 'POST',
        middlewares: [verifyToken, moduleCheck('settings')],
        handler: (req, res) => settingsController.updateGoogleMapsSettings(req, res),
        description: 'Update Google Maps API configuration'
    },
    {
        path: '/numbering-sequences',
        method: 'GET',
        middlewares: [verifyToken, moduleCheck('settings')],
        handler: (req, res) => settingsController.getNumberingSequences(req, res),
        description: 'Get numbering sequences and prefixes configuration'
    },
    {
        path: '/numbering-sequences',
        method: 'POST',
        middlewares: [verifyToken, moduleCheck('settings')],
        handler: (req, res) => settingsController.updateNumberingSequences(req, res),
        description: 'Update numbering sequences and prefixes configuration'
    }
];

// Register routes from metadata
router.routesMeta.forEach(r => {
    router[r.method.toLowerCase()](r.path, ...r.middlewares, r.handler);
});

module.exports = router;
