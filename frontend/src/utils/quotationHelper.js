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
  gstNumber: '33AAUCM3644B1ZJ',
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

// String cleaner: strips null, undefined, and literal 'undefined' / 'null'
export const cleanStr = (val) => {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  if (s.toLowerCase() === 'undefined' || s.toLowerCase() === 'null') return '';
  return s;
};

let activeCompanySettingsCache = null;

export const setCompanySettingsCache = (settings) => {
  if (settings && typeof settings === 'object') {
    activeCompanySettingsCache = { ...DEFAULT_COMPANY_SETTINGS, ...settings };
  }
};

export const getCompanySettingsCache = () => activeCompanySettingsCache;

export const fetchActiveCompanySettings = async () => {
  if (activeCompanySettingsCache) return activeCompanySettingsCache;
  try {
    const res = await axios.get('/billing/settings');
    if (res.data?.success && res.data.data) {
      activeCompanySettingsCache = { ...DEFAULT_COMPANY_SETTINGS, ...res.data.data };
      return activeCompanySettingsCache;
    }
  } catch (e) {
    // Graceful fallback to default
  }
  return DEFAULT_COMPANY_SETTINGS;
};

/**
 * Normalizes quotation data from either PriceSimulator or FieldSales Quotation
 */
export const normalizeQuotationData = (raw = {}) => {
  const isSimulator = !!raw.calculationSummary;
  const company = {
    ...DEFAULT_COMPANY_SETTINGS,
    ...(activeCompanySettingsCache || {}),
    ...(raw.companySettings || raw.company || {})
  };
  const isApprovedInvoice = Boolean(
    raw.isInvoice || 
    raw.status === 'APPROVED' || 
    (raw.status === 'APPROVED' && raw.invoiceNo) || 
    (raw.invoiceNo && !raw.quotationRefNumber && !raw.quotationNo) ||
    raw.invoiceNumber
  );

  const getDerivedInvoiceNo = (quotationNo = '') => {
    if (!quotationNo) return 'INV-' + Date.now().toString().slice(-6);
    if (quotationNo.includes('QN')) return quotationNo.replace(/QN/g, 'INV');
    if (quotationNo.includes('qn')) return quotationNo.replace(/qn/g, 'inv');
    if (quotationNo.includes('QTN')) return quotationNo.replace(/QTN/g, 'INV');
    if (quotationNo.includes('qtn')) return quotationNo.replace(/qtn/g, 'inv');
    if (quotationNo.startsWith('QN-')) return quotationNo.replace('QN-', 'INV-');
    if (quotationNo.startsWith('QTN-')) return quotationNo.replace('QTN-', 'INV-');
    if (quotationNo.startsWith('QT-')) return quotationNo.replace('QT-', 'INV-');
    return `INV-${quotationNo}`;
  };

  const refNo = isApprovedInvoice 
    ? (raw.invoiceNo || raw.invoiceNumber || getDerivedInvoiceNo(raw.quotationRefNumber || raw.quotationNo)) 
    : (raw.quotationRefNumber || raw.quotationNo || `MF/QN/${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}/${Date.now().toString().slice(-5)}`);
  const dateStr = raw.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const dueDateStr = raw.dueDate || new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Customer resolution (checking selectedCustomer, customerId object, dealerId object, store object, dealer object, and direct fields)
  const rawCust = (raw.selectedCustomer && typeof raw.selectedCustomer === 'object') 
    ? raw.selectedCustomer 
    : ((raw.customer && typeof raw.customer === 'object') ? raw.customer : {});
  const rawStore = (raw.customerId && typeof raw.customerId === 'object') 
    ? raw.customerId 
    : ((raw.store && typeof raw.store === 'object') ? raw.store : {});
  const rawDealer = (raw.dealerId && typeof raw.dealerId === 'object') 
    ? raw.dealerId 
    : ((raw.dealer && typeof raw.dealer === 'object') ? raw.dealer : {});

  const resolvedName = cleanStr(
    rawCust.companyName || rawCust.name ||
    raw.customerName ||
    rawStore.name ||
    rawDealer.companyName || rawDealer.name ||
    raw.customClientName ||
    raw.storeName ||
    raw.dealerName
  ) || 'Valued Trade Partner';

  const resolvedPhone = cleanStr(
    rawCust.phone ||
    raw.customerPhone ||
    rawStore.phone ||
    rawDealer.phone
  );

  const resolvedAddress = cleanStr(
    rawCust.address ||
    raw.customerAddress ||
    rawStore.address ||
    rawDealer.address
  );

  const resolvedCity = cleanStr(
    rawCust.city ||
    raw.customerCity ||
    rawStore.city ||
    rawDealer.city
  );

  const resolvedState = cleanStr(
    rawCust.state ||
    raw.customerState ||
    rawStore.state ||
    rawDealer.state ||
    (resolvedCity || resolvedAddress ? 'Tamil Nadu' : '')
  );

  const resolvedPincode = cleanStr(
    rawCust.pincode ||
    raw.customerPincode ||
    rawStore.pincode ||
    rawDealer.pincode
  );

  const resolvedGst = cleanStr(
    rawCust.gstNumber ||
    raw.customerGst ||
    rawStore.gstNumber ||
    rawDealer.gstNumber
  );

  let customer = {
    name: resolvedName,
    phone: resolvedPhone,
    address: resolvedAddress,
    city: resolvedCity,
    state: resolvedState,
    pincode: resolvedPincode,
    gstNumber: resolvedGst
  };

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
    specialTerms: raw.specialTerms || raw.quotationNotes || company.invoiceTerms,
    isApprovedInvoice
  };
};

/**
 * Generate standard printable HTML for Quotation
 */
export const buildQuotationHtml = (rawData) => {
  const data = normalizeQuotationData(rawData);
  const { company, customer, refNo, dateStr, dueDateStr, items, subtotal, isWithGst, gstRate, totalGst, cgst, sgst, shipping, grandTotal, specialTerms, isApprovedInvoice } = data;
  const docTitle = isApprovedInvoice ? 'TAX INVOICE' : 'PRICE QUOTATION';
  const docNoLabel = isApprovedInvoice ? 'Invoice #' : 'Quotation #';
  const docDateLabel = isApprovedInvoice ? 'Invoice Date :' : 'Quotation Date :';
  const docDueLabel = isApprovedInvoice ? 'Due Date :' : 'Valid Until :';

  const billerName = company.companyName || company.name || 'MANSARA FOODS PVT. LTD.';
  const billerAddress = company.address || 'Flat No. B4, No.13, Balaji Nagar 1st street extn, Noombal';
  const billerCity = company.city || 'Chennai';
  const billerState = company.state || 'Tamil Nadu';
  const billerPin = company.pincode || company.pin || company.pinCode || '600077';
  const rawGst = company.gstNumber;
  const billerGst = (!rawGst || rawGst === '27AABCM1234F1Z5' || rawGst === '33AABCM1234F1Z5') ? '33AAUCM3644B1ZJ' : rawGst;
  const billerPhone = company.phone || '+91-88388 87064';
  const placeOfSupply = company.placeOfSupply || 'Tamil Nadu (33)';

  const rawBd = company.bankDetails || {};
  const bd = (rawBd.bankName && rawBd.accountNo) ? rawBd : {
    bankName: rawBd.bankName || 'HDFC Bank Ltd.',
    accountNo: rawBd.accountNo || '50200117036854',
    ifscCode: rawBd.ifscCode || 'HDFC0001947',
    branch: rawBd.branch || 'Iyyapanthangal Branch',
    accountType: rawBd.accountType || 'Current',
    upiId: rawBd.upiId || 'vyapar.175693710434@hdfcbank'
  };
  const signatoryTitle = company.signatoryTitle || 'Authorised Signatory';
  const signatoryName = company.signatoryName || 'Mansara Foods Pvt. Ltd.';

  const addrParts = [];
  if (billerAddress) addrParts.push(billerAddress.trim().replace(/,\s*$/, ''));
  if (billerCity && !billerAddress?.includes(billerCity)) addrParts.push(billerCity.trim());
  if (billerState && !billerAddress?.includes(billerState)) {
    if (billerPin && !billerAddress?.includes(billerPin)) {
      addrParts.push(`${billerState.trim()} - ${billerPin.trim()}`);
    } else {
      addrParts.push(billerState.trim());
    }
  } else if (billerPin && !billerAddress?.includes(billerPin)) {
    addrParts.push(billerPin.trim());
  }
  const formattedBillerAddress = addrParts.join(', ') + (addrParts.length ? '. India.' : '');

  const activeLogo = company.logoBase64 || company.logoUrl;
  let logoHtml = '';
  if (activeLogo) {
    const src = activeLogo.startsWith('data:') || activeLogo.startsWith('http')
      ? activeLogo
      : (activeLogo.startsWith('/') ? `${typeof window !== 'undefined' ? window.location.origin : ''}${activeLogo}` : `data:image/png;base64,${activeLogo}`);
    logoHtml = `<img src="${src}" style="max-height:65px;max-width:180px;object-fit:contain;" alt="${billerName}" />`;
  } else {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    logoHtml = `<img src="${origin}/logo.png" style="max-height:65px;max-width:180px;object-fit:contain;" onerror="this.style.display='none'" alt="${billerName}" />`;
  }

  const shipToName = cleanStr(customer.name) || 'Valued Trade Partner';
  const shipToAddr = cleanStr(customer.address);
  const shipToCity = cleanStr(customer.city);
  const shipToState = cleanStr(customer.state);
  const shipToPin = cleanStr(customer.pincode);
  const shipToGst = cleanStr(customer.gstNumber && customer.gstNumber !== 'N/A' ? customer.gstNumber : '');
  const shipToPhone = cleanStr(customer.phone);

  const customerAddrParts = [shipToAddr, shipToCity, shipToState, shipToPin]
    .map(cleanStr)
    .filter(Boolean);
  const formattedCustomerAddr = customerAddrParts.length > 0
    ? customerAddrParts.join(', ')
    : 'Commercial Delivery Consignment, Tamil Nadu, India';

  // Exact Mansara Dealer Format: S.NO | HSN | ITEM | NET WT (G) | RATE (RS.) | PAC | WT/ CTN (KG) | CTNS | TOT. QTY | TOTAL NT WT (KG) | PRICE
  const itemsRows = items.map((item, idx) => {
    const productName = item.name || 'Product';
    const hsn = item.hsn || '1901';
    const netWtG = item.netWtG || 250;
    const pac = item.pacSize || 24;
    const wtPerCtn = item.wtPerCtn || ((netWtG * pac) / 1000).toFixed(2);
    const ctns = item.cartons !== undefined ? item.cartons : (item.quantity ? parseFloat((item.quantity / pac).toFixed(2)) : 0);
    const totQty = item.quantity || 0;
    const totalNtWtKg = item.totalNetWtKg || ((totQty * netWtG) / 1000).toFixed(2);
    const rate = Number(item.rate || 0);
    const lineTotal = Number(item.lineTotal || (rate * totQty));

    return `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-align:center;">${hsn}</td>
        <td style="text-align:left;padding-left:6px;">${productName}</td>
        <td style="text-align:center;">${netWtG}</td>
        <td style="text-align:right;padding-right:6px;">${rate.toFixed(1)}</td>
        <td style="text-align:center;">${pac}</td>
        <td style="text-align:center;">${wtPerCtn}</td>
        <td style="text-align:center;">${ctns}</td>
        <td style="text-align:center;">${totQty}</td>
        <td style="text-align:center;">${totalNtWtKg}</td>
        <td style="text-align:right;font-weight:600;padding-right:6px;">${lineTotal.toFixed(2)}</td>
      </tr>`;
  }).join('');

  // Empty rows for spacing (exact dealer invoice count)
  const emptyRowsCount = Math.max(0, 9 - items.length);
  const emptyRows = Array(emptyRowsCount).fill(0).map(() =>
    `<tr><td colspan="11" style="height:22px;border-bottom:1px solid #eee;">&nbsp;</td></tr>`
  ).join('');

  const originalTotal = subtotal + (isWithGst ? (cgst + sgst) : 0) + shipping;
  const discount = 0;
  const grandRounded = Math.round(grandTotal);

  const defaultTerms = isApprovedInvoice
    ? `1. Payment within 15 days from invoice date.<br>2. Interest @ 2% per month on delayed payment.<br>3. Goods once sold cannot be returned unless transit damage is reported upon receipt.`
    : `1. Quotation valid for 15 days from issue date.<br>2. Wholesale pricing is contingent upon order quantities and margin tiers selected.<br>3. Goods once sold cannot be returned unless transit damage is reported upon receipt.`;
  const rawTerms = specialTerms || company.invoiceTerms;
  const terms = rawTerms
    ? rawTerms.split('\n').filter(Boolean).map((t, i) => `${i + 1}. ${t.replace(/^\d+\.\s*/, '')}`).join('<br>')
    : defaultTerms;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${isApprovedInvoice ? 'Tax Invoice' : 'Quotation'} ${refNo}</title>
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
  .inv-meta-cell { width: 220px; padding: 10px 14px; text-align: right; }
  .company-name { font-size: 15px; font-weight: 900; color: #D6295A; text-transform: uppercase; margin-bottom: 3px; line-height: 1.2; }
  .company-addr { font-size: 9.5px; color: #333; line-height: 1.5; }
  .gst-row { font-size: 10px; font-weight: 700; color: #1a1a1a; margin-top: 4px; display: inline-block; }
  .inv-title { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; text-align: right; text-transform: uppercase; }
  .meta-line { font-size: 10px; color: #333; display: flex; justify-content: space-between; margin-bottom: 2px; }
  .meta-line strong { color: #1a1a1a; font-weight: 700; }

  .bill-ship-row { display: flex; border-bottom: 1.5px solid #ccc; }
  .bill-cell { flex: 1; padding: 8px 14px; border-right: 1.5px solid #ccc; }
  .ship-cell { flex: 1; padding: 8px 14px; }
  .section-hdr { font-size: 9px; font-weight: 900; text-transform: uppercase; background: #D6295A; color: #fff; padding: 3px 8px; margin-bottom: 6px; letter-spacing: 0.5px; }
  .bill-name { font-size: 12px; font-weight: 700; margin-bottom: 3px; color: #1a1a1a; }
  .bill-addr { font-size: 9.5px; color: #333; line-height: 1.5; }
  .gstin-line { font-size: 9.5px; font-weight: 700; margin-top: 3px; color: #1a1a1a; }

  .items-table { width: 100%; border-collapse: collapse; border-bottom: 1.5px solid #ccc; }
  .items-table th {
    background: #D6295A; color: #fff; font-size: 8.5px; font-weight: 700;
    text-transform: uppercase; padding: 6px 3px; text-align: center;
    border-right: 1px solid rgba(255,255,255,0.3);
    letter-spacing: 0.3px; vertical-align: middle; line-height: 1.2;
  }
  .items-table th:last-child { border-right: none; }
  .items-table td { padding: 5px 4px; border-bottom: 1px solid #eee; font-size: 10px; color: #1a1a1a; }

  .bottom-container { display: flex; border-bottom: 1.5px solid #ccc; }
  .bottom-left { flex: 1; border-right: 1.5px solid #ccc; display: flex; flex-direction: column; }
  .words-cell { flex: 1; padding: 10px 14px; border-bottom: 1px solid #ccc; display: flex; flex-direction: column; justify-content: center; }
  .words-label { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #1a1a1a; margin-bottom: 4px; letter-spacing: 0.3px; }
  .words-text { font-size: 10px; font-weight: 700; color: #1a1a1a; text-transform: uppercase; line-height: 1.4; }

  .payment-cell { flex: 1; padding: 10px 14px; border-bottom: 1px solid #ccc; display: flex; flex-direction: column; justify-content: center; }
  .pay-label { font-size: 9px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; color: #1a1a1a; }
  .pay-info { font-size: 9.5px; color: #444; font-style: italic; }

  .terms-cell { flex: 1; padding: 10px 14px; display: flex; flex-direction: column; justify-content: center; }
  .terms-label { font-size: 9px; font-weight: 900; text-decoration: underline; margin-bottom: 4px; color: #1a1a1a; }
  .terms-text { font-size: 9.5px; color: #333; line-height: 1.5; }

  .bottom-right { width: 280px; display: flex; flex-direction: column; }
  .totals-table { width: 100%; border-collapse: collapse; }
  .totals-table td { padding: 3px 10px; font-size: 10px; }
  .totals-table .t-label { text-align: right; color: #333; }
  .totals-table .t-value { text-align: right; font-weight: 600; width: 85px; border-left: 1px solid #eee; }
  .totals-table .grand-row td { background: #D6295A; color: #fff; font-weight: 700; font-size: 11px; padding: 5px 10px; }

  .account-details-block { padding: 7px 12px; border-bottom: 1px solid #ccc; background: #fafafa; }
  .account-header { font-weight: 700; font-size: 9.5px; text-decoration: underline; margin-bottom: 3px; color: #1a1a1a; }
  .bank-table { width: 100%; border-collapse: collapse; }
  .bank-table td { font-size: 9px; padding: 1.5px 0; color: #222; }
  .bank-table td:first-child { font-weight: 700; padding-right: 6px; width: 68px; color: #555; }

  .sig-section { padding: 8px 14px 10px 14px; text-align: right; margin-top: auto; }
  .sig-company { font-size: 10px; font-weight: 700; font-style: italic; color: #D6295A; }
  .sig-name { font-size: 10px; font-style: italic; color: #333; margin-top: 20px; margin-bottom: 2px; }
  .sig-title { font-size: 9px; color: #555; }
  .sig-line { font-size: 9px; font-weight: 700; text-decoration: underline; margin-top: 2px; color: #1a1a1a; }
  .footer-strip { padding: 6px 14px; text-align: center; font-size: 8.5px; color: #555; background: #f9f9f9; line-height: 1.5; }
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
        ${formattedBillerAddress}<br>
        Phone : ${billerPhone}<br>
        <span class="gst-row">GST No. ${billerGst}</span>
      </div>
    </div>
    <div class="inv-meta-cell">
      <div class="inv-title">${docTitle}</div>
      <div class="meta-line"><span>${docNoLabel}</span><strong>${refNo}</strong></div>
      <div class="meta-line"><span>${docDateLabel}</span><strong>${dateStr}</strong></div>
      <div class="meta-line"><span>${docDueLabel}</span><strong>${dueDateStr}</strong></div>
      <div class="meta-line" style="margin-top:6px;">
        <span>Place of Supply :</span><strong>${placeOfSupply}</strong>
      </div>
    </div>
  </div>

  <!-- ── Bill To / Ship To ─────────────────────────────────────────────── -->
  <div class="bill-ship-row">
    <div class="bill-cell">
      <div class="section-hdr">BILL TO</div>
      <div class="bill-name">${shipToName}</div>
      <div class="bill-addr">
        ${formattedCustomerAddr}<br>
        ${shipToPhone ? 'PH. ' + shipToPhone : ''}
      </div>
      ${shipToGst ? `<div class="gstin-line">GSTIN: ${shipToGst}</div>` : ''}
    </div>
    <div class="ship-cell">
      <div class="section-hdr">SHIP TO</div>
      <div class="bill-name">${shipToName}</div>
      <div class="bill-addr">
        ${formattedCustomerAddr}<br>
        ${shipToPhone ? 'PH. ' + shipToPhone : ''}
      </div>
    </div>
  </div>

  <!-- ── Items Table (Exact Dealer Invoice 11-column format) ───────────── -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:4%;">S.NO</th>
        <th style="width:6%;">HSN</th>
        <th style="width:28%;text-align:left;padding-left:6px;">ITEM</th>
        <th style="width:7%;">NET WT<br>(G)</th>
        <th style="width:8%;text-align:right;padding-right:6px;">RATE<br>(RS.)</th>
        <th style="width:5%;">PAC</th>
        <th style="width:8%;">WT/ CTN<br>(KG)</th>
        <th style="width:6%;">CTNS</th>
        <th style="width:7%;">TOT.<br>QTY</th>
        <th style="width:9%;">TOTAL NT<br>WT (KG)</th>
        <th style="width:12%;text-align:right;padding-right:6px;">PRICE</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
      ${emptyRows}
    </tbody>
  </table>

  <!-- ── Bottom Summary & Details ──────────────────────────────────────── -->
  <div class="bottom-container">
    <div class="bottom-left">
      <div class="words-cell">
        <div class="words-label">TOTAL AMOUNT IN WORDS:</div>
        <div class="words-text">${numberToWords(grandRounded)}</div>
      </div>
      <div class="payment-cell">
        <div class="pay-label">MODE OF PAYMENT (DETAILS):</div>
        <div class="pay-info">Cheque / Demand Draft / NEFT / RTGS / Online Transfer / UPI</div>
      </div>
      <div class="terms-cell">
        <div class="terms-label">Terms &amp; Conditions:</div>
        <div class="terms-text">${terms}</div>
      </div>
    </div>

    <div class="bottom-right">
      <table class="totals-table">
        <tr><td class="t-label">Sub Total<br><span style="font-size:8px;color:#777;">(Without Tax)</span></td><td class="t-value">${subtotal.toFixed(2)}</td></tr>
        ${isWithGst ? `
        <tr><td class="t-label">CGST (${(gstRate / 2).toFixed(1).replace(/\.0$/, '')}%)</td><td class="t-value">${cgst.toFixed(2)}</td></tr>
        <tr><td class="t-label">SGST (${(gstRate / 2).toFixed(1).replace(/\.0$/, '')}%)</td><td class="t-value">${sgst.toFixed(2)}</td></tr>
        ` : `<tr><td class="t-label">GST</td><td class="t-value">0.00</td></tr>`}
        ${shipping > 0 ? `<tr><td class="t-label">Shipping</td><td class="t-value">${shipping.toFixed(2)}</td></tr>` : ''}
        <tr><td class="t-label">Original Amount</td><td class="t-value">${originalTotal.toFixed(2)}</td></tr>
        ${discount > 0 ? `<tr><td class="t-label" style="color:#d97706;">Discount</td><td class="t-value" style="color:#d97706;">- ${discount.toFixed(2)}</td></tr>` : ''}
        <tr class="grand-row"><td class="t-label" style="color:#fff;">Amount To be Paid</td><td class="t-value" style="color:#fff;border-left:1px solid rgba(255,255,255,0.3);">${grandRounded}</td></tr>
      </table>

      <!-- Under Amount To be Paid: Account Details -->
      <div class="account-details-block">
        <div class="account-header">Account Details:</div>
        <table class="bank-table">
          ${billerName ? `<tr><td colspan="2" style="font-weight:700;padding-bottom:2px;color:#D6295A;font-size:9.5px;">${billerName}</td></tr>` : ''}
          ${bd.accountNo ? `<tr><td>A/C No.</td><td>${bd.accountNo}</td></tr>` : ''}
          ${bd.ifscCode  ? `<tr><td>IFSC Code :</td><td style="font-weight:700;">${bd.ifscCode}</td></tr>` : ''}
          ${bd.bankName  ? `<tr><td>Bank :</td><td>${bd.bankName}${bd.branch ? ', ' + bd.branch : ''}</td></tr>` : ''}
          ${bd.accountType ? `<tr><td>Type :</td><td>${bd.accountType}</td></tr>` : ''}
          ${bd.upiId ? `<tr><td>UPI ID:</td><td>${bd.upiId}</td></tr>` : ''}
        </table>
      </div>

      <!-- Under Account Details: Signature -->
      <div class="sig-section">
        <div class="sig-company">For ${billerName}..</div>
        <div class="sig-name">${signatoryName}</div>
        <div class="sig-title">${signatoryTitle}</div>
        <div class="sig-line">Authorized signature</div>
      </div>
    </div>
  </div>

  <!-- ── Footer Strip ──────────────────────────────────────────────────── -->
  <div class="footer-strip">
    Regd. Office &amp; Operations : ${formattedBillerAddress}. Ph: ${billerPhone}. |
    CIN- ${company.cin || 'U10790TN2026PTC188398'} | Email: ${company.email || 'contact@mansarafoods.com'} | Website: ${company.website || 'www.mansarafoods.com'}
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
  const { company, customer, refNo, dateStr, dueDateStr, items, subtotal, isWithGst, gstRate, totalGst, shipping, grandTotal, isApprovedInvoice } = data;
  const bd = company.bankDetails || {};

  const itemsList = items.map((it, idx) => {
    return `${idx + 1}. *${it.name}*
   • Order Qty: *${it.quantity} pcs* (${it.cartons} ctn)
   • MRP: ₹${Number(it.mrp || 0).toFixed(2)} | Margin: ${it.marginPct || 0}%
   • Wholesale Rate: *₹${Number(it.rate).toFixed(2)}/pc*
   • Line Total: *₹${Number(it.lineTotal).toLocaleString('en-IN')}*`;
  }).join('\n\n');

  const docTitle = isApprovedInvoice ? 'OFFICIAL TAX INVOICE' : 'OFFICIAL COMMERCIAL QUOTATION';
  const docRefLabel = isApprovedInvoice ? 'Invoice No' : 'Quotation Ref';
  const docDateLabel = isApprovedInvoice ? 'Invoice Date' : 'Date';
  const docDueLabel = isApprovedInvoice ? 'Due Date' : 'Valid Until';

  const textLines = [
    `*========================================*`,
    `🏢 *MANSARA FOODS PVT. LTD.*`,
    `📋 *${docTitle}*`,
    `*========================================*`,
    `🔖 *${docRefLabel}:* ${refNo}`,
    `📅 *${docDateLabel}:* ${dateStr}`,
    `⏳ *${docDueLabel}:* ${dueDateStr}`,
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
    isApprovedInvoice 
      ? `1. Payment within 15 days from invoice date.\n2. Interest @ 2% per month on overdue payment.\n3. Goods once sold cannot be returned unless transit damage is reported upon receipt.`
      : `1. Quotation is valid for 15 days from issue date.\n2. Wholesale rates are subject to confirmed order quantities.\n3. Dispatched within 24-48 hours upon order confirmation.`,
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
 * Generates an authentic binary PDF Blob from quotation or approved invoice data.
 * Tries html2pdf client-side first; falls back to backend Puppeteer endpoint.
 */
export const generateQuotationPdfBlob = async (rawData) => {
  if (!rawData.companySettings && !rawData.company && !activeCompanySettingsCache) {
    try {
      await fetchActiveCompanySettings();
    } catch (e) {
      // ignore
    }
  }
  const data = normalizeQuotationData(rawData);
  const html = buildQuotationHtml(rawData);
  const safeRef = (data.refNo || 'Mansara').replace(/[^a-zA-Z0-9_-]/g, '_');
  const prefix = data.isApprovedInvoice ? 'Invoice' : 'Quotation';
  const fileName = `${prefix}_${safeRef}.pdf`;

  // 1. Try client-side html2pdf
  try {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '820px';
    container.style.background = '#ffffff';
    container.style.zIndex = '-9999';
    container.innerHTML = html;
    document.body.appendChild(container);

    const img = container.querySelector('img');
    if (img && !img.complete) {
      await new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 600);
      });
    }

    const opt = {
      margin: [4, 4, 4, 4],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const targetElement = container.querySelector('.outer') || container;
    const pdfBlob = await html2pdf().set(opt).from(targetElement).outputPdf('blob');
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
      quotationNo: safeRef,
      isInvoice: data.isApprovedInvoice,
      invoiceNo: safeRef
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
    const fallbackFile = new File([fallbackBlob], `${prefix}_${safeRef}.html`, { type: 'text/html' });
    return { blob: fallbackBlob, file: fallbackFile, fileName: `${prefix}_${safeRef}.html`, data };
  }
};

/**
 * Download Quotation / Invoice directly as a .PDF file
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
 * Share Quotation / Invoice as an official PDF file directly to WhatsApp.
 * - On Mobile / Supported Desktop: uses Web Share API to attach the PDF file directly into WhatsApp!
 * - On Standard Desktop: automatically downloads the PDF and opens WhatsApp with an attached cover note.
 */
export const shareQuotationPdf = async (rawData, targetPhone = '', customNote = '') => {
  const { file, blob, fileName, data } = await generateQuotationPdfBlob(rawData);
  const rawPhone = targetPhone || data.customer?.phone || '';
  const cleanPhone = cleanPhoneNumber(rawPhone);
  const isInvoice = data.isApprovedInvoice;
  const docTypeLabel = isInvoice ? 'Official Tax Invoice' : 'Commercial Price Quotation';
  const docName = isInvoice ? 'Invoice' : 'Quotation';

  const shareText = [
    `🏢 *MANSARA FOODS PVT. LTD.*`,
    `📋 *${docTypeLabel} - ${data.refNo}*`,
    `👤 *Valued Partner:* ${data.customer?.name || 'Customer'}`,
    `💰 *Grand Total:* ₹${data.grandTotal.toLocaleString('en-IN')}`,
    `⏳ *${isInvoice ? 'Due Date' : 'Valid Until'}:* ${data.dueDateStr}`,
    customNote ? `\n💬 *Note:* ${customNote}` : null,
    `\n📎 *Please find attached the official PDF ${docName} document.*`,
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
        title: `${docName} ${data.refNo} - Mansara Foods`,
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
