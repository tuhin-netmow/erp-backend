const UserService = require('./user.service');
const { success, error, successWithPagination } = require('../../core/utils/response');

class UserController {
  async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        role_id: req.query.role_id,
        department_id: req.query.department_id,
        status: req.query.status,
        search: req.query.search
      };

      const result = await UserService.getAllUsers(filters, page, limit);
      return successWithPagination(res, 'Users retrieved successfully', result.data, {
        total: result.total,
        page,
        limit
      });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  async getUserById(req, res) {
    try {
      const user = await UserService.getUserById(req.params.id);
      return success(res, 'User retrieved successfully', user);
    } catch (err) {
      return error(res, err.message, 404);
    }
  }

  async createUser(req, res) {
    try {
      const user = await UserService.createUser(req.body, req.user?.id);
      return success(res, 'User created successfully', user, 201);
    } catch (err) {
      return error(res, err.message, 400);
    }
  }

  async updateUser(req, res) {
    try {
      const user = await UserService.updateUser(req.params.id, req.body);
      return success(res, 'User updated successfully', user);
    } catch (err) {
      return error(res, err.message, 400);
    }
  }

  async deleteUser(req, res) {
    try {
      await UserService.deleteUser(req.params.id);
      return success(res, 'User deleted successfully', null);
    } catch (err) {
      return error(res, err.message, 404);
    }
  }
}

module.exports = new UserController();
