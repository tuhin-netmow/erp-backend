require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { sequelize } = require('./core/database/sequelize');
const routes = require('./routes'); // your main API routes
const routesTree = require('./routes/routesTree'); // new routes-tree
const salesController = require('./modules/sales/sales.controller');

// Load associations after models are defined
require('./core/database/associations');

const app = express();



// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://erp.cvics.org',
];



app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/uploads', express.static('public/uploads'));

// ---------------------------------------------------------------
// PUBLIC routes — no auth, registered BEFORE /api protected routes
// ---------------------------------------------------------------
app.get('/api/public/sales/invoices/:id/download',
  (req, res) => salesController.downloadInvoicePdfPublic(req, res)
);

app.use('/api', routes);


// Root endpoint
app.get('/', (req, res) => res.json({
  ok: true,
  message: 'ERP API (modular)',
  version: '1.0.4',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development'
}));

// --- DEBUG: View Environment Variables (REMOVE IN PRODUCTION) ---
app.get('/debug-env', (req, res) => {
  const envVars = {
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_SOCKET_PATH: process.env.DB_SOCKET_PATH, // Added for debugging socket issues
    DB_PASSWORD: process.env.DB_PASSWORD ? '****' : undefined, // Masked
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV
  };
  res.json(envVars);
});

// --- Public Route: Check Database Status ---
app.get('/check-db-status', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'success',
      message: 'Database connection is healthy.',
      config: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed.',
      reason: error.message,
      error_details: {
        name: error.name,
        code: error.code || error.parent?.code,
        errno: error.errno || error.parent?.errno,
        syscall: error.syscall || error.parent?.syscall,
        hostname: error.address || error.parent?.address,
        port: error.port || error.parent?.port,
        fatal: error.fatal || error.parent?.fatal,
        original: error.original ? error.original.message : undefined
      }
    });
  }
});
// ----------------------------------------------------------------

// --- Auto-Initialize Superadmin ---
app.use(async (req, res, next) => {
  try {
    // Only run this check occasionally or on specific paths if performance is a concern
    // For now, we'll do a quick check on start or lazily
    // Better yet, just run it once on server start (but app.js exports app, doesn't listen directly except in index.js)
    // Let's attach it to a specific request or just run it as a floating promise on valid requests?
    // Ideally, this should be in index.js, but user asked "when run server" and we are in app.js
    // We will add a self-invoking function here that runs once when the module is loaded?
    // No, `app.js` is imported by `index.js`.
    // Let's modify index.js or add a startup script.
    // User said: "ensure 1 superadmin user exist or create automatically"

    // We'll add a helper function and call it.
    const { Role, RoleSettings } = require('./modules/roles/role.model');
    const { User } = require('./modules/users/user.model');
    const bcrypt = require('bcrypt'); // Make sure bcrypt is available

    // Check/Create Role
    let superRole = await Role.findOne({ where: { name: 'Superadmin' } });
    if (!superRole) {
      superRole = await Role.create({
        name: 'Superadmin',
        display_name: 'Super Administrator',
        description: 'God mode access',
        status: 'active',
        permissions: ['*']
      });
      await RoleSettings.create({
        role_id: superRole.id,
        menu: JSON.stringify(['all']),
        dashboard: JSON.stringify(['all']),
        custom: JSON.stringify({ theme: 'system' })
      });
      console.log('✅ Auto-created Superadmin Role');
    }

    // Check/Create User
    const adminEmail = 'admin@gmail.com';
    let adminUser = await User.findOne({ where: { email: adminEmail } });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role_id: superRole.id
      });
      console.log('✅ Auto-created Superadmin User: admin@gmail.com / password123');
    }
  } catch (err) {
    console.error('⚠️ Auto-Init Superadmin Failed:', err.message);
  }
  next();
});

// Routes tree page
app.use('/routes-tree', routesTree);

// Architecture visualization page
app.get('/routes-architecture', (req, res) => {
  res.sendFile('architecture_view.html', { root: __dirname + '/..' });
});

// System graph visualization
app.get('/system-graph', (req, res) => {
  res.sendFile('system_graph.html', { root: __dirname + '/..' });
});

// Module documentation pages
app.get('/module-docs', (req, res) => {
  res.sendFile('module_docs/index.html', { root: __dirname + '/..' });
});

// Individual module documentation routes
app.get('/module-docs/auth', (req, res) => {
  res.sendFile('module_docs/auth_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/users', (req, res) => {
  res.sendFile('module_docs/users_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/roles', (req, res) => {
  res.sendFile('module_docs/roles_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/sales', (req, res) => {
  res.sendFile('module_docs/sales_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/purchase', (req, res) => {
  res.sendFile('module_docs/purchase_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/products', (req, res) => {
  res.sendFile('module_docs/products_module.html', { root: __dirname + '/..' });
});

// Product sub-module documentation routes
app.get('/module-docs/products-list', (req, res) => {
  res.sendFile('module_docs/products-list.html', { root: __dirname + '/..' });
});

app.get('/module-docs/products-staff', (req, res) => {
  res.sendFile('module_docs/products-staff.html', { root: __dirname + '/..' });
});

app.get('/module-docs/products-create', (req, res) => {
  res.sendFile('module_docs/products-create.html', { root: __dirname + '/..' });
});

app.get('/module-docs/products-categories', (req, res) => {
  res.sendFile('module_docs/products-categories.html', { root: __dirname + '/..' });
});

app.get('/module-docs/products-units', (req, res) => {
  res.sendFile('module_docs/products-units.html', { root: __dirname + '/..' });
});

app.get('/module-docs/products-stock', (req, res) => {
  res.sendFile('module_docs/products-stock.html', { root: __dirname + '/..' });
});

app.get('/module-docs/customers', (req, res) => {
  res.sendFile('module_docs/customers_module.html', { root: __dirname + '/..' });
});

// Customer sub-module documentation routes
app.get('/module-docs/customers-active', (req, res) => {
  res.sendFile('module_docs/customers-active.html', { root: __dirname + '/..' });
});

app.get('/module-docs/customers-inactive', (req, res) => {
  res.sendFile('module_docs/customers-inactive.html', { root: __dirname + '/..' });
});

app.get('/module-docs/customers-create', (req, res) => {
  res.sendFile('module_docs/customers-create.html', { root: __dirname + '/..' });
});

app.get('/module-docs/customers-staff', (req, res) => {
  res.sendFile('module_docs/customers-staff.html', { root: __dirname + '/..' });
});

app.get('/module-docs/customers-maps', (req, res) => {
  res.sendFile('module_docs/customers-maps.html', { root: __dirname + '/..' });
});

// Sales & Orders module documentation routes
app.get('/module-docs/sales-pos', (req, res) => {
  res.sendFile('module_docs/sales-pos.html', { root: __dirname + '/..' });
});

app.get('/module-docs/sales-orders', (req, res) => {
  res.sendFile('module_docs/sales-orders.html', { root: __dirname + '/..' });
});

app.get('/module-docs/sales-orders-create', (req, res) => {
  res.sendFile('module_docs/sales-orders-create.html', { root: __dirname + '/..' });
});

app.get('/module-docs/sales-orders-create-any', (req, res) => {
  res.sendFile('module_docs/sales-orders-create-any.html', { root: __dirname + '/..' });
});

app.get('/module-docs/sales-orders-pending', (req, res) => {
  res.sendFile('module_docs/sales-orders-pending.html', { root: __dirname + '/..' });
});

app.get('/module-docs/sales-orders-confirmed', (req, res) => {
  res.sendFile('module_docs/sales-orders-confirmed.html', { root: __dirname + '/..' });
});

app.get('/module-docs/sales-orders-intransit', (req, res) => {
  res.sendFile('module_docs/sales-orders-intransit.html', { root: __dirname + '/..' });
});

app.get('/module-docs/sales-orders-delivered', (req, res) => {
  res.sendFile('module_docs/sales-orders-delivered.html', { root: __dirname + '/..' });
});

app.get('/module-docs/sales-orders-edit', (req, res) => {
  res.sendFile('module_docs/sales-orders-edit.html', { root: __dirname + '/..' });
});

app.get('/module-docs/sales-return', (req, res) => {
  res.sendFile('module_docs/sales-return.html', { root: __dirname + '/..' });
});

app.get('/module-docs/sales-invoices', (req, res) => {
  res.sendFile('module_docs/sales-invoices.html', { root: __dirname + '/..' });
});

app.get('/module-docs/sales-einvoices', (req, res) => {
  res.sendFile('module_docs/sales-einvoices.html', { root: __dirname + '/..' });
});

app.get('/module-docs/sales-payments', (req, res) => {
  res.sendFile('module_docs/sales-payments.html', { root: __dirname + '/..' });
});

app.get('/module-docs/sales-delivery', (req, res) => {
  res.sendFile('module_docs/sales-delivery.html', { root: __dirname + '/..' });
});

app.get('/module-docs/suppliers', (req, res) => {
  res.sendFile('module_docs/suppliers_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/accounting', (req, res) => {
  res.sendFile('module_docs/accounting_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/staff', (req, res) => {
  res.sendFile('module_docs/staff_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/departments', (req, res) => {
  res.sendFile('module_docs/departments_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/attendance', (req, res) => {
  res.sendFile('module_docs/attendance_module.html', { root: __dirname + '/..' });
});



app.get('/module-docs/reports', (req, res) => {
  res.sendFile('module_docs/reports_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/settings', (req, res) => {
  res.sendFile('module_docs/settings_module.html', { root: __dirname + '/..' });
});

// Additional module documentation routes
app.get('/module-docs/sales-routes', (req, res) => {
  res.sendFile('module_docs/salesroutes_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/sales-return', (req, res) => {
  res.sendFile('module_docs/sales-return_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/purchase-return', (req, res) => {
  res.sendFile('module_docs/purchase-return_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/raw-materials', (req, res) => {
  res.sendFile('module_docs/raw-materials_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/production', (req, res) => {
  res.sendFile('module_docs/production_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/payroll', (req, res) => {
  res.sendFile('module_docs/payroll_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/checkin', (req, res) => {
  res.sendFile('module_docs/checkin_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/dashboard', (req, res) => {
  res.sendFile('module_docs/dashboard_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/upload', (req, res) => {
  res.sendFile('module_docs/upload_module.html', { root: __dirname + '/..' });
});

app.get('/module-docs/database', (req, res) => {
  res.sendFile('module_docs/database_module.html', { root: __dirname + '/..' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ status: false, message: err.message || 'Server error' });
});

module.exports = app;
