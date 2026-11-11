const { sequelize } = require('../../core/database/sequelize');
const { success, error } = require('../../core/utils/response');
const AccountingService = require('../accounting/accounting.service');
const { User } = require('../users/user.model');
const { Role, RoleSettings } = require('../roles/role.model');
const bcrypt = require('bcrypt');

class DatabaseController {

  async getTables(req, res) {
    try {
      // Fetch all table names
      const tables = await sequelize.getQueryInterface().showAllTables();
      return success(res, 'Tables retrieved successfully', tables);
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  async getTableData(req, res) {
    try {
      const { tableName } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Basic validation to prevent SQL injection or viewing sensitive system tables if needed
      // Assuming validation is handled or admin-only access

      // Count total
      const countQuery = `SELECT COUNT(*) as total FROM \`${tableName}\``;
      const [countResult] = await sequelize.query(countQuery);
      const total = countResult[0].total;

      // Fetch columns to determine best sorting order dynamically
      const [columns] = await sequelize.query(`SHOW COLUMNS FROM \`${tableName}\``);
      const columnNames = columns.map(c => c.Field);
      
      let orderClause = '';
      if (columnNames.includes('created_at')) {
          orderClause = 'ORDER BY `created_at` DESC';
      } else if (columnNames.includes('id')) {
          orderClause = 'ORDER BY `id` DESC';
      }

      // Fetch paginated data
      const dataQuery = `SELECT * FROM \`${tableName}\` ${orderClause} LIMIT ${limit} OFFSET ${offset}`;
      const [data] = await sequelize.query(dataQuery);

      return success(res, 'Table data retrieved successfully', {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPage: Math.ceil(total / limit)
        }
      });

    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  async updateTableRow(req, res) {
    try {
      const { tableName } = req.params;
      const { id, ...updateData } = req.body;

      // Validate that ID is provided
      if (!id) {
        return error(res, 'ID is required to update a record', 400);
      }

      // Validate that there is data to update
      if (Object.keys(updateData).length === 0) {
        return error(res, 'No data provided for update', 400);
      }

      // Build SET clause dynamically
      const setClause = Object.keys(updateData)
        .map(key => `\`${key}\` = ?`)
        .join(', ');

      const values = Object.values(updateData);
      values.push(id); // Add ID for WHERE clause

      // Execute update query
      const updateQuery = `UPDATE \`${tableName}\` SET ${setClause} WHERE id = ?`;
      await sequelize.query(updateQuery, {
        replacements: values,
        type: sequelize.QueryTypes.UPDATE
      });

      // Fetch updated record
      const selectQuery = `SELECT * FROM \`${tableName}\` WHERE id = ?`;
      const [updatedRecord] = await sequelize.query(selectQuery, {
        replacements: [id],
        type: sequelize.QueryTypes.SELECT
      });

      return success(res, 'Record updated successfully', updatedRecord);

    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  async deleteAllData(req, res) {
    try {
      const tables = await sequelize.getQueryInterface().showAllTables();
      const skipTables = ['SequelizeMeta', 'migrations']; // Standard sequelize tables to skip

      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

      for (const table of tables) {
        if (!skipTables.includes(table)) {
          await sequelize.query(`TRUNCATE TABLE \`${table}\``);
        }
      }

      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

      // --- Seed Accounting Essentials ---
      await AccountingService.seedAccounts();

      // --- Seed Core Roles ---
      const [adminRole] = await Role.findOrCreate({
        where: { name: 'Admin' },
        defaults: {
          display_name: 'Administrator',
          description: 'Full system access',
          status: 'active',
          permissions: ['*']
        }
      });

      await RoleSettings.findOrCreate({
        where: { role_id: adminRole.id },
        defaults: {
          role_id: adminRole.id,
          menu: JSON.stringify([]),
          dashboard: JSON.stringify([]),
          custom: JSON.stringify({})
        }
      });

      const [superadminRole] = await Role.findOrCreate({
        where: { name: 'Superadmin' },
        defaults: {
          display_name: 'Super Administrator',
          description: 'Full system access',
          status: 'active',
          permissions: ['*']
        }
      });

      await RoleSettings.findOrCreate({
        where: { role_id: superadminRole.id },
        defaults: {
          role_id: superadminRole.id,
          menu: JSON.stringify([]),
          dashboard: JSON.stringify([]),
          custom: JSON.stringify({})
        }
      });

      // --- Seed Admin User ---
      const hashedPassword = await bcrypt.hash('password', 10);
      await User.findOrCreate({
        where: { email: 'admin@erp.com' },
        defaults: {
          name: 'Admin User',
          email: 'admin@erp.com',
          password: hashedPassword,
          role_id: adminRole.id,
          status: 'active'
        }
      });

      return success(res, 'All data deleted and accounting essentials seeded successfully');
    } catch (err) {
      // Ensure FK checks are re-enabled even on error
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      return error(res, err.message, 500);
    }
  }

  async seedFoundation(req, res) {
    try {
      const tables = await sequelize.getQueryInterface().showAllTables();

      // Define tables that should NOT be truncated during a system reset
      // These are "Essentials" and foundational data
      const keepTables = [
        'SequelizeMeta',
        'migrations',
        'accounts',        // Accounting Essentials
        'users',           // Staff/Users
        'roles',           // System Roles
        'role_settings',
        'role_menus',
        'role_dashboards',
        'settingss'        // System Settings
      ];

      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

      const truncatedTables = [];
      for (const table of tables) {
        if (!keepTables.includes(table)) {
          // Truncate table
          await sequelize.query(`TRUNCATE TABLE \`${table}\``);
          truncatedTables.push(table);
        }
      }

      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

      // 1. Ensure Accounting Essentials (seeds only if missing)
      await AccountingService.seedAccounts();

      // 2. Seed Superadmin Role if missing
      const [superRole] = await Role.findOrCreate({
        where: { name: 'Superadmin' },
        defaults: {
          display_name: 'Super Administrator',
          description: 'Full system access',
          status: 'active',
          permissions: ['*']
        }
      });

      // 3. Seed Role Settings if missing
      await RoleSettings.findOrCreate({
        where: { role_id: superRole.id },
        defaults: {
          role_id: superRole.id,
          menu: JSON.stringify(['all']),
          dashboard: JSON.stringify(['all']),
          custom: JSON.stringify({ theme: 'system' })
        }
      });

      // 4. Seed Super Admin User if missing
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.findOrCreate({
        where: { email: 'admin@gmail.com' },
        defaults: {
          name: 'Super Admin',
          email: 'admin@gmail.com',
          password: hashedPassword,
          role_id: superRole.id,
          status: 'active'
        }
      });

      return success(res, 'Database reset successfully. Foundational data preserved, transactional data cleared.', {
        total_tables: tables.length,
        truncated_count: truncatedTables.length,
        truncated_tables: truncatedTables
      });

    } catch (err) {
      // Ensure FK checks are re-enabled even on error
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      return error(res, err.message, 500);
    }
  }

  async resetKeepAccounts(req, res) {
    try {
      const tables = await sequelize.getQueryInterface().showAllTables();

      // Only keep chart of accounts and system tables
      const keepTables = [
        'SequelizeMeta',
        'migrations',
        'accounts',        // Chart of Accounts
        'users',           // Users
        'roles',           // Roles
        'role_settings',
        'role_menus',
        'role_dashboards',
        'settingss'
      ];

      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

      const truncatedTables = [];
      for (const table of tables) {
        if (!keepTables.includes(table)) {
          // Truncate table
          await sequelize.query(`TRUNCATE TABLE \`${table}\``);
          truncatedTables.push(table);
        }
      }

      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

      // Seed essential roles and admin user
      // 1. Seed Superadmin Role
      const [superRole] = await Role.findOrCreate({
        where: { name: 'Superadmin' },
        defaults: {
          display_name: 'Super Administrator',
          description: 'Full system access',
          status: 'active',
          permissions: ['*']
        }
      });

      // 2. Seed Admin Role
      const [adminRole] = await Role.findOrCreate({
        where: { name: 'Admin' },
        defaults: {
          display_name: 'Administrator',
          description: 'Full system access',
          status: 'active',
          permissions: ['*']
        }
      });

      // 3. Seed Role Settings for Superadmin
      await RoleSettings.findOrCreate({
        where: { role_id: superRole.id },
        defaults: {
          role_id: superRole.id,
          menu: JSON.stringify(['all']),
          dashboard: JSON.stringify(['all']),
          custom: JSON.stringify({ theme: 'system' })
        }
      });

      // 4. Seed Role Settings for Admin
      await RoleSettings.findOrCreate({
        where: { role_id: adminRole.id },
        defaults: {
          role_id: adminRole.id,
          menu: JSON.stringify([]),
          dashboard: JSON.stringify([]),
          custom: JSON.stringify({})
        }
      });

      // 5. Seed Super Admin User
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.findOrCreate({
        where: { email: 'admin@gmail.com' },
        defaults: {
          name: 'Super Admin',
          email: 'admin@gmail.com',
          password: hashedPassword,
          role_id: superRole.id,
          status: 'active'
        }
      });

      // Count remaining accounts
      const [accountCount] = await sequelize.query('SELECT COUNT(*) as count FROM `accounts`');
      const totalAccounts = accountCount[0].count;

      return success(res, 'Database reset successfully. Chart of Accounts preserved, all other data cleared.', {
        total_tables: tables.length,
        truncated_count: truncatedTables.length,
        truncated_tables: truncatedTables,
        accounts_preserved: totalAccounts
      });

    } catch (err) {
      // Ensure FK checks are re-enabled even on error
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      return error(res, err.message, 500);
    }
  }

  async downloadDatabase(req, res) {
    try {
      const tables = await sequelize.getQueryInterface().showAllTables();
      
      let sqlDump = `-- ERP Database Backup\n`;
      sqlDump += `-- Date: ${new Date().toISOString()}\n`;
      sqlDump += `-- Database: ${sequelize.config.database}\n\n`;
      sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

      const tableCounts = {};

      for (const table of tables) {
        sqlDump += `-- ------------------------------------------------------\n`;
        sqlDump += `-- Table structure for table \`${table}\`\n`;
        sqlDump += `-- ------------------------------------------------------\n`;
        sqlDump += `DROP TABLE IF EXISTS \`${table}\`;\n`;
        
        const [createTableResult] = await sequelize.query(`SHOW CREATE TABLE \`${table}\``);
        const createTableSql = createTableResult[0]['Create Table'] || createTableResult[0]['Create View'];
        sqlDump += `${createTableSql};\n\n`;

        const [rows] = await sequelize.query(`SELECT * FROM \`${table}\``);
        tableCounts[table] = rows.length;

        if (rows.length > 0) {
          sqlDump += `-- Dumping data for table \`${table}\`\n`;
          const columns = Object.keys(rows[0]).map(col => `\`${col}\``).join(', ');
          
          const batchSize = 100;
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const valuesString = batch.map(row => {
              const values = Object.values(row).map(val => {
                if (val === null || val === undefined) {
                  return 'NULL';
                }
                if (typeof val === 'object') {
                  return sequelize.escape(JSON.stringify(val));
                }
                if (typeof val === 'string') {
                  return sequelize.escape(val);
                }
                if (val instanceof Date) {
                  return sequelize.escape(val);
                }
                return val;
              }).join(', ');
              return `(${values})`;
            }).join(',\n');
            
            sqlDump += `INSERT INTO \`${table}\` (${columns}) VALUES \n${valuesString};\n`;
          }
          sqlDump += `\n`;
        }
      }

      sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;

      // Create record in deleted_histories to track the download
      const { DeletedHistory } = require('../sales/sales.models');
      await DeletedHistory.create({
        record_type: 'DatabaseBackup',
        record_id: 0,
        identifier: `Backup-${sequelize.config.database}-${new Date().toISOString().split('T')[0]}.sql`,
        data: {
          tablesList: tables,
          tableCounts,
          format: 'sql',
          sizeBytes: Buffer.byteLength(sqlDump, 'utf8')
        },
        deleted_by: req.user.id
      });

      return res.json({
        status: true,
        message: 'Database SQL backup generated successfully',
        database: sequelize.config.database,
        sql: sqlDump
      });

    } catch (err) {
      return error(res, err.message, 500);
    }
  }
}

module.exports = new DatabaseController();
