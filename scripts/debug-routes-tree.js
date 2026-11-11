const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

// Mock helpers
const verifyToken = (req, res, next) => next();
const moduleCheck = (module) => (req, res, next) => next();

// Load Routes
const routes = require('../src/routes');

app.use('/api', routes);

// traverse like routesTree.js
const routesByModule = {};

function getRoutes(stack, parentPath = '', parentModule = '', parentHasAuth = false, parentRouter = null) {
    stack.forEach(layer => {
        if (layer.route && layer.route.path) {
            const fullPath = (parentPath + layer.route.path).replace(/\/+/g, '/');
            const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
            const moduleName = layer.handle?.moduleName || parentModule || fullPath.split('/')[1] || 'General';

            if (!routesByModule[moduleName]) routesByModule[moduleName] = [];

            // Try to find route metadata from parent router's routesMeta
            let routeMeta = null;
            if (parentRouter && parentRouter.routesMeta) {
                routeMeta = parentRouter.routesMeta.find(meta =>
                    meta.path === layer.route.path &&
                    meta.method.toUpperCase() === methods[0]
                );
            }

            routesByModule[moduleName].push({
                path: fullPath,
                methods,
                hasMeta: !!routeMeta,
                desc: routeMeta?.description
            });

        } else if (layer.name === 'router' && layer.handle.stack) {
            let newPath = '';
            if (layer.regexp) {
                newPath = layer.regexp.source
                    .replace(/^\^\\\//, '/')
                    .replace(/\\\//g, '/')
                    .replace(/\\/g, '')
                    .replace(/\?\(\?=/g, '')
                    .replace(/\|?\$\)/g, '')
                    .replace(/\$$/g, '')
                    .replace(/\^/g, '')
                    .replace(/\/+/g, '/');
            }
            const moduleName = layer.handle?.moduleName || parentModule || '';
            const routerHasAuth = layer.handle.stack.some(l => l.name === 'verifyToken');

            getRoutes(layer.handle.stack, (parentPath + newPath).replace(/\/+/g, '/'), moduleName, routerHasAuth || parentHasAuth, layer.handle);
        }
    });
}

console.log('--- Traversing Routes ---');
getRoutes(app._router.stack); // This expects app to be initialized with routes, but express apps lazily build stack? 
// No, app.use immediately adds to stack.

// Wait, app._router is only created after first init.
// app.use adds to app._router.stack if app._router exists, or lazy inits.
// We need to ensure it's initialized.
app._router = app._router || express.Router();
// Actually, `app.use` handles it. But let's check.

// Force route loading?
// The `routes` require already did `fs.readdirSync`.

// Recalculate from routes router?
// `routes` IS a router.
// So we can just traverse `routes.stack`.

console.log('--- Analyzing routes.js export ---');
const routesStack = routes.stack;
if (routesStack) {
    getRoutes(routesStack, '/api');
}

console.log('--- Results for Raw Materials ---');
if (routesByModule['Raw Materials']) {
    console.log(`Found ${routesByModule['Raw Materials'].length} routes.`);
    routesByModule['Raw Materials'].forEach(r => {
        console.log(`[${r.methods[0]}] ${r.path} | Meta found: ${r.hasMeta} | Desc: ${r.desc}`);
        if (!r.hasMeta) console.warn('⚠️ WARNING: Missing Metadata for', r.path);
    });
} else {
    console.error('❌ Raw Materials module NOT found in route tree!');
    console.log('Available Modules:', Object.keys(routesByModule));
}

console.log('\n--- Results for Production ---');
if (routesByModule['Production']) {
    console.log(`Found ${routesByModule['Production'].length} routes.`);
} else {
    console.error('❌ Production module NOT found!');
}
