const service = require('./role.service');
const { success, successWithPagination } = require('../../core/utils/response');

exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || parseInt(req.body.page) || 1;
    const limit = parseInt(req.query.limit) || parseInt(req.body.limit) || 10;
    const { rows, total } = await service.list(page, limit);
    return successWithPagination(res, 'Roles retrieved successfully', rows, {
      total,
      page,
      limit
    });
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const row = await service.get(req.params.id);
    return success(res, 'Role retrieved successfully', row);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const row = await service.create(req.body, req.user.id);
    return success(res, 'Role created successfully', row, 201);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const row = await service.update(req.params.id, req.body);
    return success(res, 'Role updated successfully', row);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    return success(res, 'Role deleted successfully', null);
  } catch (err) { next(err); }
};
