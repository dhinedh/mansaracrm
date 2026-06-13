// src/utils/pdfTemplate.js
const fs = require('fs');
const path = require('path');

/**
 * Builds the HTML template for A4 Invoice.
 * @param {Object} company - Company Details
 * @param {Object} invoice - Invoice with items, dealer, store
 * @returns {string} - Complete HTML content
 */
const buildInvoiceHtml = (company, invoice) => {
  // Read logo.png and convert to base64 dynamically
  let logoBase64 = '';
  try {
    const logoPath = path.join(__dirname, '../../public/logo.png');
    if (fs.existsSync(logoPath)) {
      logoBase64 = fs.readFileSync(logoPath).toString('base64');
    }
  } catch (err) {
    console.error('Error reading logo file for PDF template:', err);
  }

  const itemsRows = invoice.items.map((item, idx) => {
    const qty = parseInt(item.quantity);
    const unitPrice = parseFloat(item.unitPrice);
    const margin = parseFloat(item.marginPct);
    const sellingPrice = parseFloat(item.sellingPrice);
    const gstPct = parseFloat(item.gstPercent);
    const lineTotal = parseFloat(item.lineTotal);

    return `
      <tr>
        <td style="text-align: center; color: #61220F;">${idx + 1}</td>
        <td>
          <div style="font-weight: 600; color: #36302E;">${item.product.name}</div>
          <div style="font-size: 10px; color: #812F16; font-weight: 500;">SKU: ${item.product.sku} | HSN: ${item.product.hsnCode || 'N/A'}</div>
        </td>
        <td style="text-align: center; font-weight: 600;">${qty} ${item.product.unit || 'PCS'}</td>
        <td style="text-align: right;">₹${unitPrice.toFixed(2)}</td>
        <td style="text-align: center; color: #B84A26; font-weight: 600;">${margin}%</td>
        <td style="text-align: right; font-weight: 600;">₹${sellingPrice.toFixed(2)}</td>
        <td style="text-align: center; color: #812F16;">${gstPct}%</td>
        <td style="text-align: right; font-weight: 700; color: #61220F;">₹${lineTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  // Formatted dates
  const dateStr = new Date(invoice.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>GST Invoice ${invoice.invoiceNo}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Outfit', 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #36302E;
          margin: 0;
          padding: 0;
          font-size: 12px;
          line-height: 1.4;
          background-color: #fff;
        }
        .invoice-box {
          max-width: 800px;
          margin: auto;
          background: #fff;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        .header-table td {
          vertical-align: top;
        }
        .logo-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .logo-img {
          height: 55px;
          width: auto;
          object-fit: contain;
          margin-bottom: 8px;
        }
        .logo-text {
          font-size: 24px;
          font-weight: 800;
          color: #B84A26; /* Brand Terracotta primary color */
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .company-contact {
          font-size: 11px;
          color: #61220F;
          line-height: 1.5;
        }
        .invoice-title-sec {
          text-align: right;
        }
        .invoice-title {
          margin: 0;
          color: #B84A26;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }
        .invoice-meta {
          margin-top: 10px;
          font-size: 11px;
          color: #36302E;
          line-height: 1.6;
        }
        .invoice-meta strong {
          color: #61220F;
        }
        .divider {
          border-top: 3px solid #B84A26;
          margin: 15px 0;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .info-table td {
          width: 50%;
          vertical-align: top;
          padding: 0 10px;
        }
        .info-card {
          background-color: #FAF8F5; /* Warm sand tint background */
          border: 1px solid #EBE3D5;
          border-radius: 12px;
          padding: 12px 16px;
          min-height: 110px;
        }
        .section-title {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: #B84A26;
          margin-bottom: 6px;
          letter-spacing: 0.8px;
          border-bottom: 1px dashed #E5A894;
          padding-bottom: 4px;
        }
        .info-card-content {
          font-size: 11px;
          line-height: 1.5;
          color: #36302E;
        }
        .info-card-content strong {
          color: #61220F;
          font-size: 12px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          border-radius: 8px;
          overflow: hidden;
        }
        .items-table th {
          background-color: #B84A26;
          color: white;
          font-weight: 700;
          text-align: left;
          padding: 10px 8px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .items-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #F5EFE6;
          vertical-align: middle;
        }
        .items-table tr:nth-child(even) {
          background-color: #FAF8F5;
        }
        .totals-container {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
        }
        .totals-table {
          width: 45%;
          margin-left: 55%;
          border-collapse: collapse;
          border: 1px solid #EBE3D5;
          border-radius: 8px;
          overflow: hidden;
        }
        .totals-table td {
          padding: 7px 12px;
          font-size: 11px;
          color: #36302E;
        }
        .totals-table tr {
          border-bottom: 1px solid #F5EFE6;
        }
        .totals-table tr.grand-total {
          background-color: #B84A26;
          color: white;
          font-weight: 700;
          font-size: 14px;
          border-bottom: none;
        }
        .totals-table tr.grand-total td {
          color: white;
          padding: 9px 12px;
        }
        .terms-section {
          margin-top: 35px;
          font-size: 10px;
          color: #61220F;
          background-color: #FAF8F5;
          border-left: 3px solid #B84A26;
          padding: 10px 15px;
          border-radius: 4px;
          line-height: 1.5;
        }
        .signature-section {
          margin-top: 40px;
          width: 100%;
        }
        .signature-table {
          width: 100%;
          border-collapse: collapse;
        }
        .signature-table td {
          width: 50%;
          vertical-align: bottom;
        }
        .sig-box {
          text-align: center;
          font-size: 11px;
          color: #36302E;
        }
        .sig-line {
          border-top: 1.5px solid #61220F;
          margin-top: 55px;
          padding-top: 6px;
          font-weight: 600;
          color: #61220F;
        }
        .footer {
          margin-top: 45px;
          font-size: 10px;
          color: #812F16;
          text-align: center;
          border-top: 1px solid #F5EFE6;
          padding-top: 12px;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <!-- Header -->
        <table class="header-table">
          <tr>
            <td>
              <div class="logo-container">
                ${logoBase64 
                  ? `<img class="logo-img" src="data:image/png;base64,${logoBase64}" alt="${company.name}" />`
                  : `<div class="logo-text">${company.name}</div>`
                }
                <div class="company-contact">
                  <strong>GSTIN:</strong> ${company.gstNumber}<br>
                  <strong>Tel:</strong> ${company.phone} | <strong>Email:</strong> ${company.email}
                </div>
              </div>
            </td>
            <td class="invoice-title-sec">
              <h2 class="invoice-title">TAX INVOICE</h2>
              <div class="invoice-meta">
                <strong>Invoice No:</strong> ${invoice.invoiceNo}<br>
                <strong>Date:</strong> ${dateStr}<br>
                <strong>Payment Mode:</strong> Cash / NetBanking
              </div>
            </td>
          </tr>
        </table>

        <div class="divider"></div>

        <!-- Info Details -->
        <table class="info-table">
          <tr>
            <td style="padding-left: 0;">
              <div class="info-card">
                <div class="section-title">Billed By (Distributor)</div>
                <div class="info-card-content">
                  <strong>${invoice.dealer.companyName}</strong><br>
                  ${invoice.dealer.address}<br>
                  ${invoice.dealer.city || ''}, ${invoice.dealer.state || ''} - ${invoice.dealer.pincode || ''}<br>
                  <strong>GSTIN:</strong> ${invoice.dealer.gstNumber || 'N/A'}<br>
                  <strong>Contact:</strong> ${invoice.dealer.phone}
                </div>
              </div>
            </td>
            <td style="padding-right: 0;">
              <div class="info-card">
                <div class="section-title">Billed To (Customer Store)</div>
                <div class="info-card-content">
                  <strong>${invoice.store.name}</strong><br>
                  ${invoice.store.address}<br>
                  ${invoice.store.city || ''}, ${invoice.store.state || ''} - ${invoice.store.pincode || ''}<br>
                  <strong>GSTIN:</strong> ${invoice.store.gstNumber || 'N/A'}<br>
                  <strong>Contact:</strong> ${invoice.store.phone || 'N/A'}
                </div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Invoice Items -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">#</th>
              <th style="width: 35%;">Product Details</th>
              <th style="width: 10%; text-align: center;">Qty</th>
              <th style="width: 12%; text-align: right;">Base Price</th>
              <th style="width: 8%; text-align: center;">Margin</th>
              <th style="width: 10%; text-align: right;">SP</th>
              <th style="width: 8%; text-align: center;">GST %</th>
              <th style="width: 12%; text-align: right;">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Summary Totals -->
        <table class="totals-table">
          <tr>
            <td>Subtotal:</td>
            <td style="text-align: right; font-weight: 600;">₹${parseFloat(invoice.subtotal).toFixed(2)}</td>
          </tr>
          ${invoice.isGstEnabled !== false 
            ? `
              <tr>
                <td>CGST (2.5%):</td>
                <td style="text-align: right; font-weight: 500;">₹${((invoice.cgst !== undefined ? parseFloat(invoice.cgst) : (parseFloat(invoice.totalGst) / 2)) || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>SGST (2.5%):</td>
                <td style="text-align: right; font-weight: 500;">₹${((invoice.sgst !== undefined ? parseFloat(invoice.sgst) : (parseFloat(invoice.totalGst) / 2)) || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">Total GST (5%):</td>
                <td style="text-align: right; font-weight: 600; color: #B84A26;">₹${parseFloat(invoice.totalGst).toFixed(2)}</td>
              </tr>
            `
            : `
              <tr>
                <td>GST (Disabled):</td>
                <td style="text-align: right; font-weight: 500; color: #812F16;">₹0.00</td>
              </tr>
            `
          }
          <tr class="grand-total">
            <td>Grand Total:</td>
            <td style="text-align: right;">₹${parseFloat(invoice.totalAmount).toFixed(2)}</td>
          </tr>
        </table>

        <!-- Terms and Conditions -->
        <div class="terms-section">
          <strong>Terms & Conditions:</strong><br>
          1. Goods once sold will not be taken back.<br>
          2. Interest at 18% p.a. will be charged for delayed payments after due date.
        </div>

        <!-- Signatures -->
        <div class="signature-section">
          <table class="signature-table">
            <tr>
              <td>
                <div class="sig-box" style="width: 200px;">
                  <div class="sig-line">Customer Signature</div>
                </div>
              </td>
              <td style="text-align: right;">
                <div class="sig-box" style="width: 220px; margin-left: auto;">
                  <div style="font-weight: bold; color: #61220F;">For ${invoice.dealer.companyName}</div>
                  <div class="sig-line">Authorized Signatory</div>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Footer -->
        <div class="footer">
          Thank you for your business! Powered by Mansara Foods CRM.
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { buildInvoiceHtml };
