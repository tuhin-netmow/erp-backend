const express = require('express');
const router = express.Router();
const SettingsRepository = require('./settings.repository');
const SettingsService = require('./settings.service');
const SettingsController = require('./settings.controller');

// Proper dependency injection
const settingsRepository = new SettingsRepository();
const settingsService = new SettingsService(settingsRepository);
const settingsController = new SettingsController(settingsService);

// Public settings route - NO authentication required
// This is for public invoice preview to get company details
router.get('/info', (req, res) => {
  return settingsController.getCompanyProfile(req, res);
});

module.exports = router;
