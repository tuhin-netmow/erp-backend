const SettingsService = require('./settings.service');

/**
 * Helper to generate padded unique numbers based on settings
 * @param {string} type - The key prefix for settings (invoice, order, quotation, customer, supplier, product)
 * @returns {Promise<string>} - The generated number
 */
async function generateNumber(type) {
    const settingsService = new SettingsService();
    const sequences = await settingsService.getNumberingSequences();

    // Get format or construct one from legacy prefix/padding fields
    let format = sequences[`${type}_format`];
    const prefix = sequences[`${type}_prefix`] || '';
    const paddingWidth = Number(sequences[`${type}_padding_width`]) || 0;
    const nextNumber = Number(sequences[`${type}_next_number`]) || 1;

    if (!format) {
        // Fallback for legacy data: e.g. "INV-0001"
        const zeros = '0'.repeat(paddingWidth);
        format = `${prefix}{${zeros}}`;
        // If there were no zeros (padding 0), it just becomes "PREFIX{}" which we'll handle
        if (paddingWidth === 0) format = `${prefix}{0}`;
    }

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const date = now.getDate().toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const yy = year.slice(-2);

    // 1. Replace Date Variables
    let generated = format
        .replace(/{year}/g, year)
        .replace(/{YY}/g, yy)
        .replace(/{month}/g, month)
        .replace(/{MM}/g, month)
        .replace(/{date}/g, date)
        .replace(/{day}/g, day)
        .replace(/{DD}/g, date);

    // 2. Replace Number Placeholder (e.g. {0000} or {0})
    // This regex looks for curly braces containing only zeros
    const numberPlaceholderRegex = /{(0*)}/;
    const match = generated.match(numberPlaceholderRegex);

    if (match) {
        const placeholder = match[0];
        const zeros = match[1];
        const width = zeros.length || 1; // {0} has length 1, {} has length 0 but we fallback to 1
        const paddedNumber = String(nextNumber).padStart(width, '0');
        generated = generated.replace(placeholder, paddedNumber);
    } else {
        // Fallback if no {000} placeholder is found: append number at the end
        const paddedNumber = String(nextNumber).padStart(paddingWidth || 1, '0');
        generated = `${generated}${paddedNumber}`;
    }

    // Update the next number in settings
    await settingsService.updateNumberingSequences({
        ...sequences,
        [`${type}_next_number`]: nextNumber + 1
    });

    return generated;
}

module.exports = { generateNumber };
