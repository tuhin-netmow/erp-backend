const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a professional Invoice PDF and save it to disk.
 *
 * @param {object} options
 * @param {object} options.invoice      – Invoice DB record (plain object)
 * @param {object} options.company      – Company profile from settings
 * @param {string} options.outputPath   – Absolute path to write the PDF file
 * @returns {Promise<void>}
 */
async function generateInvoicePdf({ invoice, company, outputPath }) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });

            // Ensure output directory exists
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // ─── Colours & Fonts ────────────────────────────────────────────
            const PRIMARY   = '#1a56db';   // brand blue
            const DARK      = '#111827';
            const MUTED     = '#6b7280';
            const BORDER    = '#e5e7eb';
            const PAGE_W    = doc.page.width  - 100; // usable width (margins)
            const LEFT      = 50;

            // ─── HEADER ─────────────────────────────────────────────────────
            // Left: Company info
            doc.fillColor(PRIMARY).fontSize(20).font('Helvetica-Bold')
                .text(company.company_name || 'Company', LEFT, 50, { width: 280 });

            doc.fillColor(MUTED).fontSize(8.5).font('Helvetica');
            let cy = 75;
            if (company.address)  { doc.text(company.address,  LEFT, cy); cy += 12; }
            if (company.city)     { doc.text(company.city,     LEFT, cy); cy += 12; }
            if (company.phone)    { doc.text(company.phone,    LEFT, cy); cy += 12; }
            if (company.email)    { doc.text(company.email,    LEFT, cy); cy += 12; }

            // Right: INVOICE title + number
            doc.fillColor(PRIMARY).fontSize(26).font('Helvetica-Bold')
                .text('INVOICE', 350, 50, { width: 195, align: 'right' });
            doc.fillColor(DARK).fontSize(10).font('Helvetica')
                .text(`#${invoice.invoice_number || ''}`, 350, 82, { width: 195, align: 'right' });

            // Divider
            doc.moveTo(LEFT, 140).lineTo(LEFT + PAGE_W, 140)
                .strokeColor(BORDER).lineWidth(1).stroke();

            // ─── META ROW (Invoice Date | Due Date | Status | Tracking) ─────
            const meta = [
                { label: 'Invoice Date', value: invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-GB') : '—' },
                { label: 'Due Date',     value: invoice.due_date     ? new Date(invoice.due_date).toLocaleDateString('en-GB')     : '—' },
                { label: 'Status',       value: (invoice.status || 'draft').toUpperCase() },
            ];

            // add tracking number if present
            const deliveries = invoice.order?.deliveries || [];
            const delivery = deliveries[0] || null;
            const trackingNumber = delivery?.tracking_number || null;
            if (trackingNumber) {
                meta.push({ label: 'Tracking No.', value: trackingNumber });
            }

            const colW = PAGE_W / meta.length;
            meta.forEach((m, i) => {
                const x = LEFT + i * colW;
                doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(m.label, x, 150);
                doc.fillColor(DARK).fontSize(9.5).font('Helvetica-Bold').text(m.value, x, 162);
            });

            // ─── BILL TO / SHIP TO ───────────────────────────────────────────
            let rowY = 200;
            const customer = invoice.order?.customer || {};
            const halfW    = PAGE_W / 2 - 10;

            doc.fillColor(PRIMARY).fontSize(8).font('Helvetica-Bold')
                .text('BILL TO', LEFT, rowY);
            doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold')
                .text(customer.name || '—', LEFT, rowY + 12);
            doc.fillColor(MUTED).fontSize(8.5).font('Helvetica');
            if (customer.company) doc.text(customer.company, LEFT, rowY + 25);
            if (customer.email)   doc.text(customer.email,   LEFT, rowY + 37);
            if (customer.phone)   doc.text(customer.phone,   LEFT, rowY + 49);

            // Ship-to (from order shipping address)
            const shipX = LEFT + halfW + 20;
            doc.fillColor(PRIMARY).fontSize(8).font('Helvetica-Bold')
                .text('SHIP TO', shipX, rowY);
            doc.fillColor(MUTED).fontSize(8.5).font('Helvetica')
                .text(invoice.order?.shipping_address || customer.address || '—', shipX, rowY + 12, { width: halfW });

            // ─── ITEMS TABLE ─────────────────────────────────────────────────
            rowY = 310;

            // Table header background
            doc.rect(LEFT, rowY, PAGE_W, 18).fill(PRIMARY);

            const cols = {
                item:    { x: LEFT + 4,           w: 200 },
                sku:     { x: LEFT + 204,          w: 80  },
                qty:     { x: LEFT + 284,          w: 50  },
                price:   { x: LEFT + 334,          w: 70  },
                disc:    { x: LEFT + 404,          w: 50  },
                total:   { x: LEFT + 454,          w: PAGE_W - 454 - 4 },
            };

            doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
            doc.text('ITEM',      cols.item.x,  rowY + 5, { width: cols.item.w  });
            doc.text('SKU',       cols.sku.x,   rowY + 5, { width: cols.sku.w   });
            doc.text('QTY',       cols.qty.x,   rowY + 5, { width: cols.qty.w   });
            doc.text('PRICE',     cols.price.x, rowY + 5, { width: cols.price.w });
            doc.text('DISC',      cols.disc.x,  rowY + 5, { width: cols.disc.w  });
            doc.text('TOTAL',     cols.total.x, rowY + 5, { width: cols.total.w, align: 'right' });

            rowY += 18;

            // Rows
            const items = invoice.order?.items || [];
            const currency = company.currency || 'RM';

            items.forEach((item, idx) => {
                const rowBg = idx % 2 === 0 ? '#f9fafb' : '#ffffff';
                doc.rect(LEFT, rowY, PAGE_W, 18).fill(rowBg);

                const name     = item.product?.name || 'Item';
                const sku      = item.product?.sku  || '—';
                const qty      = Number(item.quantity  || 0);
                const price    = Number(item.unit_price || 0);
                const disc     = Number(item.discount  || 0);
                const lineTotal = Number(item.line_total || (qty * price - disc));

                doc.fillColor(DARK).fontSize(8).font('Helvetica');
                doc.text(name,                 cols.item.x,  rowY + 5, { width: cols.item.w  });
                doc.text(sku,                  cols.sku.x,   rowY + 5, { width: cols.sku.w   });
                doc.text(String(qty),          cols.qty.x,   rowY + 5, { width: cols.qty.w   });
                doc.text(`${currency} ${price.toFixed(2)}`, cols.price.x, rowY + 5, { width: cols.price.w });
                doc.text(`${currency} ${disc.toFixed(2)}`,  cols.disc.x,  rowY + 5, { width: cols.disc.w  });
                doc.text(`${currency} ${lineTotal.toFixed(2)}`, cols.total.x, rowY + 5, { width: cols.total.w, align: 'right' });

                rowY += 18;
            });

            // Bottom border of table
            doc.moveTo(LEFT, rowY).lineTo(LEFT + PAGE_W, rowY)
                .strokeColor(BORDER).lineWidth(0.5).stroke();

            rowY += 16;

            // ─── SUMMARY BOX ─────────────────────────────────────────────────
            const summaryX = LEFT + PAGE_W - 200;
            const summaryW = 200;

            const totalAmount   = Number(invoice.total_amount   || 0);
            const discAmount    = Number(invoice.order?.discount_amount || 0);
            const taxAmount     = Number(invoice.order?.tax_amount     || 0);
            const totalPayable  = Number(invoice.total_payable  || (totalAmount - discAmount + taxAmount));
            const paidAmount    = Number(invoice.paid_amount    || 0);
            const remaining     = Number(invoice.remaining_balance ?? (totalPayable - paidAmount));

            const summaryRows = [
                { label: 'Subtotal',   value: totalAmount },
                { label: 'Discount',   value: -discAmount },
                { label: 'Tax',        value: taxAmount   },
                { label: 'Total Payable', value: totalPayable, bold: true },
                { label: 'Paid',       value: paidAmount  },
                { label: 'Balance Due',value: remaining,  bold: true, color: remaining > 0 ? '#dc2626' : '#16a34a' },
            ];

            let sy = rowY;
            summaryRows.forEach(row => {
                const isBold = row.bold;
                if (isBold) {
                    doc.rect(summaryX, sy, summaryW, 16).fill(isBold && row.value > 0 ? '#fef2f2' : '#f0fdf4');
                }
                doc.fillColor(isBold ? (row.color || DARK) : MUTED)
                    .fontSize(8)
                    .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
                    .text(row.label, summaryX + 6, sy + 4, { width: 100 });
                doc.fillColor(isBold ? (row.color || DARK) : DARK)
                    .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
                    .text(`${currency} ${Math.abs(row.value).toFixed(2)}`, summaryX + 106, sy + 4, { width: summaryW - 112, align: 'right' });
                sy += 16;
            });

            // ─── NOTES ────────────────────────────────────────────────────────
            if (invoice.order?.notes) {
                const notesY = sy + 10 > rowY + 10 ? sy + 10 : rowY + 10;
                doc.fillColor(MUTED).fontSize(8).font('Helvetica-Bold')
                    .text('NOTES', LEFT, notesY);
                doc.fillColor(DARK).fontSize(8).font('Helvetica')
                    .text(invoice.order.notes, LEFT, notesY + 12, { width: summaryX - LEFT - 20 });
            }

            // ─── FOOTER ───────────────────────────────────────────────────────
            const pageH = doc.page.height;
            doc.moveTo(LEFT, pageH - 60).lineTo(LEFT + PAGE_W, pageH - 60)
                .strokeColor(BORDER).lineWidth(0.5).stroke();
            doc.fillColor(MUTED).fontSize(7.5).font('Helvetica')
                .text('Thank you for your business!', LEFT, pageH - 52, { align: 'center', width: PAGE_W });
            doc.text(`Generated: ${new Date().toLocaleString()}`, LEFT, pageH - 40, { align: 'center', width: PAGE_W });

            doc.end();

            stream.on('finish', resolve);
            stream.on('error', reject);
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { generateInvoicePdf };
