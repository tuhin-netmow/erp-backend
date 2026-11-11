const SettingsRepository = require('./settings.repository');

class SettingsService {
  constructor(settingsRepository) {
    this.settingsRepository = settingsRepository || new SettingsRepository();
  }

  async getAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const result = await this.settingsRepository.findAll(limit, offset);
    return {
      data: result.rows,
      total: result.count
    };
  }

  async getById(id) {
    const setting = await this.settingsRepository.findById(id);
    if (!setting) {
      throw new Error('Setting not found');
    }
    return setting;
  }

  async create(data) {
    return await this.settingsRepository.create(data);
  }

  async update(id, data) {
    const setting = await this.settingsRepository.update(id, data);
    if (!setting) {
      throw new Error('Setting not found');
    }
    return setting;
  }

  async delete(id) {
    const setting = await this.settingsRepository.delete(id);
    if (!setting) {
      throw new Error('Setting not found');
    }
    return setting;
  }

  async getCompanyProfile() {
    const setting = await this.settingsRepository.findByName('company_profile');

    if (setting && setting.description) {
      try {
        return JSON.parse(setting.description);
      } catch (e) {
        console.error('Error parsing company profile:', e);
      }
    }

    // Default data if no profile exists
    return {
      company_name: 'ERP Company',
      email: 'info@erpcompany.com',
      phone: '+1234567890',
      address: '123 Business St',
      city: 'New York',
      country: 'USA',
      website: 'https://erpcompany.com',
      description: 'A leading ERP solutions provider',
      currency: 'USD',
      logo_url: null,
      qr_code: null
    };
  }

  async updateCompanyProfile(data) {
    const setting = await this.settingsRepository.findByName('company_profile');

    // Convert data to string for storage
    const description = JSON.stringify(data);

    if (setting) {
      // Update existing record
      await this.settingsRepository.update(setting.id, {
        name: 'company_profile',
        description: description,
        status: 'Active'
      });
    } else {
      // Create new record
      await this.settingsRepository.create({
        name: 'company_profile',
        description: description,
        status: 'Active'
      });
    }

    return { ...data, updated_at: new Date() };
  }

  async getLayoutSettings() {
    const setting = await this.settingsRepository.findByName('layout_settings');

    if (setting && setting.description) {
      try {
        return JSON.parse(setting.description);
      } catch (e) {
        console.error('Error parsing layout settings:', e);
      }
    }

    // Default data if no layout settings exist
    return {
      pos: {
        columns: {
          mobile: 2,
          sm: 3,
          md: 4,
          lg: 2,
          xl: 3,
          xxl: 4
        },
        gap: 4,
        showImages: true,
        cardStyle: 'standard'
      }
    };
  }

  async updateLayoutSettings(data) {
    const setting = await this.settingsRepository.findByName('layout_settings');

    // Convert data to string for storage
    const description = JSON.stringify(data);

    if (setting) {
      // Update existing record
      await this.settingsRepository.update(setting.id, {
        name: 'layout_settings',
        description: description,
        status: 'Active'
      });
    } else {
      // Create new record
      await this.settingsRepository.create({
        name: 'layout_settings',
        description: description,
        status: 'Active'
      });
    }

    return { ...data };
  }
  async getEInvoiceSettings() {
    const setting = await this.settingsRepository.findByName('einvoice_settings');

    if (setting && setting.description) {
      try {
        return JSON.parse(setting.description);
      } catch (e) {
        console.error('Error parsing einvoice settings:', e);
      }
    }

    // Default data
    return {
      environment: 'sandbox',
      client_id: '',
      client_secret: '',
      tin: '',
      msic_code: '', // Standard Industry classification
      contact_number: '',
      id_client_id: '', // Intermediary ID if needed
      id_client_secret: '', // Intermediary Secret
      certificate: '',
      certificate_password: ''
    };
  }

  async updateEInvoiceSettings(data) {
    const setting = await this.settingsRepository.findByName('einvoice_settings');

    // Convert data to string for storage
    const description = JSON.stringify(data);

    if (setting) {
      await this.settingsRepository.update(setting.id, {
        name: 'einvoice_settings',
        description: description,
        status: 'Active'
      });
    } else {
      await this.settingsRepository.create({
        name: 'einvoice_settings',
        description: description,
        status: 'Active'
      });
    }

    return { ...data };
  }

  async getGoogleMapsSettings() {
    const setting = await this.settingsRepository.findByName('google_maps_settings');

    if (setting && setting.description) {
      try {
        return JSON.parse(setting.description);
      } catch (e) {
        console.error('Error parsing google maps settings:', e);
      }
    }

    // Default data
    return {
      api_key: '',
      status: 'disabled'
    };
  }

  async updateGoogleMapsSettings(data) {
    const setting = await this.settingsRepository.findByName('google_maps_settings');

    // Convert data to string for storage
    const description = JSON.stringify(data);

    if (setting) {
      await this.settingsRepository.update(setting.id, {
        name: 'google_maps_settings',
        description: description,
        status: 'Active'
      });
    } else {
      await this.settingsRepository.create({
        name: 'google_maps_settings',
        description: description,
        status: 'Active'
      });
    }

    return { ...data };
  }

  async getNumberingSequences() {
    const setting = await this.settingsRepository.findByName('numbering_sequences');

    // Default data
    const defaults = {
      invoice_format: 'INV-{0000}',
      invoice_prefix: 'INV-',
      invoice_next_number: 1,
      invoice_padding_width: 4,
      order_format: 'ORD-{0000}',
      order_prefix: 'ORD-',
      order_next_number: 1,
      order_padding_width: 4,
      quotation_format: 'QT-{0000}',
      quotation_prefix: 'QT-',
      quotation_next_number: 1,
      quotation_padding_width: 4,
      customer_format: 'CUST-{0000}',
      customer_prefix: 'CUST-',
      customer_next_number: 1,
      customer_padding_width: 4,
      supplier_format: 'SUPP-{0000}',
      supplier_prefix: 'SUPP-',
      supplier_next_number: 1,
      supplier_padding_width: 4,
      product_format: 'PROD-{0000}',
      product_prefix: 'PROD-',
      product_next_number: 1,
      product_padding_width: 4,
      purchase_order_format: 'PO-{0000}',
      purchase_order_prefix: 'PO-',
      purchase_order_next_number: 1,
      purchase_order_padding_width: 4,
      purchase_invoice_format: 'PINV-{0000}',
      purchase_invoice_prefix: 'PINV-',
      purchase_invoice_next_number: 1,
      purchase_invoice_padding_width: 4,
    };

    if (setting && setting.description) {
      try {
        const stored = JSON.parse(setting.description);
        // Merge stored values over defaults to ensure new keys exist
        return { ...defaults, ...stored };
      } catch (e) {
        console.error('Error parsing numbering sequences:', e);
      }
    }

    return defaults;
  }

  async updateNumberingSequences(data) {
    const setting = await this.settingsRepository.findByName('numbering_sequences');

    // Convert data to string for storage
    const description = JSON.stringify(data);

    if (setting) {
      await this.settingsRepository.update(setting.id, {
        name: 'numbering_sequences',
        description: description,
        status: 'Active'
      });
    } else {
      await this.settingsRepository.create({
        name: 'numbering_sequences',
        description: description,
        status: 'Active'
      });
    }

    return { ...data };
  }
}

module.exports = SettingsService;
