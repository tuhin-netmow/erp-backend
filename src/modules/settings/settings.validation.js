const { z } = require('zod');

const settingsValidations = {
  // Company Profile
  updateCompanyProfile: z.object({
    company_name: z.string().max(255).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(50).optional(),
    address: z.string().optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    postal_code: z.string().max(20).optional(),
    tax_id: z.string().max(100).optional(),
    logo_url: z.string().optional(),
    description: z.string().optional(),
    currency: z.string().max(10).optional(),
    qr_code: z.string().optional(),
  }),

  // Branches
  createBranch: z.object({
    branch_name: z.string().min(1).max(255),
    branch_code: z.string().max(50).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(50).optional(),
    address: z.string().optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    is_active: z.boolean().default(true),
  }),

  updateBranch: z.object({
    branch_name: z.string().max(255).optional(),
    branch_code: z.string().max(50).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(50).optional(),
    address: z.string().optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    is_active: z.boolean().optional(),
  }),

  // Numbering Sequences
  updateNumberingSequences: z.object({
    invoice_format: z.string().optional(),
    invoice_prefix: z.string().optional(),
    invoice_next_number: z.number().optional(),
    invoice_padding_width: z.number().optional(),
    order_format: z.string().optional(),
    order_prefix: z.string().optional(),
    order_next_number: z.number().optional(),
    order_padding_width: z.number().optional(),
    quotation_format: z.string().optional(),
    quotation_prefix: z.string().optional(),
    quotation_next_number: z.number().optional(),
    quotation_padding_width: z.number().optional(),
    customer_format: z.string().optional(),
    customer_prefix: z.string().optional(),
    customer_next_number: z.number().optional(),
    customer_padding_width: z.number().optional(),
    supplier_format: z.string().optional(),
    supplier_prefix: z.string().optional(),
    supplier_next_number: z.number().optional(),
    supplier_padding_width: z.number().optional(),
    product_format: z.string().optional(),
    product_prefix: z.string().optional(),
    product_next_number: z.number().optional(),
    product_padding_width: z.number().optional(),
    purchase_order_format: z.string().optional(),
    purchase_order_prefix: z.string().optional(),
    purchase_order_next_number: z.number().optional(),
    purchase_order_padding_width: z.number().optional(),
    purchase_invoice_format: z.string().optional(),
    purchase_invoice_prefix: z.string().optional(),
    purchase_invoice_next_number: z.number().optional(),
    purchase_invoice_padding_width: z.number().optional(),
  }).passthrough(),

  // Currency Settings
  updateCurrencySettings: z.object({
    base_currency: z.string().max(3).optional(),
    currency_symbol: z.string().max(10).optional(),
    decimal_places: z.number().min(0).max(4).optional(),
    thousand_separator: z.string().max(1).optional(),
    decimal_separator: z.string().max(1).optional(),
  }),

  // Email Settings
  updateEmailSettings: z.object({
    smtp_host: z.string().max(255).optional(),
    smtp_port: z.number().optional(),
    smtp_username: z.string().max(255).optional(),
    smtp_password: z.string().optional(),
    smtp_encryption: z.enum(['none', 'ssl', 'tls']).optional(),
    from_email: z.string().email().optional(),
    from_name: z.string().max(255).optional(),
  }),

  // Tax Settings
  createTaxRate: z.object({
    tax_name: z.string().min(1).max(100),
    tax_rate: z.number().min(0).max(100),
    tax_type: z.enum(['percentage', 'fixed']).default('percentage'),
    is_active: z.boolean().default(true),
  }),

  updateTaxRate: z.object({
    tax_name: z.string().max(100).optional(),
    tax_rate: z.number().min(0).max(100).optional(),
    tax_type: z.enum(['percentage', 'fixed']).optional(),
    is_active: z.boolean().optional(),
  }),

  // Payment Methods
  createPaymentMethod: z.object({
    method_name: z.string().min(1).max(100),
    method_type: z.string().max(50).optional(),
    is_active: z.boolean().default(true),
    description: z.string().optional(),
  }),

  updatePaymentMethod: z.object({
    method_name: z.string().max(100).optional(),
    method_type: z.string().max(50).optional(),
    is_active: z.boolean().optional(),
    description: z.string().optional(),
  }),

  // Shipping Methods
  createShippingMethod: z.object({
    method_name: z.string().min(1).max(100),
    cost: z.number().optional(),
    estimated_days: z.number().optional(),
    is_active: z.boolean().default(true),
    description: z.string().optional(),
  }),

  updateShippingMethod: z.object({
    method_name: z.string().max(100).optional(),
    cost: z.number().optional(),
    estimated_days: z.number().optional(),
    is_active: z.boolean().optional(),
    description: z.string().optional(),
  }),

  // System Preferences
  updateSystemPreferences: z.object({
    date_format: z.string().max(50).optional(),
    time_format: z.string().max(50).optional(),
    timezone: z.string().max(100).optional(),
    language: z.string().max(10).optional(),
    items_per_page: z.number().optional(),
  }),

  updateUserPreferences: z.object({
    theme: z.enum(['light', 'dark']).optional(),
    notifications_enabled: z.boolean().optional(),
    email_notifications: z.boolean().optional(),
  }),

  // Layout Settings
  updateLayoutSettings: z.object({
    pos: z.object({
      columns: z.object({
        mobile: z.number().optional(),
        sm: z.number().optional(),
        md: z.number().optional(),
        lg: z.number().optional(),
        xl: z.number().optional(),
        xxl: z.number().optional(),
      }).optional(),
      gap: z.number().optional(),
      showImages: z.boolean().optional(),
      cardStyle: z.string().optional(),
    }).optional(),
    // Allow other layout config keys if needed in future
  }).passthrough(),
};

module.exports = settingsValidations;
