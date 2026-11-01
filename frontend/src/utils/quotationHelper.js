// src/utils/quotationHelper.js
// Centralized utility for Mansara Foods Quotations: HTML generation, PDF/Print, Download, and WhatsApp sharing.
import html2pdf from 'html2pdf.js';
import axios from 'axios';

export const numberToWords = (num) => {
  if (!num || isNaN(num)) return 'ZERO RUPEES ONLY';
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const n = Math.round(num);
  if (n === 0) return 'ZERO RUPEES ONLY';
  const convert = (val) => {
    if (val < 20) return ones[val];
    if (val < 100) return tens[Math.floor(val / 10)] + (val % 10 ? ' ' + ones[val % 10] : '');
    if (val < 1000) return ones[Math.floor(val / 100)] + ' HUNDRED' + (val % 100 ? ' AND ' + convert(val % 100) : '');
    if (val < 100000) return convert(Math.floor(val / 1000)) + ' THOUSAND' + (val % 1000 ? ' ' + convert(val % 1000) : '');
    if (val < 10000000) return convert(Math.floor(val / 100000)) + ' LAKH' + (val % 100000 ? ' ' + convert(val % 100000) : '');
    return convert(Math.floor(val / 10000000)) + ' CRORE' + (val % 10000000 ? ' ' + convert(val % 10000000) : '');
  };
  return convert(n).trim() + ' RUPEES ONLY';
};

export const parseWeightGrams = (wt) => {
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

export const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  // If Indian 10-digit number without country code, prepend 91
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
};

/**
 * Standard Company Settings Defaults
 */
export const DEFAULT_COMPANY_SETTINGS = {
  companyName: 'MANSARA FOODS PVT. LTD.',
  gstNumber: '33AABCM1234F1Z5',
  address: 'Flat No. B4, No.13, Balaji Nagar 1st street extn, Noombal',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600077',
  phone: '+91-88388 87064',
  email: 'contact@mansarafoods.com',
  website: 'www.mansarafoods.com',
  cin: 'U10790TN2026PTC188398',
  bankDetails: {
    bankName: 'HDFC Bank Ltd.',
    accountNo: '50200117036854',
    ifscCode: 'HDFC0001947',
    branch: 'Iyyapanthangal Branch',
    accountType: 'Current',
    upiId: 'vyapar.175693710434@hdfcbank'
  },
  signatoryTitle: 'Authorised Signatory',
  signatoryName: 'Mansara Foods Pvt. Ltd.',
  invoiceTerms: '1. Quotation valid for 15 days from issue date.\n2. Wholesale pricing is contingent upon order quantities and margin tiers selected.\n3. Goods once sold cannot be returned unless transit damage is reported upon receipt.'
};

/**
 * Normalizes quotation data from either PriceSimulator or FieldSales Quotation
 */
export const normalizeQuotationData = (raw) => {
  const isSimulator = !!raw.calculationSummary;
  const company = { ...DEFAULT_COMPANY_SETTINGS, ...(raw.companySettings || {}) };
  const refNo = raw.quotationRefNumber || raw.quotationNo || `QT-${Date.now().toString().slice(-6)}`;
  const dateStr = raw.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const dueDateStr = raw.dueDate || new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Customer resolution
  let customer = {
    name: 'Valued Trade Partner',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: ''
  };

  if (raw.selectedCustomer) {
    customer.name = raw.selectedCustomer.companyName || raw.selectedCustomer.name || raw.customClientName || 'Valued Trade Partner';
    customer.phone = raw.selectedCustomer.phone || '';
    customer.address = raw.selectedCustomer.address || '';
    customer.city = raw.selectedCustomer.city || '';
    customer.state = raw.selectedCustomer.state || '';
    customer.pincode = raw.selectedCustomer.pincode || '';
    customer.gstNumber = raw.selectedCustomer.gstNumber || '';
  } else if (raw.customerName) {
    customer.name = raw.customerName;
    customer.phone = raw.customerPhone || '';
    customer.address = raw.customerAddress || '';
    customer.city = raw.customerCity || '';
    customer.state = raw.customerState || '';
    customer.pincode = raw.customerPincode || '';
    customer.gstNumber = raw.customerGst || '';
  } else if (raw.customClientName) {
    customer.name = raw.customClientName;
  }

  // Items resolution
  let normalizedItems = [];
  let subtotal = 0;
  let totalGst = 0;
  let grandTotal = 0;
  let shipping = 0;
  let isWithGst = true;
  let gstRate = 5;

  if (isSimulator) {
    const calc = raw.calculationSummary;
    subtotal = calc.subtotalWithoutGst || 0;
    isWithGst = calc.isWithGst;
    gstRate = calc.gstRate || 0;
    totalGst = calc.totalGstAmount || 0;
    shipping = calc.shippingCharges || 0;
    grandTotal = calc.grandTotal || (subtotal + totalGst + shipping);

    normalizedItems = (calc.items || []).map((item, idx) => {
      const netWt = parseWeightGrams(item.netWeightG);
      const pac = item.pacSize || 24;
      const wtPerCtn = item.wtPerCartonKg || ((netWt * pac) / 1000).toFixed(2);
      const ctns = item.cartons || (item.pieces ? parseFloat((item.pieces / pac).toFixed(2)) : 1);
      const qty = item.pieces || item.quantity || 1;
      const rate = item.wholesalePricePerUnit || item.unitPrice || 0;
      const lineSubtotal = item.lineWholesaleTotal || (rate * qty);
      const lineGst = isWithGst ? (lineSubtotal * ((item.gstPercent || gstRate) / 100)) : 0;
      const lineTotal = lineSubtotal + lineGst;

      return {
        sno: idx + 1,
        hsn: item.hsnCode || '1901',
        name: item.name || item.productName || 'Product',
        sku: item.sku || '',
        netWtG: netWt,
        rate,
        pacSize: pac,
        wtPerCtn,
        cartons: ctns,
        quantity: qty,
        totalNetWtKg: ((qty * netWt) / 1000).toFixed(2),
        lineTotal,
        mrp: item.mrp || 0,
        marginPct: item.marginPct || 0
      };
    });
  } else {
    // Field sales quotation format
    const rawItems = raw.items || [];
    subtotal = raw.subtotal || 0;
    totalGst = raw.taxTotal || (subtotal * 0.05);
    grandTotal = raw.grandTotal || (subtotal + totalGst);
    isWithGst = totalGst > 0;
    gstRate = subtotal > 0 ? Math.round((totalGst / subtotal) * 100) : 5;

    normalizedItems = rawItems.map((item, idx) => {
      const qty = item.quantity || 1;
      const rate = item.unitPrice || item.price || 0;
      const mrp = item.mrp || rate;
      const lineTotal = item.totalPrice || (qty * rate);
      const netWt = parseWeightGrams(item.netWeight || 250);
      const pac = item.pacSize || 24;

      return {
        sno: idx + 1,
        hsn: item.hsnCode || '1901',
        name: item.productName || item.name || 'Product',
        sku: item.sku || '',
        netWtG: netWt,
        rate,
        pacSize: pac,
        wtPerCtn: ((netWt * pac) / 1000).toFixed(2),
        cartons: parseFloat((qty / pac).toFixed(2)),
        quantity: qty,
        totalNetWtKg: ((qty * netWt) / 1000).toFixed(2),
        lineTotal,
        mrp,
        marginPct: item.discountPercent || (mrp > rate ? Math.round(((mrp - rate) / mrp) * 100) : 0)
      };
    });
  }

  return {
    company,
    customer,
    refNo,
    dateStr,
    dueDateStr,
    items: normalizedItems,
    subtotal,
    isWithGst,
    gstRate,
    totalGst,
    cgst: isWithGst ? totalGst / 2 : 0,
    sgst: isWithGst ? totalGst / 2 : 0,
    shipping,
    grandTotal: Math.round(grandTotal),
    specialTerms: raw.specialTerms || raw.quotationNotes || company.invoiceTerms
  };
};

/**
 * Generate standard printable HTML for Quotation
 */
export const buildQuotationHtml = (rawData) => {
  const data = normalizeQuotationData(rawData);
  const { company, customer, refNo, dateStr, dueDateStr, items, subtotal, isWithGst, gstRate, cgst, sgst, shipping, grandTotal, specialTerms } = data;

  const activeLogo = company.logoBase64 || company.logoUrl;
  let logoHtml = '';
  if (activeLogo) {
    const src = activeLogo.startsWith('data:') || activeLogo.startsWith('http')
      ? activeLogo
      : (activeLogo.startsWith('/') ? `${window.location.origin}${activeLogo}` : `data:image/png;base64,${activeLogo}`);
    logoHtml = `<img src="${src}" style="max-height:65px;max-width:180px;object-fit:contain;" alt="${company.companyName}" />`;
  } else {
    logoHtml = `<img src="${window.location.origin}/logo.png" style="max-height:65px;max-width:180px;object-fit:contain;" onerror="this.style.display='none'" alt="${company.companyName}" />`;
  }

  const itemsRows = items.map((it) => `
    <tr>
      <td style="text-align:center;">${it.sno}</td>
      <td style="text-align:center;">${it.hsn}</td>
      <td style="text-align:left;padding-left:6px;"><strong>${it.name}</strong>${it.sku ? `<span style="font-size:9px;color:#777;display:block;">${it.sku}</span>` : ''}</td>
      <td style="text-align:center;">${it.netWtG}</td>
      <td style="text-align:right;padding-right:6px;">${Number(it.rate).toFixed(2)}</td>
      <td style="text-align:center;">${it.pacSize}</td>
      <td style="text-align:center;">${it.wtPerCtn}</td>
      <td style="text-align:center;">${it.cartons}</td>
      <td style="text-align:center;font-weight:700;">${it.quantity}</td>
      <td style="text-align:center;">${it.totalNetWtKg}</td>
      <td style="text-align:right;font-weight:700;padding-right:6px;">${Number(it.lineTotal).toFixed(2)}</td>
    </tr>
  `).join('');

  const emptyRowsCount = Math.max(0, 7 - items.length);
  const emptyRows = Array(emptyRowsCount).fill(0).map(() =>
    `<tr><td colspan="11" style="height:20px;border-bottom:1px solid #eee;">&nbsp;</td></tr>`
  ).join('');

  const termsFormatted = specialTerms
    ? specialTerms.split('\n').filter(Boolean).map((t, i) => `${i + 1}. ${t.replace(/^\d+\.\s*/, '')}`).join('<br>')
    : `1. Quotation valid for 15 days.<br>2. Wholesale rates are inclusive of packaging.<br>3. Delivery as per schedule.`;

  const bd = company.bankDetails || {};

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Quotation ${refNo}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    color: #1a1a1a;
    background: #fff;
    padding: 20px 24px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page {
    size: A4 portrait;
    margin: 10mm;
  }
  @media print {
    body { padding: 0 !important; margin: 0 !important; }
    .outer { max-width: 100% !important; border: 1.5px solid #ccc !important; }
    .no-print { display: none !important; }
  }
  .outer { max-width: 820px; margin: auto; border: 1.5px solid #ccc; background: #fff; }
  .header-row { display: flex; align-items: stretch; border-bottom: 1.5px solid #ccc; }
  .logo-cell { width: 220px; padding: 12px 14px; border-right: 1.5px solid #ccc; display: flex; align-items: center; justify-content: center; }
  .company-cell { flex: 1; padding: 10px 14px; border-right: 1.5px solid #ccc; }
  .inv-meta-cell { width: 230px; padding: 10px 14px; text-align: right; }
  .company-name { font-size: 15px; font-weight: 900; color: #D6295A; text-transform: uppercase; margin-bottom: 3px; line-height: 1.2; }
  .company-addr { font-size: 9.5px; color: #333; line-height: 1.5; }
  .gst-row { font-size: 10px; font-weight: 700; color: #1a1a1a; margin-top: 4px; display: inline-block; }
  .inv-title { font-size: 14px; font-weight: 900; color: #1a1a1a; margin-bottom: 8px; text-align: right; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta-line { font-size: 10px; color: #333; display: flex; justify-content: space-between; margin-bottom: 2px; }
  .meta-line strong { color: #1a1a1a; font-weight: 700; }

  .bill-ship-row { display: flex; border-bottom: 1.5px solid #ccc; }
  .bill-cell { flex: 1; padding: 8px 14px; border-right: 1.5px solid #ccc; }
  .ship-cell { flex: 1; padding: 8px 14px; }
  .section-hdr { font-size: 10px; font-weight: 900; color: #555; text-transform: uppercase; margin-bottom: 3px; }
  .bill-name { font-size: 12px; font-weight: 800; color: #111; margin-bottom: 2px; }
  .bill-addr { font-size: 9.5px; color: #444; line-height: 1.4; }

  .items-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
  .items-table th { background: #f2f2f2; color: #1a1a1a; font-weight: 800; border-bottom: 1.5px solid #ccc; border-right: 1px solid #ccc; padding: 6px 3px; text-align: center; }
  .items-table th:last-child { border-right: none; }
  .items-table td { border-bottom: 1px solid #eee; border-right: 1px solid #eee; padding: 5px 3px; }
  .items-table td:last-child { border-right: none; }

  .bottom-container { display: flex; border-top: 1.5px solid #ccc; border-bottom: 1.5px solid #ccc; }
  .bottom-left { flex: 1; border-right: 1.5px solid #ccc; display: flex; flex-direction: column; }
  .words-cell { padding: 8px 12px; border-bottom: 1px solid #eee; background: #fafafa; }
  .words-label { font-size: 9px; font-weight: 800; color: #555; text-transform: uppercase; }
  .words-text { font-size: 10.5px; font-weight: 800; color: #D6295A; margin-top: 2px; }
  .payment-cell { padding: 7px 12px; border-bottom: 1px solid #eee; }
  .pay-label { font-size: 9px; font-weight: 800; color: #555; }
  .pay-info { font-size: 9.5px; color: #333; margin-top: 1px; }
  .terms-cell { padding: 8px 12px; flex: 1; }
  .terms-label { font-size: 9px; font-weight: 800; color: #555; margin-bottom: 2px; }
  .terms-text { font-size: 9px; color: #444; line-height: 1.4; }

  .bottom-right { width: 330px; display: flex; flex-direction: column; }
  .totals-table { width: 100%; border-collapse: collapse; }
  .totals-table td { padding: 4.5px 12px; font-size: 10px; }
  .t-label { text-align: left; color: #444; border-bottom: 1px solid #eee; }
  .t-value { text-align: right; font-weight: 700; color: #111; border-bottom: 1px solid #eee; border-left: 1px solid #eee; }
  .grand-row { background: #D6295A !important; color: #fff !important; }
  .grand-row td { font-size: 12px !important; font-weight: 900 !important; color: #fff !important; padding: 7px 12px !important; }

  .account-details-block { padding: 8px 12px; border-top: 1px solid #ccc; background: #fafafa; font-size: 9px; }
  .account-header { font-size: 9.5px; font-weight: 800; color: #222; margin-bottom: 4px; text-transform: uppercase; }
  .bank-table { width: 100%; border-collapse: collapse; font-size: 9px; }
  .bank-table td { padding: 1.5px 2px; color: #333; }
  .bank-table td:first-child { width: 75px; color: #666; font-weight: 600; }

  .sig-section { padding: 12px; text-align: right; border-top: 1px solid #eee; }
  .sig-company { font-size: 9px; font-weight: 700; color: #333; }
  .sig-name { font-size: 10px; font-weight: 800; color: #D6295A; margin-top: 25px; }
  .sig-title { font-size: 8.5px; color: #666; }

  .footer-strip { padding: 8px 14px; text-align: center; font-size: 8.5px; color: #666; background: #f9f9f9; line-height: 1.4; }
</style>
</head>
<body>
<div class="outer">
  <!-- Header -->
  <div class="header-row">
    <div class="logo-cell">${logoHtml}</div>
    <div class="company-cell">
      <div class="company-name">${company.companyName}</div>
      <div class="company-addr">
        ${company.address ? `${company.address}, ` : ''}${company.city} - ${company.pincode}, ${company.state}.<br>
        Phone: ${company.phone} | Email: ${company.email}
      </div>
      <div class="gst-row">GSTIN / UIN: ${company.gstNumber}</div>
    </div>
    <div class="inv-meta-cell">
      <div class="inv-title">PRICE QUOTATION</div>
      <div class="meta-line"><span>Quote Ref #:</span> <strong>${refNo}</strong></div>
      <div class="meta-line"><span>Date:</span> <strong>${dateStr}</strong></div>
      <div class="meta-line"><span>Valid Until:</span> <strong>${dueDateStr}</strong></div>
    </div>
  </div>

  <!-- Customer / Consignee -->
  <div class="bill-ship-row">
    <div class="bill-cell">
      <div class="section-hdr">QUOTATION ISSUED TO</div>
      <div class="bill-name">${customer.name}</div>
      <div class="bill-addr">
        ${customer.address ? `${customer.address}, ` : ''}${customer.city} ${customer.state ? `, ${customer.state}` : ''} ${customer.pincode ? `- ${customer.pincode}` : ''}<br>
        ${customer.phone ? `Phone: ${customer.phone}<br>` : ''}
        ${customer.gstNumber ? `GSTIN: ${customer.gstNumber}` : ''}
      </div>
    </div>
    <div class="ship-cell">
      <div class="section-hdr">DISPATCH &amp; SUPPLY TERMS</div>
      <div class="bill-addr" style="margin-top:2px;">
        <strong>Place of Supply:</strong> ${company.state || 'Tamil Nadu (33)'}<br>
        <strong>Payment Mode:</strong> NEFT / RTGS / Online Transfer / UPI / Cheque<br>
        <strong>Lead Time:</strong> 1-3 Business Days upon PO acceptance<br>
        <strong>Price Validity:</strong> 15 Days from quote issuance
      </div>
    </div>
  </div>

  <!-- Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:4%;">S.NO</th>
        <th style="width:6%;">HSN</th>
        <th style="width:28%;text-align:left;padding-left:6px;">ITEM DESCRIPTION</th>
        <th style="width:7%;">NET WT<br>(G)</th>
        <th style="width:8%;text-align:right;padding-right:6px;">RATE<br>(₹)</th>
        <th style="width:5%;">PAC</th>
        <th style="width:8%;">WT/ CTN<br>(KG)</th>
        <th style="width:6%;">CTNS</th>
        <th style="width:7%;">TOT.<br>QTY</th>
        <th style="width:9%;">TOTAL NT<br>WT (KG)</th>
        <th style="width:12%;text-align:right;padding-right:6px;">PRICE (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
      ${emptyRows}
    </tbody>
  </table>

  <!-- Bottom Container -->
  <div class="bottom-container">
    <div class="bottom-left">
      <div class="words-cell">
        <div class="words-label">TOTAL AMOUNT IN WORDS:</div>
        <div class="words-text">${numberToWords(grandTotal)}</div>
      </div>
      <div class="payment-cell">
        <div class="pay-label">ACCEPTED PAYMENT MODES:</div>
        <div class="pay-info">Cheque / Demand Draft / NEFT / RTGS / Direct Bank Transfer / UPI</div>
      </div>
      <div class="terms-cell">
        <div class="terms-label">Terms &amp; Conditions:</div>
        <div class="terms-text">${termsFormatted}</div>
      </div>
    </div>

    <div class="bottom-right">
      <table class="totals-table">
        <tr><td class="t-label">Sub Total (Without Tax)</td><td class="t-value">${subtotal.toFixed(2)}</td></tr>
        ${isWithGst ? `
        <tr><td class="t-label">CGST (${(gstRate / 2).toFixed(1).replace(/\.0$/, '')}%)</td><td class="t-value">${cgst.toFixed(2)}</td></tr>
        <tr><td class="t-label">SGST (${(gstRate / 2).toFixed(1).replace(/\.0$/, '')}%)</td><td class="t-value">${sgst.toFixed(2)}</td></tr>
        ` : `<tr><td class="t-label">GST Status</td><td class="t-value">0.00</td></tr>`}
        ${shipping > 0 ? `<tr><td class="t-label">Shipping / Freight</td><td class="t-value">${shipping.toFixed(2)}</td></tr>` : ''}
        <tr class="grand-row"><td class="t-label">Amount Payable</td><td class="t-value">₹${grandTotal.toLocaleString('en-IN')}</td></tr>
      </table>

      <div class="account-details-block">
        <div class="account-header">Bank Account Details:</div>
        <table class="bank-table">
          <tr><td>Account Name:</td><td><strong>${company.companyName}</strong></td></tr>
          <tr><td>Bank:</td><td>${bd.bankName || 'HDFC Bank Ltd.'}${bd.branch ? `, ${bd.branch}` : ''}</td></tr>
          <tr><td>A/C No:</td><td style="font-family:monospace;font-weight:700;">${bd.accountNo || '50200117036854'}</td></tr>
          <tr><td>IFSC Code:</td><td style="font-family:monospace;font-weight:700;">${bd.ifscCode || 'HDFC0001947'}</td></tr>
          ${bd.upiId ? `<tr><td>UPI ID:</td><td>${bd.upiId}</td></tr>` : ''}
        </table>
      </div>

      <div class="sig-section">
        <div class="sig-company">For ${company.companyName}</div>
        <div class="sig-name">${company.signatoryName || 'Mansara Foods Pvt. Ltd.'}</div>
        <div class="sig-title">${company.signatoryTitle || 'Authorised Signatory'}</div>
      </div>
    </div>
  </div>

  <div class="footer-strip">
    ${company.address ? `${company.address}, ${company.city} – ${company.pincode}. ` : ''}Phone: ${company.phone} | CIN: ${company.cin || 'U10790TN2026PTC188398'} | Email: ${company.email} | ${company.website}
  </div>
</div>
</body>
</html>`;
};

/**
 * Triggers non-blocking native print dialog (save to PDF) via invisible iframe
 */
export const triggerPrintQuotation = (htmlContent) => {
  const oldFrame = document.getElementById('mansara-quote-print-frame');
  if (oldFrame) oldFrame.remove();

  const printFrame = document.createElement('iframe');
  printFrame.id = 'mansara-quote-print-frame';
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';
  printFrame.style.opacity = '0';
  printFrame.style.pointerEvents = 'none';
  document.body.appendChild(printFrame);

  const frameDoc = printFrame.contentWindow.document;
  frameDoc.open();
  frameDoc.write(htmlContent);
  frameDoc.close();

  setTimeout(() => {
    try {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
    } catch (err) {
      console.error('Print iframe error, fallback to window.print():', err);
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(htmlContent);
        printWin.document.close();
        printWin.focus();
        printWin.print();
      }
    } finally {
      setTimeout(() => {
        const frameToRemove = document.getElementById('mansara-quote-print-frame');
        if (frameToRemove) frameToRemove.remove();
      }, 3000);
    }
  }, 400);
};

/**
 * Download Quotation as standalone offline HTML document
 */
export const downloadQuotationHtml = (htmlContent, fileName = 'Quotation.html') => {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Format structured WhatsApp Message for Quotation
 */
export const formatQuotationWhatsAppText = (rawData) => {
  const data = normalizeQuotationData(rawData);
  const { company, customer, refNo, dateStr, dueDateStr, items, subtotal, isWithGst, gstRate, totalGst, shipping, grandTotal } = data;
  const bd = company.bankDetails || {};

  const itemsList = items.map((it, idx) => {
    return `${idx + 1}. *${it.name}*
   • Order Qty: *${it.quantity} pcs* (${it.cartons} ctn)
   • MRP: ₹${Number(it.mrp || 0).toFixed(2)} | Margin: ${it.marginPct || 0}%
   • Wholesale Rate: *₹${Number(it.rate).toFixed(2)}/pc*
   • Line Total: *₹${Number(it.lineTotal).toLocaleString('en-IN')}*`;
  }).join('\n\n');

  const textLines = [
    `*========================================*`,
    `🏢 *MANSARA FOODS PVT. LTD.*`,
    `📋 *OFFICIAL COMMERCIAL QUOTATION*`,
    `*========================================*`,
    `🔖 *Quotation Ref:* ${refNo}`,
    `📅 *Date:* ${dateStr}`,
    `⏳ *Valid Until:* ${dueDateStr}`,
    `👤 *Prepared For:* *${customer.name}*`,
    customer.phone ? `📞 *Contact:* ${customer.phone}` : null,
    customer.gstNumber ? `🏛️ *GSTIN:* ${customer.gstNumber}` : null,
    `----------------------------------------`,
    `📦 *ITEMIZED PRODUCTS & RATES:*`,
    `----------------------------------------`,
    itemsList,
    `----------------------------------------`,
    `📊 *FINANCIAL SUMMARY:*`,
    `----------------------------------------`,
    `• Subtotal (Taxable): ₹${subtotal.toLocaleString('en-IN')}`,
    isWithGst ? `• GST (${gstRate}%): +₹${totalGst.toLocaleString('en-IN')}` : `• GST: Without GST (0%)`,
    shipping > 0 ? `• Shipping / Freight: +₹${shipping.toLocaleString('en-IN')}` : null,
    `💰 *GRAND TOTAL: ₹${grandTotal.toLocaleString('en-IN')}*`,
    `🔤 *In Words:* ${numberToWords(grandTotal)}`,
    `----------------------------------------`,
    `🏦 *PAYMENT / BANK TRANSFER DETAILS:*`,
    `• Account Name: *${company.companyName}*`,
    `• Bank: ${bd.bankName || 'HDFC Bank Ltd.'}`,
    `• A/C No: *${bd.accountNo || '50200117036854'}*`,
    `• IFSC Code: *${bd.ifscCode || 'HDFC0001947'}*`,
    bd.upiId ? `• UPI ID: *${bd.upiId}*` : null,
    `----------------------------------------`,
    `📌 *Terms & Conditions:*`,
    `1. Quotation is valid for 15 days from issue date.`,
    `2. Wholesale rates are subject to confirmed order quantities.`,
    `3. Dispatched within 24-48 hours upon order confirmation.`,
    `----------------------------------------`,
    `_Mansara Foods Pvt. Ltd. | Ph: ${company.phone}_`,
    `_Website: ${company.website}_`
  ].filter(Boolean).join('\n');

  return textLines;
};

/**
 * Open WhatsApp with prefilled message & target phone
 */
export const openWhatsAppQuotation = (rawData, targetPhone = null) => {
  const data = normalizeQuotationData(rawData);
  const msg = formatQuotationWhatsAppText(rawData);
  const rawPhone = targetPhone || data.customer?.phone || '';
  const cleanPhone = cleanPhoneNumber(rawPhone);

  const baseUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

  window.open(baseUrl, '_blank');
};

/**
 * Generates an authentic binary PDF Blob from quotation data.
 * Tries html2pdf client-side first; falls back to backend Puppeteer endpoint.
 */
export const generateQuotationPdfBlob = async (rawData) => {
  const data = normalizeQuotationData(rawData);
  const html = buildQuotationHtml(rawData);
  const safeRef = (data.refNo || 'Mansara').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Quotation_${safeRef}.pdf`;

  // 1. Try client-side html2pdf
  try {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '794px';
    container.style.background = '#ffffff';
    container.style.zIndex = '-9999';
    container.innerHTML = html;
    document.body.appendChild(container);

    const opt = {
      margin: [6, 6, 6, 6],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const pdfBlob = await html2pdf().set(opt).from(container).outputPdf('blob');
    document.body.removeChild(container);

    if (pdfBlob && pdfBlob.size > 1000) {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      return { blob: pdfBlob, file, fileName, data };
    }
  } catch (clientErr) {
    console.warn('Client-side html2pdf generation encountered an issue, trying backend generator:', clientErr);
  }

  // 2. Fallback to backend Puppeteer endpoint
  try {
    const res = await axios.post('/field-sales/quotations/pdf', {
      html,
      quotationNo: safeRef
    }, {
      responseType: 'blob'
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const file = new File([blob], fileName, { type: 'application/pdf' });
    return { blob, file, fileName, data };
  } catch (backendErr) {
    console.error('Backend PDF generation also failed:', backendErr);
    // Ultimate fallback: generate HTML file blob if PDF conversion fails
    const fallbackBlob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const fallbackFile = new File([fallbackBlob], `Quotation_${safeRef}.html`, { type: 'text/html' });
    return { blob: fallbackBlob, file: fallbackFile, fileName: `Quotation_${safeRef}.html`, data };
  }
};

/**
 * Download Quotation directly as a .PDF file
 */
export const downloadQuotationPdf = async (rawData) => {
  const { blob, fileName } = await generateQuotationPdfBlob(rawData);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Share Quotation as an official PDF file directly to WhatsApp.
 * - On Mobile / Supported Desktop: uses Web Share API to attach the PDF file directly into WhatsApp!
 * - On Standard Desktop: automatically downloads the PDF and opens WhatsApp with an attached cover note.
 */
export const shareQuotationPdf = async (rawData, targetPhone = '', customNote = '') => {
  const { file, blob, fileName, data } = await generateQuotationPdfBlob(rawData);
  const rawPhone = targetPhone || data.customer?.phone || '';
  const cleanPhone = cleanPhoneNumber(rawPhone);

  const shareText = [
    `🏢 *MANSARA FOODS PVT. LTD.*`,
    `📋 *Commercial Price Quotation - ${data.refNo}*`,
    `👤 *Valued Partner:* ${data.customer?.name || 'Customer'}`,
    `💰 *Grand Total:* ₹${data.grandTotal.toLocaleString('en-IN')}`,
    `⏳ *Valid Until:* ${data.dueDateStr}`,
    customNote ? `\n💬 *Note:* ${customNote}` : null,
    `\n📎 *Please find attached the official PDF Quotation document.*`,
    `\n_Mansara Foods Pvt. Ltd. | Ph: ${data.company?.phone || '+91-88388 87064'}_`
  ].filter(Boolean).join('\n');

  // Check if Web Share API with File sharing is supported
  const canShareFiles = typeof navigator !== 'undefined' && 
    typeof navigator.canShare === 'function' && 
    navigator.canShare({ files: [file] });

  if (canShareFiles) {
    try {
      await navigator.share({
        files: [file],
        title: `Quotation ${data.refNo} - Mansara Foods`,
        text: shareText
      });
      return { success: true, method: 'web-share', fileName };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, aborted: true };
      }
      console.warn('Native share failed or dismissed, using WhatsApp link fallback:', err);
    }
  }

  // Desktop / Fallback method:
  // 1. Automatically download the PDF to user's device so it's ready to attach in 1 click
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // 2. Open WhatsApp chat with contact (or contact chooser) and cover note
  const waUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(shareText)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  window.open(waUrl, '_blank');

  return { success: true, method: 'download-and-open', fileName };
};
