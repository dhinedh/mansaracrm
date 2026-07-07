// src/utils/pdfTemplate.js
const fs = require('fs');
const path = require('path');

/**
 * Converts number to Indian words (for "Amount in Words" field)
 */
function numberToWords(num) {
  if (!num || isNaN(num)) return 'ZERO';
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const n = Math.round(num);
  if (n === 0) return 'ZERO';
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' AND ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' LAKH' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' CRORE' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };
  return convert(n) + ' ONLY';
}

/**
 * Builds the HTML for the exact Mansara Foods invoice format
 * Columns: S.No | HSN | Item | NET WT(G) | Rate(Rs.) | PAC | WT/CTN(Kg) | CTNS | TOT. QTY | TOTAL NT WT(Kg) | PRICE
 */
const buildInvoiceHtml = (company, invoice) => {
  // Read Mansara logo
  let logoBase64 = '';
  try {
    const logoPath = path.join(__dirname, '../../public/logo.png');
    if (fs.existsSync(logoPath)) {
      logoBase64 = fs.readFileSync(logoPath).toString('base64');
    }
  } catch (err) {
    console.error('Logo read error:', err);
  }

  const isRetail = !!invoice.store;

  // Determine billing entity
  const billerName    = isRetail ? (invoice.dealer?.companyName || company.name) : company.name;
  const billerAddress = isRetail ? (invoice.dealer?.address || company.address) : company.address;
  const billerCity    = isRetail ? (invoice.dealer?.city || '') : '';
  const billerState   = isRetail ? (invoice.dealer?.state || '') : 'Tamil Nadu';
  const billerPin     = isRetail ? (invoice.dealer?.pincode || '') : '600077';
  const billerGst     = isRetail ? (invoice.dealer?.gstNumber || 'N/A') : company.gstNumber;
  const billerPhone   = isRetail ? (invoice.dealer?.phone || company.phone) : company.phone;

  const shipToName    = isRetail ? invoice.store?.name : invoice.dealer?.companyName;
  const shipToAddr    = isRetail ? invoice.store?.address : invoice.dealer?.address;
  const shipToCity    = isRetail ? (invoice.store?.city || '') : (invoice.dealer?.city || '');
  const shipToState   = isRetail ? (invoice.store?.state || '') : (invoice.dealer?.state || '');
  const shipToPin     = isRetail ? (invoice.store?.pincode || '') : (invoice.dealer?.pincode || '');
  const shipToGst     = isRetail ? (invoice.store?.gstNumber || 'N/A') : (invoice.dealer?.gstNumber || 'N/A');
  const shipToPhone   = isRetail ? (invoice.store?.phone || '') : (invoice.dealer?.phone || '');

  // Dealer logo for retail invoices
  let logoHtml = '';
  if (isRetail && invoice.dealer?.logoBase64) {
    const src = invoice.dealer.logoBase64.startsWith('data:')
      ? invoice.dealer.logoBase64
      : `data:image/png;base64,${invoice.dealer.logoBase64}`;
    logoHtml = `<img src="${src}" style="height:60px;width:auto;object-fit:contain;" alt="${billerName}" />`;
  } else if (logoBase64) {
    logoHtml = `<img src="data:image/png;base64,${logoBase64}" style="height:65px;width:auto;object-fit:contain;" alt="Mansara Foods" />`;
  } else {
    logoHtml = `<div style="font-size:22px;font-weight:900;color:#D6295A;letter-spacing:0.5px;">${billerName}</div>`;
  }

  // Invoice dates
  const invDate = new Date(invoice.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' });
  const dueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' })
    : new Date(new Date(invoice.createdAt).setDate(new Date(invoice.createdAt).getDate() + 15))
        .toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' });

  // Build rows — Mansara format: S.No | HSN | Item | NET WT(G) | Rate(Rs.) | PAC | WT/CTN(Kg) | CTNS | TOT.QTY | TOTAL NT WT(Kg) | PRICE
  const itemsRows = invoice.items.map((item, idx) => {
    const productName = item.product?.name || 'Product';
    const hsn         = item.product?.hsnCode || '1904';
    
    // Parse weight safely from string/number
    const parseWeightG = (wt) => {
      if (!wt) return 250;
      if (typeof wt === 'number') return wt;
      const str = String(wt).toLowerCase().replace(/\s+/g, '');
      const num = parseFloat(str);
      if (isNaN(num)) return 250;
      if (str.includes('kg') || str.includes('kilogram')) {
        return num * 1000;
      }
      return num;
    };
    
    const netWtG      = parseWeightG(item.product?.netWeightG || item.product?.weight);
    const mrp         = parseFloat(item.product?.mrp || item.product?.price || 0);
    const marginPct   = parseFloat(item.marginPct) || 0;
    // MRP-based: sellingPrice = MRP × (1 - margin/100)
    const rate        = parseFloat(item.sellingPrice) || (mrp * (1 - marginPct / 100));
    const pac         = item.pac || item.product?.cartonSize || 24;       // pieces per carton
    const wtPerCtn    = item.product?.wtPerCartonKg || ((netWtG * pac) / 1000).toFixed(2);
    const totQty      = parseInt(item.quantity) || 0;
    const ctns        = parseFloat((totQty / pac).toFixed(2));
    const totalNtWtKg = (totQty * netWtG / 1000).toFixed(2);
    const lineTotal   = parseFloat(item.lineTotal) || (rate * totQty);

    return `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-align:center;">${hsn}</td>
        <td style="text-align:left;padding-left:6px;">${productName}</td>
        <td style="text-align:center;">${netWtG}</td>
        <td style="text-align:right;">${rate.toFixed(1)}</td>
        <td style="text-align:center;">${pac}</td>
        <td style="text-align:center;">${wtPerCtn}</td>
        <td style="text-align:center;">${ctns}</td>
        <td style="text-align:center;">${totQty}</td>
        <td style="text-align:center;">${totalNtWtKg}</td>
        <td style="text-align:right;font-weight:600;">${lineTotal.toFixed(2)}</td>
      </tr>`;
  }).join('');

  // Empty rows for spacing (like the actual template)
  const emptyRows = Array(Math.max(0, 8 - invoice.items.length)).fill(0).map(() =>
    `<tr><td colspan="11" style="height:24px;">&nbsp;</td></tr>`).join('');

  const subtotal    = parseFloat(invoice.subtotal) || 0;
  const cgst        = parseFloat(invoice.cgst) || parseFloat(invoice.totalGst) / 2 || 0;
  const sgst        = parseFloat(invoice.sgst) || parseFloat(invoice.totalGst) / 2 || 0;
  const shipping    = parseFloat(invoice.shippingCharges) || 0;
  const discount    = parseFloat(invoice.totalDiscount) || 0;
  const originalTotal = subtotal + cgst + sgst + shipping;
  const grandTotal  = invoice.totalAmount !== undefined && invoice.totalAmount !== null ? parseFloat(invoice.totalAmount) : (originalTotal - discount);
  const grandRounded = Math.round(grandTotal);

  const bd = invoice.dealer?.bankDetails || {};

  // Terms
  const terms = invoice.dealer?.invoiceTerms
    ? invoice.dealer.invoiceTerms.split('\n').map((t, i) => `${i + 1}. ${t}`).join('<br>')
    : `1. Payment within 15 days.<br>2. Interest @ 2% per month on delay.<br>3. Claims if any must be reported at delivery.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice ${invoice.invoiceNo}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    color: #1a1a1a;
    background: #fff;
    padding: 20px 24px;
  }
  .outer { max-width: 820px; margin: auto; border: 1.5px solid #ccc; }
  .header-row { display: flex; align-items: stretch; border-bottom: 1.5px solid #ccc; }
  .logo-cell { width: 220px; padding: 10px 14px; border-right: 1.5px solid #ccc; display: flex; flex-direction: column; justify-content: center; }
  .company-cell { flex: 1; padding: 10px 14px; border-right: 1.5px solid #ccc; }
  .inv-meta-cell { width: 220px; padding: 10px 14px; text-align: right; }
  .company-name { font-size: 16px; font-weight: 900; color: #D6295A; text-transform: uppercase; margin-bottom: 3px; }
  .company-addr { font-size: 9.5px; color: #333; line-height: 1.5; }
  .gst-row { font-size: 10px; font-weight: 700; color: #1a1a1a; margin-top: 4px; }
  .inv-title { font-size: 12px; font-weight: 700; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 6px; }
  .meta-line { font-size: 10px; color: #333; display: flex; justify-content: space-between; margin-bottom: 2px; }
  .meta-line strong { color: #1a1a1a; }

  .dates-row { display: flex; border-bottom: 1.5px solid #ccc; }
  .date-cell { flex: 1; padding: 5px 14px; display: flex; align-items: center; gap: 8px; font-size: 10px; }
  .date-cell:not(:last-child) { border-right: 1px solid #ccc; }
  .date-label { font-weight: 700; }

  .bill-ship-row { display: flex; border-bottom: 1.5px solid #ccc; }
  .bill-cell { flex: 1; padding: 8px 14px; border-right: 1.5px solid #ccc; }
  .ship-cell { flex: 1; padding: 8px 14px; }
  .section-hdr { font-size: 9px; font-weight: 900; text-transform: uppercase; background: #D6295A; color: #fff; padding: 3px 8px; margin-bottom: 6px; letter-spacing: 0.5px; }
  .bill-name { font-size: 12px; font-weight: 700; margin-bottom: 3px; }
  .bill-addr { font-size: 9.5px; color: #333; line-height: 1.5; }
  .gstin-line { font-size: 9.5px; font-weight: 700; margin-top: 3px; }

  .items-table { width: 100%; border-collapse: collapse; border-bottom: 1.5px solid #ccc; }
  .items-table th {
    background: #D6295A; color: #fff; font-size: 9px; font-weight: 700;
    text-transform: uppercase; padding: 6px 5px; text-align: center;
    border-right: 1px solid rgba(255,255,255,0.3);
    letter-spacing: 0.3px;
  }
  .items-table th:last-child { border-right: none; }
  .items-table td { padding: 5px 5px; border-bottom: 1px solid #eee; font-size: 10px; }
  .items-table tr:nth-child(even) { background: #fafafa; }

  .footer-row { display: flex; border-bottom: 1.5px solid #ccc; }
  .words-cell { flex: 1; padding: 8px 14px; border-right: 1.5px solid #ccc; }
  .words-label { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #1a1a1a; margin-bottom: 4px; }
  .words-text { font-size: 10px; font-weight: 600; color: #1a1a1a; text-transform: uppercase; }

  .totals-table { width: 100%; border-collapse: collapse; }
  .totals-table td { padding: 3px 10px; font-size: 10px; }
  .totals-table .t-label { text-align: right; color: #333; }
  .totals-table .t-value { text-align: right; font-weight: 600; width: 80px; border-left: 1px solid #eee; }
  .totals-table .grand-row td { background: #D6295A; color: #fff; font-weight: 700; font-size: 11px; padding: 5px 10px; }

  .payment-sig-row { display: flex; border-bottom: 1.5px solid #ccc; }
  .payment-cell { flex: 1; padding: 8px 14px; border-right: 1.5px solid #ccc; }
  .sig-cell { width: 280px; padding: 8px 14px; text-align: right; }
  .pay-label { font-size: 9px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 5px; }
  .bank-table td { font-size: 9.5px; padding: 1.5px 0; }
  .bank-table td:first-child { font-weight: 700; padding-right: 8px; width: 80px; }
  .terms-cell { padding: 8px 14px; }
  .terms-label { font-size: 9px; font-weight: 900; text-decoration: underline; margin-bottom: 3px; }
  .terms-text { font-size: 9.5px; color: #333; line-height: 1.6; }
  .sig-label { font-size: 9px; font-weight: 700; margin-bottom: 30px; }
  .sig-name { font-size: 12px; font-style: italic; color: #D6295A; margin-bottom: 2px; }
  .sig-line { font-size: 9px; font-weight: 700; text-decoration: underline; }
  .footer-strip { padding: 6px 14px; text-align: center; font-size: 9px; color: #555; background: #f9f9f9; }
</style>
</head>
<body>
<div class="outer">

  <!-- ── Header ───────────────────────────────────────────────────────── -->
  <div class="header-row">
    <div class="logo-cell">
      ${logoHtml}
    </div>
    <div class="company-cell">
      <div class="company-name">${billerName}</div>
      <div class="company-addr">
        ${billerAddress}${billerCity ? ', ' + billerCity : ''}${billerState ? ', ' + billerState : ''}${billerPin ? ' - ' + billerPin : ''}. India.<br>
        Phone : ${billerPhone}<br>
        <span class="gst-row">GST No. ${billerGst}</span>
      </div>
    </div>
    <div class="inv-meta-cell">
      <div class="inv-title">TAX INVOICE</div>
      <div class="meta-line"><span>Invoice #</span><strong>${invoice.invoiceNo}</strong></div>
      <div class="meta-line"><span>Invoice Date :</span><strong>${invDate}</strong></div>
      <div class="meta-line"><span>Due Date :</span><strong>${dueDate}</strong></div>
      <div style="margin-top:6px;font-size:10px;display:flex;justify-content:space-between;">
        <span>Place of Supply :</span><strong>Tamil Nadu (33)</strong>
      </div>
    </div>
  </div>

  <!-- ── Bill To / Ship To ─────────────────────────────────────────────── -->
  <div class="bill-ship-row">
    <div class="bill-cell">
      <div class="section-hdr">Bill To</div>
      <div class="bill-name">${shipToName}</div>
      <div class="bill-addr">
        ${shipToAddr}${shipToCity ? ', ' + shipToCity : ''}${shipToState ? ', ' + shipToState : ''}${shipToPin ? ', ' + shipToPin : ''}<br>
        ${shipToPhone ? 'PH. ' + shipToPhone : ''}
      </div>
      ${shipToGst && shipToGst !== 'N/A' ? `<div class="gstin-line">GSTIN: ${shipToGst}</div>` : ''}
    </div>
    <div class="ship-cell">
      <div class="section-hdr">Ship To</div>
      <div class="bill-name">${shipToName}</div>
      <div class="bill-addr">
        ${shipToAddr}${shipToCity ? ', ' + shipToCity : ''}${shipToState ? ', ' + shipToState : ''}${shipToPin ? ', ' + shipToPin : ''}<br>
        ${shipToPhone ? 'PH. ' + shipToPhone : ''}
      </div>
    </div>
  </div>

  <!-- ── Items Table ───────────────────────────────────────────────────── -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:4%;">S.No</th>
        <th style="width:6%;">HSN</th>
        <th style="width:30%;text-align:left;padding-left:6px;">Item</th>
        <th style="width:7%;">NET WT (G)</th>
        <th style="width:8%;">Rate (Rs.)</th>
        <th style="width:5%;">PAC</th>
        <th style="width:8%;">WT/ CTN (Kg)</th>
        <th style="width:6%;">CTNS</th>
        <th style="width:7%;">TOT. QTY</th>
        <th style="width:9%;">TOTAL NT WT (Kg)</th>
        <th style="width:10%;">PRICE</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
      ${emptyRows}
    </tbody>
  </table>

  <!-- ── Totals & Words ────────────────────────────────────────────────── -->
  <div class="footer-row">
    <div class="words-cell">
      <div class="words-label">Total Amount in Words:</div>
      <div class="words-text">${numberToWords(grandRounded)}</div>
    </div>
    <div style="width:260px;border-left:1.5px solid #ccc;">
      <table class="totals-table">
        <tr><td class="t-label">Sub Total<br><span style="font-size:8px;color:#777;">(Without Tax)</span></td><td class="t-value">${subtotal.toFixed(2)}</td></tr>
        ${invoice.isGstEnabled !== false ? `
        <tr><td class="t-label">CGST (2.5%)</td><td class="t-value">${cgst.toFixed(2)}</td></tr>
        <tr><td class="t-label">SGST (2.5%)</td><td class="t-value">${sgst.toFixed(2)}</td></tr>
        ` : `<tr><td class="t-label">GST</td><td class="t-value">0.00</td></tr>`}
        ${shipping > 0 ? `<tr><td class="t-label">Shipping</td><td class="t-value">${shipping.toFixed(2)}</td></tr>` : ''}
        <tr><td class="t-label">Original Amount</td><td class="t-value">${originalTotal.toFixed(2)}</td></tr>
        ${discount > 0 ? `<tr><td class="t-label" style="color:#d97706;">Discount</td><td class="t-value" style="color:#d97706;">- ${discount.toFixed(2)}</td></tr>` : ''}
        <tr class="grand-row"><td class="t-label" style="color:#fff;">Amount To be Paid</td><td class="t-value" style="color:#fff;border-left:1px solid rgba(255,255,255,0.3);">${grandRounded}</td></tr>
      </table>
    </div>
  </div>

  <!-- ── Payment / Signature / Terms ──────────────────────────────────── -->
  <div class="payment-sig-row">
    <div class="payment-cell" style="flex:1;border-right:1.5px solid #ccc;">
      <div class="pay-label">Mode of Payment (Details):</div>
      ${bd.bankName || bd.accountNo ? `
      <div style="font-weight:700;font-size:10px;text-decoration:underline;margin-bottom:4px;">Account Details</div>
      <table class="bank-table">
        ${billerName ? `<tr><td colspan="2" style="font-weight:700;padding-bottom:2px;">${billerName}</td></tr>` : ''}
        ${bd.accountNo ? `<tr><td>A/C No.</td><td>${bd.accountNo}</td></tr>` : ''}
        ${bd.ifscCode  ? `<tr><td>IFSC Code :</td><td style="font-weight:700;">${bd.ifscCode}</td></tr>` : ''}
        ${bd.bankName  ? `<tr><td>Bank :</td><td>${bd.bankName}${bd.branch ? ', ' + bd.branch : ''}</td></tr>` : ''}
        <tr><td>UPI ID:</td><td>${bd.upiId || ''}</td></tr>
      </table>` : '<div style="font-size:10px;color:#777;font-style:italic;">Contact for payment details</div>'}
    </div>
    <div style="width:280px;padding:8px 14px;display:flex;flex-direction:column;justify-content:space-between;">
      <div>
        <div class="terms-label">Terms &amp; Conditions:</div>
        <div class="terms-text">${terms}</div>
      </div>
      <div style="text-align:right;margin-top:8px;">
        <div style="font-size:10px;font-weight:700;font-style:italic;color:#D6295A;">For ${billerName}.</div>
        <div style="font-size:10px;font-style:italic;color:#333;margin-top:28px;margin-bottom:2px;">H. Deepika</div>
        <div style="font-size:9px;color:#555;">Authorised Signatory</div>
        <div style="font-size:9px;font-weight:700;text-decoration:underline;margin-top:2px;">Authorized signature</div>
      </div>
    </div>
  </div>

  <!-- ── Footer Strip ──────────────────────────────────────────────────── -->
  <div class="footer-strip">
    Regd. Office &amp; Operations : Flat No. B4, No.13, Balaji Nagar 1<sup>st</sup> street extn, Noombal, Chennai – 600077, Tamil Nadu, India Ph: +91-88388 87064. |
    CIN- U10790TN2026PTC188398 | Email: contact@mansarafoods.com | Website: www.mansarafoods.com
  </div>
</div>
</body>
</html>`;
};


/**
 * Builds a simple retail/store invoice for dealer-to-store billing.
 * Columns: S.No | Item | Net Wt (G) | Qty | Rate (Rs.) | Amount
 * No carton/CTN columns — clean & simple for dealer store bills.
 */
const buildSimpleRetailInvoiceHtml = (company, invoice) => {
  let logoBase64 = '';
  try {
    const logoPath = path.join(__dirname, '../../public/logo.png');
    if (fs.existsSync(logoPath)) {
      logoBase64 = fs.readFileSync(logoPath).toString('base64');
    }
  } catch (err) {
    console.error('Logo read error:', err);
  }

  // Biller is always the dealer for retail store invoices
  const dealer = invoice.dealer || {};
  const store  = invoice.store  || {};

  let logoHtml = '';
  if (dealer.logoBase64) {
    const src = dealer.logoBase64.startsWith('data:') ? dealer.logoBase64 : `data:image/png;base64,${dealer.logoBase64}`;
    logoHtml = `<img src="${src}" style="height:55px;width:auto;object-fit:contain;" alt="${dealer.companyName}" />`;
  } else if (logoBase64) {
    logoHtml = `<img src="data:image/png;base64,${logoBase64}" style="height:55px;width:auto;object-fit:contain;" alt="Mansara Foods" />`;
  } else {
    logoHtml = `<div style="font-size:20px;font-weight:900;color:#D6295A;">${dealer.companyName || company.name}</div>`;
  }

  const billerName  = dealer.companyName  || company.name;
  const billerAddr  = dealer.address      || company.address;
  const billerPhone = dealer.phone        || company.phone;
  const billerGst   = dealer.gstNumber    || 'N/A';

  const shipToName  = store.name    || 'Walk-in Customer';
  const shipToAddr  = store.address || '';
  const shipToPhone = store.phone   || '';
  const shipToGst   = store.gstNumber || '';

  const invDate = new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  const dueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
    : new Date(new Date(invoice.createdAt).setDate(new Date(invoice.createdAt).getDate() + 15))
        .toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });

  // Build rows: S.No | Item (SKU) | Net Wt (G) | Qty | Rate | Amount
  const parseWeightG = (wt) => {
    if (!wt) return '';
    if (typeof wt === 'number') return wt;
    const str = String(wt).toLowerCase().replace(/\s+/g, '');
    const num = parseFloat(str);
    if (isNaN(num)) return '';
    if (str.includes('kg')) return Math.round(num * 1000);
    return num;
  };

  const itemsRows = invoice.items.map((item, idx) => {
    const productName = item.product?.name || 'Product';
    const sku         = item.product?.sku   || '';
    const netWtG      = parseWeightG(item.product?.netWeightG || item.product?.weight) || '';
    const mrp         = parseFloat(item.product?.mrp || item.product?.price || 0);
    const marginPct   = parseFloat(item.marginPct) || 0;
    const rate        = parseFloat(item.sellingPrice) || (mrp * (1 - marginPct / 100));
    const totQty      = parseInt(item.quantity) || 0;
    const lineTotal   = parseFloat(item.lineTotal) || (rate * totQty);
    const totalWtKg   = netWtG ? (totQty * netWtG / 1000).toFixed(2) : '';

    return `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-align:left;padding-left:6px;">
          <div style="font-weight:700;">${productName}</div>
          ${sku ? `<div style="font-size:8.5px;color:#888;">SKU: ${sku}</div>` : ''}
        </td>
        <td style="text-align:center;">${netWtG || '—'}</td>
        <td style="text-align:center;font-weight:600;">${totQty} ${item.product?.unit || 'PCS'}</td>
        ${totalWtKg ? `<td style="text-align:center;">${totalWtKg} Kg</td>` : '<td style="text-align:center;">—</td>'}
        <td style="text-align:right;">₹${rate.toFixed(2)}</td>
        <td style="text-align:right;font-weight:700;">₹${lineTotal.toFixed(2)}</td>
      </tr>`;
  }).join('');

  const emptyRows = Array(Math.max(0, 6 - invoice.items.length)).fill(0).map(() =>
    `<tr><td colspan="7" style="height:22px;">&nbsp;</td></tr>`).join('');

  const subtotal   = parseFloat(invoice.subtotal)    || 0;
  const cgst       = parseFloat(invoice.cgst)        || parseFloat(invoice.totalGst) / 2 || 0;
  const sgst       = parseFloat(invoice.sgst)        || parseFloat(invoice.totalGst) / 2 || 0;
  const shipping   = parseFloat(invoice.shippingCharges) || 0;
  const discount   = parseFloat(invoice.totalDiscount) || 0;
  const originalTotal = subtotal + cgst + sgst + shipping;
  const grandTotal = invoice.totalAmount !== undefined && invoice.totalAmount !== null ? parseFloat(invoice.totalAmount) : (originalTotal - discount);
  const grandRounded = Math.round(grandTotal);

  const bd = dealer.bankDetails || {};
  const terms = dealer.invoiceTerms
    ? dealer.invoiceTerms.split('\n').map((t, i) => `${i + 1}. ${t}`).join('<br>')
    : `1. Payment within 15 days.<br>2. Interest @ 2% per month on delay.<br>3. Claims must be reported at delivery.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice ${invoice.invoiceNo}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; padding: 20px 24px; }
  .outer { max-width: 780px; margin: auto; border: 1.5px solid #ccc; }
  .header-row { display: flex; align-items: stretch; border-bottom: 1.5px solid #ccc; }
  .logo-cell { width: 200px; padding: 10px 14px; border-right: 1.5px solid #ccc; display: flex; flex-direction: column; justify-content: center; }
  .company-cell { flex: 1; padding: 10px 14px; border-right: 1.5px solid #ccc; }
  .inv-meta-cell { width: 200px; padding: 10px 14px; text-align: right; }
  .company-name { font-size: 14px; font-weight: 900; color: #D6295A; text-transform: uppercase; margin-bottom: 3px; }
  .company-addr { font-size: 9.5px; color: #333; line-height: 1.5; }
  .gst-row { font-size: 10px; font-weight: 700; color: #1a1a1a; margin-top: 4px; }
  .inv-title { font-size: 12px; font-weight: 700; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 6px; }
  .meta-line { font-size: 10px; color: #333; display: flex; justify-content: space-between; margin-bottom: 2px; }
  .meta-line strong { color: #1a1a1a; }
  .bill-ship-row { display: flex; border-bottom: 1.5px solid #ccc; }
  .bill-cell { flex: 1; padding: 8px 14px; border-right: 1.5px solid #ccc; }
  .ship-cell { flex: 1; padding: 8px 14px; }
  .section-hdr { font-size: 9px; font-weight: 900; text-transform: uppercase; background: #D6295A; color: #fff; padding: 3px 8px; margin-bottom: 6px; letter-spacing: 0.5px; }
  .bill-name { font-size: 12px; font-weight: 700; margin-bottom: 3px; }
  .bill-addr { font-size: 9.5px; color: #333; line-height: 1.5; }
  .gstin-line { font-size: 9.5px; font-weight: 700; margin-top: 3px; }
  .items-table { width: 100%; border-collapse: collapse; border-bottom: 1.5px solid #ccc; }
  .items-table th { background: #D6295A; color: #fff; font-size: 9px; font-weight: 700; text-transform: uppercase; padding: 6px 5px; text-align: center; border-right: 1px solid rgba(255,255,255,0.3); letter-spacing: 0.3px; }
  .items-table th:last-child { border-right: none; }
  .items-table td { padding: 5px 5px; border-bottom: 1px solid #eee; font-size: 10px; }
  .items-table tr:nth-child(even) { background: #fafafa; }
  .footer-row { display: flex; border-bottom: 1.5px solid #ccc; }
  .words-cell { flex: 1; padding: 8px 14px; border-right: 1.5px solid #ccc; }
  .words-label { font-size: 9px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; }
  .words-text { font-size: 10px; font-weight: 600; text-transform: uppercase; }
  .totals-table { width: 100%; border-collapse: collapse; }
  .totals-table td { padding: 3px 10px; font-size: 10px; }
  .totals-table .t-label { text-align: right; color: #333; }
  .totals-table .t-value { text-align: right; font-weight: 600; width: 80px; border-left: 1px solid #eee; }
  .totals-table .grand-row td { background: #D6295A; color: #fff; font-weight: 700; font-size: 11px; padding: 5px 10px; }
  .payment-sig-row { display: flex; border-bottom: 1.5px solid #ccc; }
  .payment-cell { flex: 1; padding: 8px 14px; border-right: 1.5px solid #ccc; }
  .pay-label { font-size: 9px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 5px; }
  .bank-table td { font-size: 9.5px; padding: 1.5px 0; }
  .bank-table td:first-child { font-weight: 700; padding-right: 8px; width: 80px; }
  .footer-strip { padding: 6px 14px; text-align: center; font-size: 9px; color: #555; background: #f9f9f9; }
</style>
</head>
<body>
<div class="outer">

  <!-- Header -->
  <div class="header-row">
    <div class="logo-cell">${logoHtml}</div>
    <div class="company-cell">
      <div class="company-name">${billerName}</div>
      <div class="company-addr">
        ${billerAddr}<br>
        Phone: ${billerPhone}<br>
        <span class="gst-row">GST No. ${billerGst}</span>
      </div>
    </div>
    <div class="inv-meta-cell">
      <div class="inv-title">TAX INVOICE</div>
      <div class="meta-line"><span>Invoice #</span><strong>${invoice.invoiceNo}</strong></div>
      <div class="meta-line"><span>Date :</span><strong>${invDate}</strong></div>
      <div class="meta-line"><span>Due Date :</span><strong>${dueDate}</strong></div>
      ${invoice.isCredit ? '<div style="margin-top:5px;font-size:9px;font-weight:700;color:#B45309;background:#FEF3C7;padding:2px 6px;border-radius:4px;display:inline-block;">CREDIT BILL</div>' : ''}
    </div>
  </div>

  <!-- Bill To / Ship To -->
  <div class="bill-ship-row">
    <div class="bill-cell">
      <div class="section-hdr">Bill To (From Dealer)</div>
      <div class="bill-name">${billerName}</div>
      <div class="bill-addr">${billerAddr}<br>${billerPhone ? 'PH. ' + billerPhone : ''}</div>
      ${billerGst && billerGst !== 'N/A' ? `<div class="gstin-line">GSTIN: ${billerGst}</div>` : ''}
    </div>
    <div class="ship-cell">
      <div class="section-hdr">Ship To (Store / Outlet)</div>
      <div class="bill-name">${shipToName}</div>
      <div class="bill-addr">${shipToAddr}${shipToPhone ? '<br>PH. ' + shipToPhone : ''}</div>
      ${shipToGst ? `<div class="gstin-line">GSTIN: ${shipToGst}</div>` : ''}
    </div>
  </div>

  <!-- Items Table: Simplified -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:5%;">S.No</th>
        <th style="width:32%;text-align:left;padding-left:6px;">Item</th>
        <th style="width:9%;">NET WT (G)</th>
        <th style="width:11%;">QTY</th>
        <th style="width:11%;">TOTAL WT (Kg)</th>
        <th style="width:12%;">Rate (Rs.)</th>
        <th style="width:12%;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
      ${emptyRows}
    </tbody>
  </table>

  <!-- Totals & Words -->
  <div class="footer-row">
    <div class="words-cell">
      <div class="words-label">Total Amount in Words:</div>
      <div class="words-text">${numberToWords(grandRounded)}</div>
    </div>
    <div style="width:240px;border-left:1.5px solid #ccc;">
      <table class="totals-table">
        <tr><td class="t-label">Sub Total<br><span style="font-size:8px;color:#777;">(Without Tax)</span></td><td class="t-value">${subtotal.toFixed(2)}</td></tr>
        ${invoice.isGstEnabled !== false ? `
        <tr><td class="t-label">CGST (2.5%)</td><td class="t-value">${cgst.toFixed(2)}</td></tr>
        <tr><td class="t-label">SGST (2.5%)</td><td class="t-value">${sgst.toFixed(2)}</td></tr>
        ` : `<tr><td class="t-label">GST</td><td class="t-value">0.00</td></tr>`}
        ${shipping > 0 ? `<tr><td class="t-label">Shipping</td><td class="t-value">${shipping.toFixed(0)}</td></tr>` : ''}
        <tr><td class="t-label">Original Amount</td><td class="t-value">${originalTotal.toFixed(2)}</td></tr>
        ${discount > 0 ? `<tr><td class="t-label" style="color:#d97706;">Discount</td><td class="t-value" style="color:#d97706;">- ${discount.toFixed(2)}</td></tr>` : ''}
        <tr class="grand-row"><td class="t-label" style="color:#fff;">Amount To Be Paid</td><td class="t-value" style="color:#fff;border-left:1px solid rgba(255,255,255,0.3);">${grandRounded}</td></tr>
      </table>
    </div>
  </div>

  <!-- Payment / Signature / Terms -->
  <div class="payment-sig-row">
    <div class="payment-cell" style="flex:1;border-right:1.5px solid #ccc;">
      <div class="pay-label">Mode of Payment:</div>
      ${bd.bankName || bd.accountNo ? `
      <div style="font-weight:700;font-size:10px;text-decoration:underline;margin-bottom:4px;">Account Details</div>
      <table class="bank-table">
        ${billerName ? `<tr><td colspan="2" style="font-weight:700;padding-bottom:2px;">${billerName}</td></tr>` : ''}
        ${bd.accountNo ? `<tr><td>A/C No.</td><td>${bd.accountNo}</td></tr>` : ''}
        ${bd.ifscCode  ? `<tr><td>IFSC :</td><td style="font-weight:700;">${bd.ifscCode}</td></tr>` : ''}
        ${bd.bankName  ? `<tr><td>Bank :</td><td>${bd.bankName}${bd.branch ? ', ' + bd.branch : ''}</td></tr>` : ''}
        ${bd.upiId     ? `<tr><td>UPI ID:</td><td>${bd.upiId}</td></tr>` : ''}
      </table>` : '<div style="font-size:10px;color:#777;font-style:italic;">Contact for payment details</div>'}
    </div>
    <div style="width:260px;padding:8px 14px;display:flex;flex-direction:column;justify-content:space-between;">
      <div>
        <div style="font-size:9px;font-weight:900;text-decoration:underline;margin-bottom:3px;">Terms & Conditions:</div>
        <div style="font-size:9.5px;color:#333;line-height:1.6;">${terms}</div>
      </div>
      <div style="text-align:right;margin-top:8px;">
        <div style="font-size:10px;font-weight:700;font-style:italic;color:#D6295A;">For ${billerName}.</div>
        <div style="font-size:10px;font-style:italic;color:#333;margin-top:28px;margin-bottom:2px;">Authorised Signatory</div>
        <div style="font-size:9px;font-weight:700;text-decoration:underline;">Authorised Signature</div>
      </div>
    </div>
  </div>

  <!-- Footer Strip -->
  <div class="footer-strip">
    Powered by Mansara Foods CRM &nbsp;|&nbsp; contact@mansarafoods.com &nbsp;|&nbsp; www.mansarafoods.com
  </div>
</div>
</body>
</html>`;
};

/**
 * Builds the Dealer Appointment Agreement HTML
 * Matches the Mansara Foods agreement format with bold/underlined key terms
 */
const buildAgreementHtml = (company, dealer) => {
  let logoBase64 = '';
  try {
    const logoPath = path.join(__dirname, '../../public/logo.png');
    if (fs.existsSync(logoPath)) {
      logoBase64 = fs.readFileSync(logoPath).toString('base64');
    }
  } catch (e) {}

  const logoHtml = logoBase64
    ? `<img src="data:image/png;base64,${logoBase64}" style="height:70px;width:auto;object-fit:contain;" alt="Mansara Foods" />`
    : `<div style="font-size:22px;font-weight:900;color:#D6295A;">MANSARA</div>`;

  const today = new Date();
  const day   = today.getDate();
  const month = today.toLocaleString('en-IN', { month: 'long' }).toUpperCase();
  const year  = today.getFullYear();

  // Agreement number: MFD/GD/YEAR/XXX
  const agreeNo = `MFD/GD/${year}/${String(dealer.agreeSeq || 1).padStart(3, '0')}`;

  const zones = Array.isArray(dealer.zones) ? dealer.zones.join(', ') : (dealer.zones || 'Chennai');
  const dealerCity = dealer.city || 'Chennai';
  const dealerAddr = [dealer.address, dealerCity, dealer.state].filter(Boolean).join(', ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Dealer Appointment Agreement - ${dealer.companyName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11.5px;
    color: #1a1a1a;
    background: #fff;
    padding: 30px 40px;
    line-height: 1.7;
  }
  .outer { max-width: 800px; margin: auto; }
  .header { display: flex; align-items: center; gap: 20px; border-bottom: 3px solid #D6295A; padding-bottom: 14px; margin-bottom: 18px; }
  .company-hdr { flex: 1; }
  .company-title { font-size: 26px; font-weight: 900; color: #D6295A; text-transform: uppercase; letter-spacing: 1px; }
  .company-sub { font-size: 10px; color: #555; margin-top: 3px; }
  .agree-title { text-align: center; font-size: 14px; font-weight: 900; text-decoration: underline; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 0.5px; }
  p { margin-bottom: 10px; text-align: justify; }
  .field { font-weight: 700; text-decoration: underline; }
  .bold { font-weight: 700; }
  .center { text-align: center; }
  h3 { font-size: 12px; font-weight: 900; margin: 18px 0 8px; text-transform: uppercase; text-decoration: underline; }
  table.details { width: 100%; border-collapse: collapse; margin: 12px 0 18px; }
  table.details th, table.details td { border: 1px solid #999; padding: 6px 10px; font-size: 11px; }
  table.details th { background: #f0f0f0; font-weight: 700; width: 45%; }
  .clause { margin-bottom: 8px; }
  .clause-num { font-weight: 700; }
  .sig-section { display: flex; justify-content: space-between; margin-top: 50px; gap: 30px; }
  .sig-block { flex: 1; }
  .sig-party { font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 40px; }
  .sig-line { border-top: 1.5px solid #1a1a1a; padding-top: 5px; font-size: 10px; font-weight: 700; }
  .footer-strip { margin-top: 30px; border-top: 2px solid #D6295A; padding-top: 8px; text-align: center; font-size: 9px; color: #555; }
  .watermark { position: fixed; top: 45%; left: 50%; transform: translate(-50%,-50%) rotate(-30deg); font-size: 80px; font-weight: 900; color: rgba(214,41,90,0.05); pointer-events: none; white-space: nowrap; z-index: 0; }
</style>
</head>
<body>
<div class="watermark">MANSARA FOODS</div>
<div class="outer">

  <!-- Header -->
  <div class="header">
    <div>${logoHtml}</div>
    <div class="company-hdr">
      <div class="company-title">Mansara Foods Pvt Ltd</div>
      <div class="company-sub">B4, No.13, Balaji Nagar 1st street extn, Noombal, Chennai – 600077, Tamil Nadu</div>
      <div class="company-sub">Ph: +91-88388 87064 | CIN: U10790TN2026PTC188398 | GST: ${company.gstNumber}</div>
    </div>
  </div>

  <!-- Title -->
  <div class="agree-title">Dealer Appointment Agreement</div>

  <p><strong>Agreement No.:</strong> <span class="field">${agreeNo}</span></p>
  <p><strong>Date:</strong> <span class="field"> ${day} / ${month} / ${year} </span></p>
  <br>
  <p>This Dealer Appointment Agreement is executed at Chennai on this <span class="field">${day}th</span> day of <span class="field"> ${month}, ${year} </span>.</p>
  <p><strong>BETWEEN</strong></p>
  <p>MANSARA FOODS PRIVATE LIMITED, having its Registered Office at <span class="field"> NOOMBAL </span>, Chennai, Tamil Nadu,
  hereinafter referred to as the "Company", which expression shall, unless repugnant to the context, include its successors,
  administrators and assigns.</p>
  <p><strong>AND</strong></p>
  <p>M/s. <span class="field"> ${dealer.companyName.toUpperCase()} </span>, a Proprietorship / <s>Partnership / LLP / Private Limited Company</s> having its place of
  business at <span class="field"> ${dealerAddr.toUpperCase()} </span>, hereinafter referred to as the "Dealer", which expression
  shall, unless repugnant to the context, include its proprietors, partners, legal heirs, successors and permitted assigns.</p>

  <p>WHEREAS the Company is engaged in the manufacture and marketing of food products under the brand name MANSARA.</p>
  <p>AND WHEREAS the Dealer has approached the Company for appointments as an authorized Dealer for the products marketed by the Company.</p>
  <p>AND WHEREAS the Company, after evaluating the Dealer's credentials and infrastructure, has agreed to appoint the Dealer subject to the terms and conditions attached herewith.</p>

  <h3>Now This Agreement Witnesseth as Follows:</h3>
  <p>The Company hereby appoints the Dealer as an Authorized Growth Dealer for the territory specified herein and the Dealer hereby accepts such appointment.</p>
  <p>The Dealer shall be authorized to market and sell MANSARA products within the approved territory subject to compliance with the Company's policies, pricing structure, operational guidelines and the Terms &amp; Conditions annexed to this Agreement.</p>

  <h3>Dealer Details</h3>
  <table class="details">
    <tr><th>Particulars</th><th>Details</th></tr>
    <tr><td>Dealer Name</td><td>${dealer.companyName}</td></tr>
    <tr><td>Nature of Business</td><td>${dealer.dealerType === 'DISTRIBUTOR' ? 'Distributorship' : 'Proprietorship'}</td></tr>
    <tr><td>Proprietor / Authorized Person</td><td>${dealer.user?.name || dealer.contactName || '—'}</td></tr>
    <tr><td>GST No</td><td>${dealer.gstNumber || '—'}</td></tr>
    <tr><td>UDYAM Registration No.</td><td>${dealer.udyamNo || '—'}</td></tr>
    <tr><td>Assigned Territory / Zone</td><td>${zones}</td></tr>
    <tr><td>Dealer Category</td><td>${dealer.dealerCategory || 'STARTER'}</td></tr>
    <tr><td>Contact Phone</td><td>${dealer.phone || '—'}</td></tr>
  </table>

  <h3>Terms &amp; Conditions</h3>
  <div class="clause"><span class="clause-num">1.</span> The Dealer shall maintain minimum monthly purchase commitment as agreed with the Company.</div>
  <div class="clause"><span class="clause-num">2.</span> The Dealer shall not deal in any competing or similar food products without prior written consent of the Company.</div>
  <div class="clause"><span class="clause-num">3.</span> All payments shall be made within <strong>15 days</strong> from the date of invoice. Interest at <strong>2% per month</strong> shall be levied on delayed payments.</div>
  <div class="clause"><span class="clause-num">4.</span> The Dealer shall store products as per the Company's guidelines and maintain hygiene standards prescribed under FSSAI regulations.</div>
  <div class="clause"><span class="clause-num">5.</span> The Dealer shall not alter, tamper with, or reproduce any labels, trademarks, or packaging of MANSARA products.</div>
  <div class="clause"><span class="clause-num">6.</span> Either party may terminate this Agreement by giving <strong>30 days' written notice</strong>. The Company reserves the right to terminate immediately in case of breach.</div>
  <div class="clause"><span class="clause-num">7.</span> This Agreement shall be governed by and construed in accordance with the laws of India, and disputes shall be subject to the jurisdiction of courts in <strong>Chennai, Tamil Nadu</strong>.</div>
  <div class="clause"><span class="clause-num">8.</span> The initial security deposit of <strong>₹${(dealer.initialDeposit || 0).toLocaleString('en-IN')}</strong> paid by the Dealer shall be refundable upon termination, subject to no outstanding dues.</div>

  <!-- Signatures -->
  <div class="sig-section">
    <div class="sig-block">
      <div class="sig-party">For M/s. ${dealer.companyName}</div>
      <div class="sig-line">Authorized Signatory (Dealer)</div>
      <div style="font-size:9px;color:#555;margin-top:3px;">Name: _________________ &nbsp; Date: _________________</div>
    </div>
    <div class="sig-block" style="text-align:right;">
      <div class="sig-party">For Mansara Foods Pvt. Ltd.</div>
      <div class="sig-line">H. Deepika — Authorized Signatory</div>
      <div style="font-size:9px;color:#555;margin-top:3px;">Date: ${day}/${month}/${year}</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer-strip">
    Regd. Office &amp; Operations : Flat No. B4, No.13, Balaji Nagar 1<sup>st</sup> street extn, Noombal, Chennai – 600077, Tamil Nadu, India Ph: +91-88388 87064. |
    CIN- U10790TN2026PTC188398 | Email: contact@mansarafoods.com | Website: www.mansarafoods.com
  </div>
</div>
</body>
</html>`;
};

module.exports = { buildInvoiceHtml, buildSimpleRetailInvoiceHtml, buildAgreementHtml };
