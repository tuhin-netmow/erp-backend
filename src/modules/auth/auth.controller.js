const service = require('./auth.service');
const { success } = require('../../core/utils/response');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await service.login(email, password);
    return success(res, 'Login successful', result);
  } catch (err) { next(err); }
};

exports.register = async (req, res, next) => {
  try {
    const result = await service.register(req.body);
    return success(res, 'User registered successfully', result, 201);
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  try {
    const result = await service.getCurrentUser(req.user.id);
    return success(res, 'User retrieved successfully', result);
  } catch (err) { next(err); }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken, refresh_token } = req.body;
    const token = refreshToken || refresh_token;

    if (!token) {
      return res.status(400).json({
        status: false,
        message: 'Validation Error',
        errors: [{ path: ['refreshToken'], message: 'Refresh token is required' }]
      });
    }

    const result = await service.refreshToken(token);
    return success(res, 'Token refreshed successfully', result);
  } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
  try {
    await service.logout(req.user.id);
    return success(res, 'Logged out successfully');
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const result = await service.updateProfile(req.user.id, req.body);
    return success(res, 'Profile updated successfully', result);
  } catch (err) { next(err); }
};
