// src/utils/pdfTemplate.js

/**
 * Builds the HTML template for A4 Invoice.
 * @param {Object} company - Company Details
 * @param {Object} invoice - Invoice with items, dealer, store
 * @returns {string} - Complete HTML content
 */
const buildInvoiceHtml = (company, invoice) => {
  const itemsRows = invoice.items.map((item, idx) => {
    const qty = parseInt(item.quantity);
    const unitPrice = parseFloat(item.unitPrice);
    const margin = parseFloat(item.marginPct);
    const sellingPrice = parseFloat(item.sellingPrice);
    const gstPct = parseFloat(item.gstPercent);
    const lineTotal = parseFloat(item.lineTotal);
    const gstAmt = parseFloat(item.gstAmount);

    return `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>
          <div style="font-weight: bold;">${item.product.name}</div>
          <div style="font-size: 10px; color: #555;">SKU: ${item.product.sku} | HSN: ${item.product.hsnCode || 'N/A'}</div>
        </td>
        <td style="text-align: center;">${qty} ${item.product.unit || 'PCS'}</td>
        <td style="text-align: right;">₹${unitPrice.toFixed(2)}</td>
        <td style="text-align: center;">${margin}%</td>
        <td style="text-align: right;">₹${sellingPrice.toFixed(2)}</td>
        <td style="text-align: center;">${gstPct}%</td>
        <td style="text-align: right;">₹${lineTotal.toFixed(2)}</td>
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
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #333;
          margin: 0;
          padding: 0;
          font-size: 12px;
          line-height: 1.4;
        }
        .invoice-box {
          max-width: 800px;
          margin: auto;
          background: #fff;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .header-table td {
          vertical-align: top;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #be123c; /* Sleek Crimson Rose primary color */
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .company-details {
          text-align: right;
          font-size: 11px;
          color: #555;
        }
        .divider {
          border-top: 2px solid #be123c;
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
          padding: 5px;
        }
        .section-title {
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          color: #be123c;
          margin-bottom: 5px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 3px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table th {
          background-color: #be123c;
          color: white;
          font-weight: bold;
          text-align: left;
          padding: 8px;
          font-size: 11px;
          text-transform: uppercase;
        }
        .items-table td {
          padding: 8px;
          border-bottom: 1px solid #eee;
          vertical-align: middle;
        }
        .items-table tr:nth-child(even) {
          background-color: #fafafa;
        }
        .totals-table {
          width: 40%;
          margin-left: 60%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .totals-table td {
          padding: 5px 8px;
          font-size: 11px;
        }
        .totals-table tr.grand-total {
          background-color: #be123c;
          color: white;
          font-weight: bold;
          font-size: 13px;
        }
        .footer {
          margin-top: 40px;
          font-size: 10px;
          color: #777;
          text-align: center;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        .signature-section {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
        }
        .sig-box {
          width: 200px;
          text-align: center;
          font-size: 11px;
        }
        .sig-line {
          border-top: 1px solid #333;
          margin-top: 50px;
          padding-top: 5px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <!-- Header -->
        <table class="header-table">
          <tr>
            <td>
              <div class="logo">${company.name}</div>
              <div style="font-size: 11px; color:#555; margin-top:5px;">
                <strong>GSTIN:</strong> ${company.gstNumber}<br>
                <strong>Tel:</strong> ${company.phone} | <strong>Email:</strong> ${company.email}
              </div>
            </td>
            <td class="company-details">
              <h2 style="margin: 0; color: #be123c; font-size: 20px;">TAX INVOICE</h2>
              <div style="margin-top: 8px; font-size: 12px;">
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
            <td>
              <div class="section-title">Billed By (Distributor)</div>
              <strong>${invoice.dealer.companyName}</strong><br>
              ${invoice.dealer.address}<br>
              ${invoice.dealer.city || ''}, ${invoice.dealer.state || ''} - ${invoice.dealer.pincode || ''}<br>
              <strong>GSTIN:</strong> ${invoice.dealer.gstNumber || 'N/A'}<br>
              <strong>Contact:</strong> ${invoice.dealer.phone}
            </td>
            <td>
              <div class="section-title">Billed To (Customer Store)</div>
              <strong>${invoice.store.name}</strong><br>
              ${invoice.store.address}<br>
              ${invoice.store.city || ''}, ${invoice.store.state || ''} - ${invoice.store.pincode || ''}<br>
              <strong>GSTIN:</strong> ${invoice.store.gstNumber || 'N/A'}<br>
              <strong>Contact:</strong> ${invoice.store.phone || 'N/A'}
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
            <td style="text-align: right;">₹${parseFloat(invoice.subtotal).toFixed(2)}</td>
          </tr>
          ${invoice.isGstEnabled !== false 
            ? `
              <tr>
                <td>CGST:</td>
                <td style="text-align: right;">₹${((invoice.cgst !== undefined ? parseFloat(invoice.cgst) : (parseFloat(invoice.totalGst) / 2)) || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>SGST:</td>
                <td style="text-align: right;">₹${((invoice.sgst !== undefined ? parseFloat(invoice.sgst) : (parseFloat(invoice.totalGst) / 2)) || 0).toFixed(2)}</td>
              </tr>
            `
            : `
              <tr>
                <td>GST (Disabled):</td>
                <td style="text-align: right;">₹0.00</td>
              </tr>
            `
          }
          <tr class="grand-total">
            <td>Grand Total:</td>
            <td style="text-align: right;">₹${parseFloat(invoice.totalAmount).toFixed(2)}</td>
          </tr>
        </table>

        <!-- Terms and Signatures -->
        <div style="margin-top: 40px; font-size: 10px; color:#555;">
          <strong>Terms & Conditions:</strong><br>
          1. Goods once sold will not be taken back.<br>
          2. Interest at 18% p.a. will be charged for delayed payments after due date.
        </div>

        <div class="signature-section">
          <div class="sig-box">
            <div class="sig-line">Customer Signature</div>
          </div>
          <div class="sig-box" style="margin-left: auto;">
            <div style="font-weight: bold;">For ${invoice.dealer.companyName}</div>
            <div class="sig-line">Authorized Signatory</div>
          </div>
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
