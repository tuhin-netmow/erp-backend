const SettingsRepository = require('./settings.repository');
const SettingsService = require('./settings.service');
const SettingsController = require('./settings.controller');
const settingsRoutes = require('./settings.routes');

module.exports = {
  SettingsRepository,
  SettingsService,
  SettingsController,
  settingsRoutes,
};
