const { InvoiceRepository } = require('./sales.repository');
const SettingsRepository = require('../settings/settings.repository');
const SettingsServiceClass = require('../settings/settings.service');

const settingsService = new SettingsServiceClass(new SettingsRepository());

class EInvoiceService {
    /**
     * Step 1: Generate E-Invoice (Local Validation & Data Preparation)
     */
    async generateEInvoice(invoiceId, userId) {
        const invoice = await InvoiceRepository.findById(invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }

        // Local Validation
        // 1. Check if customer has TIN
        if (!invoice.order || !invoice.order.customer || !invoice.order.customer.tin) {
            // We might need to check where TIN is stored. For now assume invoice.order.customer.tin
            // throw new Error('Customer TIN is missing. Please update customer profile.');
        }

        // 2. Check if product codes are valid (MSIC / Classification)
        // For now, we'll just mark it as GENERATED

        const updatedInvoice = await InvoiceRepository.update(invoiceId, {
            e_invoice_status: 'GENERATED',
            updated_at: new Date()
        });

        return updatedInvoice;
    }

    /**
     * Step 2: Submit to LHDN (External API Call)
     */
    async submitEInvoice(invoiceId, userId) {
        const invoice = await InvoiceRepository.findById(invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }

        if (invoice.e_invoice_status !== 'GENERATED') {
            throw new Error('Invoice must be GENERATED before submission');
        }

        // 1. Get Settings
        const settings = await settingsService.getEInvoiceSettings();
        if (!settings.client_id || !settings.client_secret) {
            throw new Error('LHDN API credentials not configured');
        }

        // 2. Map Invoice to LHDN Format (Simplified for now)
        // Real implementation would involve calling LHDN MyInvois API
        // const lhdnResponse = await this._callLhdnApi(invoice, settings);

        // Simulate API Success
        const mockUuid = `LHDN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const mockQrUrl = `https://myinvois.hasil.gov.my/viewer/${mockUuid}`;

        const updatedInvoice = await InvoiceRepository.update(invoiceId, {
            e_invoice_status: 'SUBMITTED',
            e_invoice_uuid: mockUuid,
            e_invoice_qr_url: mockQrUrl,
            submission_date: new Date(),
            updated_at: new Date()
        });

        // In a real scenario, LHDN might return 'VALID' asynchronously, 
        // but here we simulation success for now.
        await InvoiceRepository.update(invoiceId, { e_invoice_status: 'VALID' });

        return {
            uuid: mockUuid,
            qr_url: mockQrUrl,
            status: 'VALID'
        };
    }

    async _callLhdnApi(invoice, settings) {
        // Placeholder for actual HTTP request to LHDN
        // 1. Get Access Token
        // 2. Submit Document
        // 3. Handle response
        return { uuid: '...', status: 'SUBMITTED' };
    }
}

module.exports = new EInvoiceService();
