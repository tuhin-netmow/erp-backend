/**
 * Module Check Service
 * Handles checking if modules are active and accessible
 */

class ModuleCheckService {
    /**
     * Check if a module is active
     * @param {string} moduleKey - The key of the module to check
     * @returns {Promise<boolean>} - True if module is active, false otherwise
     */
    static async isModuleActive(moduleKey) {
        // For now, return true for all modules
        // In a full implementation, this would check against a modules table in the database
        // to see if the module is enabled/active

        const activeModules = [
            'auth',
            'users',
            'roles',
            'settings',
            'customers',
            'suppliers',
            'products',
            'sales',
            'purchase',
            'inventory',
            'hr',
            'accounting',
            'crm',
            'projects',
            'departments',
            'staffs',
            'attendance',

            'payroll',
            'reports'
        ];

        return activeModules.includes(moduleKey.toLowerCase());
    }

    /**
     * Get all active modules
     * @returns {Promise<Array<string>>} - Array of active module keys
     */
    static async getActiveModules() {
        return [
            'auth',
            'users',
            'roles',
            'settings',
            'customers',
            'suppliers',
            'products',
            'sales',
            'purchase',
            'inventory',
            'hr',
            'accounting',
            'crm',
            'projects',
            'departments',
            'staffs',
            'attendance',

            'payroll',
            'reports'
        ];
    }
}

module.exports = ModuleCheckService;
