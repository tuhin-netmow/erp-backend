const SettingsService = require('./settings.service');
const { success, error, successWithPagination } = require('../../core/utils/response');

class SettingsController {
  constructor(settingsService) {
    this.settingsService = settingsService || SettingsService;
  }

  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await this.settingsService.getAll(page, limit);
      return successWithPagination(res, 'Settings retrieved successfully', result.data, {
        total: result.total,
        page,
        limit
      });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  async getById(req, res) {
    try {
      const setting = await this.settingsService.getById(req.params.id);
      return success(res, 'Setting retrieved successfully', setting);
    } catch (err) {
      return error(res, err.message, 404);
    }
  }

  async create(req, res) {
    try {
      const setting = await this.settingsService.create(req.body);
      return success(res, 'Setting created successfully', setting, 201);
    } catch (err) {
      return error(res, err.message, 400);
    }
  }

  async update(req, res) {
    try {
      const setting = await this.settingsService.update(req.params.id, req.body);
      return success(res, 'Setting updated successfully', setting);
    } catch (err) {
      return error(res, err.message, 400);
    }
  }

  async delete(req, res) {
    try {
      await this.settingsService.delete(req.params.id);
      return success(res, 'Setting deleted successfully', null);
    } catch (err) {
      return error(res, err.message, 404);
    }
  }

  async getCompanyProfile(req, res) {
    try {
      const profile = await this.settingsService.getCompanyProfile();
      return success(res, 'Company profile retrieved successfully', profile);
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  async updateCompanyProfile(req, res) {
    try {
      const profile = await this.settingsService.updateCompanyProfile(req.body);
      return success(res, 'Company profile updated successfully', profile);
    } catch (err) {
      return error(res, err.message, 400);
    }
  }

  async getLayoutSettings(req, res) {
    try {
      const settings = await this.settingsService.getLayoutSettings();
      return success(res, 'Settings retrieved successfully', settings);
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  async updateLayoutSettings(req, res) {
    try {
      const settings = await this.settingsService.updateLayoutSettings(req.body);
      return success(res, 'Settings updated successfully', settings);
    } catch (err) {
      return error(res, err.message, 400);
    }
  }
  async getEInvoiceSettings(req, res) {
    try {
      const settings = await this.settingsService.getEInvoiceSettings();
      return success(res, 'E-Invoice settings retrieved successfully', settings);
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  async updateEInvoiceSettings(req, res) {
    try {
      const settings = await this.settingsService.updateEInvoiceSettings(req.body);
      return success(res, 'E-Invoice settings updated successfully', settings);
    } catch (err) {
      return error(res, err.message, 400);
    }
  }

  async getGoogleMapsSettings(req, res) {
    try {
      const settings = await this.settingsService.getGoogleMapsSettings();
      return success(res, 'Google Maps settings retrieved successfully', settings);
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  async updateGoogleMapsSettings(req, res) {
    try {
      const settings = await this.settingsService.updateGoogleMapsSettings(req.body);
      return success(res, 'Google Maps settings updated successfully', settings);
    } catch (err) {
      return error(res, err.message, 400);
    }
  }

  async getNumberingSequences(req, res) {
    try {
      const settings = await this.settingsService.getNumberingSequences();
      return success(res, 'Numbering sequences retrieved successfully', settings);
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  async updateNumberingSequences(req, res) {
    try {
      const settings = await this.settingsService.updateNumberingSequences(req.body);
      return success(res, 'Numbering sequences updated successfully', settings);
    } catch (err) {
      return error(res, err.message, 400);
    }
  }
}

module.exports = SettingsController;
