const service = require('./role_dashboard.service');
const { success } = require('../../core/utils/response');

exports.create = async (req, res, next) => {
    try {
        const data = await service.create(req.body);
        success(res, 'Dashboard widget created successfully', data, 201);
    } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
    try {
        const data = await service.list();
        success(res, 'Dashboard widgets retrieved successfully', data);
    } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
    try {
        const data = await service.get(req.params.id);
        success(res, 'Dashboard widget retrieved successfully', data);
    } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
    try {
        const data = await service.update(req.params.id, req.body);
        success(res, 'Dashboard widget updated successfully', data);
    } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
    try {
        await service.remove(req.params.id);
        success(res, 'Dashboard widget deleted successfully', null);
    } catch (err) { next(err); }
};
