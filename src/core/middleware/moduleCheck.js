const { error } = require('../utils/response');
const ModuleCheckService = require('../../modules/common/moduleCheck.service');

/**
 * Middleware to check if a module is active and accessible
 * @param {string} moduleKey - The key of the module to check
 */
const moduleCheck = (moduleKey) => {
    return async (req, res, next) => {
        try {
            // Skip check for super admin if needed, but for now enforce module status
            const isActive = await ModuleCheckService.isModuleActive(moduleKey);

            if (!isActive) {
                return error(res, `Module '${moduleKey}' is not active or does not exist`, 403);
            }

            next();
        } catch (err) {
            return error(res, 'Error checking module status', 500);
        }
    };
};

module.exports = { moduleCheck };
