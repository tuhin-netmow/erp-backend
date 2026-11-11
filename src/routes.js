const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Public routes (no authentication required)
router.use('/public/sales', require('./modules/sales/sales.public.routes'));
router.use('/public/settings', require('./modules/settings/settings.public.routes'));

const modulesPath = path.join(__dirname, 'modules');
fs.readdirSync(modulesPath).forEach((moduleName) => {
  const moduleDir = path.join(modulesPath, moduleName);
  if (!fs.statSync(moduleDir).isDirectory()) return;
  const moduleFiles = fs.readdirSync(moduleDir);
  moduleFiles.forEach((fileOrFolder) => {
    const candidate = path.join(moduleDir, fileOrFolder);
    if (fs.statSync(candidate).isDirectory()) {
      const submoduleName = fileOrFolder;
      const routeFile = path.join(candidate, `${submoduleName}.routes.js`);
      if (fs.existsSync(routeFile)) {
        // mount at /<submoduleName>
        router.use(`/${submoduleName}`, require(routeFile));
      }
    } else {
      if (fileOrFolder.endsWith('.routes.js')) {
        const routePath = path.join(moduleDir, fileOrFolder);

        // Custom mapping for module names to route paths
        const moduleMappings = {
          'attendance': 'staff-attendance'
        };

        const mountPath = '/' + (moduleMappings[moduleName] || moduleName);
        router.use(mountPath, require(routePath));
      }
    }
  });
});

// Manually mount salesroutes
router.use('/salesroutes', require('./modules/sales/salesroutes.routes'));

module.exports = router;
