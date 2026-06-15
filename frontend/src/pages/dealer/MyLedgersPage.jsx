// src/pages/dealer/MyLedgersPage.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Receipt, 
  Download, 
  Eye, 
  Store, 
  Calendar,
  X,
  FileText,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Check
} from 'lucide-react';

export default function MyLedgersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Tab state: 'invoices' | 'transfers'
  const [activeTab, setActiveTab] = useState('invoices');

  // Invoices state
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Transfers/Shipments state
  const [transfers, setTransfers] = useState([]);
  const [transfersLoading, setTransfersLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyTransfer, setVerifyTransfer] = useState(null);
  const [verifyItems, setVerifyItems] = useState([]);
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    // Read state or query parameter for tab selection
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    } else if (location.pathname.includes('transfers')) {
      setActiveTab('transfers');
    } else if (location.pathname.includes('invoices')) {
      setActiveTab('invoices');
    }
    
    fetchInvoices();
    fetchTransfers();
  }, [location]);

  useEffect(() => {
    if (location.state?.transferId) {
      setHighlightedId(location.state.transferId);
      setActiveTab('transfers');
      setTimeout(() => {
        const element = document.getElementById(`transfer-${location.state.transferId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [location.state]);

  const fetchInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const res = await axios.get('/billing');
      const invoiceData = res.data.data || [];
      setInvoices(invoiceData);
      
      // Auto-open if redirected with an invoiceId in state
      if (location.state?.invoiceId) {
        const found = invoiceData.find(inv => inv.id === location.state.invoiceId);
        if (found) {
          setSelectedInvoice(found);
          setShowDetailModal(true);
        }
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const fetchTransfers = async () => {
    setTransfersLoading(true);
    try {
      const res = await axios.get('/inventory/transfers');
      setTransfers(res.data.data || []);
    } catch (err) {
      console.error('Error fetching transfers:', err);
    } finally {
      setTransfersLoading(false);
    }
  };

  const triggerClientSidePrint = (invoice) => {
    const company = {
      name: 'Mansara Foods Pvt. Ltd.',
      gstNumber: '27AABCM1234F1Z5',
      address: 'Mumbai, Maharashtra, India',
      phone: '+91 98765 43210',
      email: 'info@mansarafoods.com'
    };

    const isRetail = !!invoice.store;
    let logoHtml = '';
    if (isRetail) {
      if (invoice.dealer && invoice.dealer.logoBase64) {
        const src = invoice.dealer.logoBase64.startsWith('data:') 
          ? invoice.dealer.logoBase64 
          : `data:image/png;base64,${invoice.dealer.logoBase64}`;
        logoHtml = `<img src="${src}" style="height: 55px; width: auto; object-fit: contain; margin-bottom: 8px;" alt="${invoice.dealer.companyName}" />`;
      } else {
        logoHtml = `<div style="font-size: 24px; font-weight: 800; color: #B84A26; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">${invoice.dealer ? invoice.dealer.companyName : ''}</div>`;
      }
    } else {
      logoHtml = `<div style="font-size: 24px; font-weight: 800; color: #B84A26; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">${company.name}</div>`;
    }

    const itemsRows = invoice.items.map((item, idx) => {
      const qty = parseInt(item.quantity);
      const unitPrice = parseFloat(item.unitPrice);
      const margin = parseFloat(item.marginPct);
      const sellingPrice = parseFloat(item.sellingPrice || (unitPrice * (1 + margin / 100)));
      const gstPct = parseFloat(item.gstPercent || item.product?.gstPercent || 5);
      const lineTotal = parseFloat(item.lineTotal);

      return `
        <tr>
          <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #F5EFE6; color: #61220F;">${idx + 1}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #F5EFE6;">
            <div style="font-weight: 600; color: #36302E;">${item.product?.name || 'Product'}</div>
            <div style="font-size: 10px; color: #812F16; font-weight: 500;">SKU: ${item.product?.sku || 'N/A'} | HSN: ${item.product?.hsnCode || '1901'}</div>
          </td>
          <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #F5EFE6; font-weight: 600;">${qty} ${item.product?.unit || 'PCS'}</td>
          <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #F5EFE6;">₹${unitPrice.toFixed(2)}</td>
          <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #F5EFE6; color: #B84A26; font-weight: 600;">${margin}%</td>
          <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #F5EFE6; font-weight: 600;">₹${sellingPrice.toFixed(2)}</td>
          <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #F5EFE6; color: #812F16;">${gstPct}%</td>
          <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #F5EFE6; font-weight: 700; color: #61220F;">₹${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const dateStr = new Date(invoice.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${invoice.invoiceNo}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Outfit', 'Inter', sans-serif;
            color: #36302E;
            margin: 40px;
            font-size: 12px;
            line-height: 1.4;
          }
          .invoice-box {
            max-width: 800px;
            margin: auto;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }
          .header-table td {
            vertical-align: top;
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
            background-color: #FAF8F5;
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
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .items-table th {
            background-color: #B84A26;
            color: white;
            font-weight: 700;
            text-align: left;
            padding: 10px 8px;
            font-size: 10px;
            text-transform: uppercase;
          }
          .totals-table {
            width: 45%;
            margin-left: 55%;
            border-collapse: collapse;
            border: 1px solid #EBE3D5;
            border-radius: 8px;
          }
          .totals-table td {
            padding: 7px 12px;
            font-size: 11px;
          }
          .grand-total {
            background-color: #B84A26;
            color: white;
            font-weight: 700;
            font-size: 14px;
          }
          .terms-section {
            margin-top: 35px;
            font-size: 10px;
            color: #61220F;
            background-color: #FAF8F5;
            border-left: 3px solid #B84A26;
            padding: 10px 15px;
            border-radius: 4px;
          }
          .sig-line {
            border-top: 1.5px solid #61220F;
            margin-top: 55px;
            padding-top: 6px;
            font-weight: 600;
            color: #61220F;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <table class="header-table">
            <tr>
              <td>
                <div class="logo-container">
                  ${logoHtml}
                  <div style="font-size: 11px; color: #61220F; line-height: 1.5; margin-top: 5px;">
                    ${isRetail && invoice.dealer ? `
                      <strong>GSTIN:</strong> ${invoice.dealer.gstNumber || 'N/A'}<br>
                      <strong>Tel:</strong> ${invoice.dealer.phone || 'N/A'}
                    ` : `
                      <strong>GSTIN:</strong> ${company.gstNumber}<br>
                      <strong>Tel:</strong> ${company.phone} | <strong>Email:</strong> ${company.email}
                    `}
                  </div>
                </div>
              </td>
              <td class="invoice-title-sec">
                <h2 class="invoice-title">TAX INVOICE</h2>
                <div style="margin-top: 10px; font-size: 11px; line-height: 1.6;">
                  <strong>Invoice No:</strong> ${invoice.invoiceNo}<br>
                  <strong>Date:</strong> ${dateStr}<br>
                  <strong>Payment Mode:</strong> Cash / NetBanking
                </div>
              </td>
            </tr>
          </table>

          <div class="divider"></div>

          <table class="info-table">
            <tr>
              <td style="padding-left: 0;">
                <div class="info-card">
                  <div class="section-title">${invoice.store ? 'Billed By (Distributor)' : 'Billed By (Manufacturer)'}</div>
                  <div style="font-size: 11px; line-height: 1.5; color: #36302E;">
                    <strong>${invoice.store ? invoice.dealer?.companyName : company.name}</strong><br>
                    ${invoice.store ? invoice.dealer?.address : company.address}<br>
                    <strong>GSTIN:</strong> ${invoice.store ? (invoice.dealer?.gstNumber || 'N/A') : company.gstNumber}<br>
                    <strong>Contact:</strong> ${invoice.store ? invoice.dealer?.phone : company.phone}
                  </div>
                </div>
              </td>
              <td style="padding-right: 0;">
                <div class="info-card">
                  <div class="section-title">${invoice.store ? 'Billed To (Customer Store)' : 'Billed To (Dealer Partner)'}</div>
                  <div style="font-size: 11px; line-height: 1.5; color: #36302E;">
                    <strong>${invoice.store ? invoice.store.name : invoice.dealer?.companyName}</strong><br>
                    ${invoice.store ? invoice.store.address : invoice.dealer?.address}<br>
                    <strong>GSTIN:</strong> ${invoice.store ? (invoice.store.gstNumber || 'N/A') : (invoice.dealer?.gstNumber || 'N/A')}<br>
                    <strong>Contact:</strong> ${invoice.store ? (invoice.store.phone || 'N/A') : invoice.dealer?.phone}
                  </div>
                </div>
              </td>
            </tr>
          </table>

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

          <table class="totals-table">
            <tr>
              <td style="padding: 7px 12px;">Subtotal:</td>
              <td style="text-align: right; font-weight: 600; padding: 7px 12px;">₹${parseFloat(invoice.subtotal).toFixed(2)}</td>
            </tr>
            ${invoice.isGstEnabled !== false ? `
              <tr>
                <td style="padding: 7px 12px;">CGST:</td>
                <td style="text-align: right; font-weight: 500; padding: 7px 12px;">₹${((invoice.cgst !== undefined ? parseFloat(invoice.cgst) : (parseFloat(invoice.totalGst) / 2)) || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 7px 12px;">SGST:</td>
                <td style="text-align: right; font-weight: 500; padding: 7px 12px;">₹${((invoice.sgst !== undefined ? parseFloat(invoice.sgst) : (parseFloat(invoice.totalGst) / 2)) || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="font-weight: 600; padding: 7px 12px;">Total GST:</td>
                <td style="text-align: right; font-weight: 600; color: #B84A26; padding: 7px 12px;">₹${parseFloat(invoice.totalGst).toFixed(2)}</td>
              </tr>
            ` : `
              <tr>
                <td style="padding: 7px 12px;">GST:</td>
                <td style="text-align: right; font-weight: 500; color: #812F16; padding: 7px 12px;">₹0.00</td>
              </tr>
            `}
            ${invoice.shippingCharges && parseFloat(invoice.shippingCharges) > 0 ? `
              <tr>
                <td style="padding: 7px 12px;">Shipping Charges:</td>
                <td style="text-align: right; font-weight: 500; padding: 7px 12px;">₹${parseFloat(invoice.shippingCharges).toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr class="grand-total">
              <td style="padding: 9px 12px; color: white;">Grand Total:</td>
              <td style="text-align: right; padding: 9px 12px; color: white;">₹${parseFloat(invoice.totalAmount).toFixed(2)}</td>
            </tr>
          </table>

          <div class="terms-section">
            <strong>Terms & Conditions:</strong><br>
            1. Goods once sold will not be taken back.<br>
            2. Interest at 18% p.a. will be charged for delayed payments after due date.
          </div>

          <table style="width: 100%; margin-top: 40px;">
            <tr>
              <td>
                <div style="width: 200px;">
                  <div class="sig-line">Customer Signature</div>
                </div>
              </td>
              <td style="text-align: right;">
                <div style="width: 220px; margin-left: auto;">
                  <div style="font-weight: bold; color: #61220F; text-align: center;">For ${invoice.store ? invoice.dealer?.companyName : company.name}</div>
                  <div class="sig-line">Authorized Signatory</div>
                </div>
              </td>
            </tr>
          </table>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPdf = async (invoice) => {
    try {
      const response = await axios.get(`/billing/${invoice.id}/pdf`, {
        responseType: 'blob'
      });
      
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `Invoice_${invoice.invoiceNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn('PDF download failed, falling back to browser print:', err);
      triggerClientSidePrint(invoice);
    }
  };

  const openInvoiceDetails = (inv) => {
    setSelectedInvoice(inv);
    setShowDetailModal(true);
  };

  // Close Invoice (mark as CLOSED and deduct stock)
  const handleCloseInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to close this invoice? This will deduct quantities from your local stock and set the status to CLOSED.')) {
      return;
    }
    setActionLoading(true);
    try {
      await axios.patch(`/billing/${invoiceId}/close`);
      alert('Invoice closed successfully, local stock updated.');
      setShowDetailModal(false);
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close invoice. Ensure you have sufficient stock.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Invoice (if still OPEN)
  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to permanently delete this OPEN invoice?')) {
      return;
    }
    setActionLoading(true);
    try {
      await axios.delete(`/billing/${invoiceId}`);
      alert('Invoice deleted successfully.');
      setShowDetailModal(false);
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  // Warehouse Verification Checklist
  const openVerifyModal = (transfer) => {
    setVerifyTransfer(transfer);
    const initialItems = transfer.items.map(it => ({
      productId: it.productId.toString(),
      name: it.product?.name || 'Unknown',
      sku: it.product?.sku || 'N/A',
      shippedQty: it.quantity,
      unit: it.product?.unit || 'PCS',
      isVerified: true,
      receivedQuantity: it.quantity,
      discrepancyComment: ''
    }));
    setVerifyItems(initialItems);
    setShowVerifyModal(true);
  };

  const handleVerifyItemChange = (productId, field, value) => {
    setVerifyItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const updated = { ...item, [field]: value };
        if (field === 'isVerified' && value) {
          updated.receivedQuantity = item.shippedQty;
          updated.discrepancyComment = '';
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    if (!verifyTransfer) return;

    const itemsWithIssues = verifyItems.filter(it => !it.isVerified || it.receivedQuantity < it.shippedQty);
    const invalidItem = itemsWithIssues.find(it => it.receivedQuantity !== it.shippedQty && !it.discrepancyComment.trim());
    
    if (invalidItem) {
      alert(`Please add a comment explaining the issue for: ${invalidItem.name}`);
      return;
    }

    setVerifyLoading(true);
    const hasAnyDiscrepancy = itemsWithIssues.length > 0;
    const finalStatus = hasAnyDiscrepancy ? 'DISCREPANCY' : 'DELIVERED';

    try {
      await axios.patch(`/inventory/transfers/${verifyTransfer.id}/status`, {
        status: finalStatus,
        items: verifyItems.map(it => ({
          productId: it.productId,
          receivedQuantity: parseInt(it.receivedQuantity),
          hasDiscrepancy: !it.isVerified || it.receivedQuantity < it.shippedQty,
          discrepancyComment: it.discrepancyComment
        }))
      });
      setShowVerifyModal(false);
      setVerifyTransfer(null);
      setVerifyItems([]);
      fetchTransfers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit shipment verification');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Ledgers & Shipments</h2>
          <p className="text-slate-500 text-xs">Verify past tax invoices generated, check store breakdowns, and track stock transfers from the warehouse.</p>
        </div>
      </div>

      {/* Elegant tab navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-3 px-6 text-xs font-black tracking-wider uppercase border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'invoices'
              ? 'border-rose-600 text-rose-700 font-extrabold'
              : 'border-transparent text-slate-550 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Retail Store Invoices</span>
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`py-3 px-6 text-xs font-black tracking-wider uppercase border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'transfers'
              ? 'border-rose-600 text-rose-700 font-extrabold'
              : 'border-transparent text-slate-550 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Warehouse Shipments</span>
        </button>
      </div>

      {/* Tabs Content */}
      {activeTab === 'invoices' ? (
        // INVOICES LEDGER TAB
        invoicesLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
          </div>
        ) : (
          <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[700px] sm:min-w-0">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-550 font-bold uppercase tracking-wider">
                    <th className="p-4">Invoice No / Date</th>
                    <th className="p-4">Retail Outlet Store</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Subtotal</th>
                    <th className="p-4 text-right">Shipping Charges</th>
                    <th className="p-4 text-right">Invoice Amount</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">
                        No retail store invoices generated yet.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="p-4">
                          <div>
                            <div className="flex items-center flex-wrap gap-1">
                              <span className="font-black text-slate-800 text-xs">{inv.invoiceNo}</span>
                              {inv.isCredit && (
                                <span className="text-[8px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded uppercase tracking-wide">
                                  Credit
                                </span>
                              )}
                              {inv.isCredit && inv.status === 'OPEN' && (new Date(inv.createdAt) <= (() => {
                                const d = new Date();
                                d.setDate(d.getDate() - 15);
                                return d;
                              })()) && (
                                <span className="text-[8px] font-black text-amber-700 bg-amber-50 border border-amber-250 border-amber-200 px-1.5 py-0.2 rounded uppercase tracking-wide animate-pulse">
                                  ⚠️ Follow-up Alert
                                </span>
                              )}
                            </div>
                            <span className="block text-[9px] text-slate-400 font-medium mt-0.5">
                              {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric'
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Store className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="font-bold text-slate-700">{inv.store?.name || 'B2B Warehouse Direct'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                            inv.status === 'CLOSED' ? 'bg-emerald-50 text-emerald-700' :
                            inv.status === 'OPEN' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-700'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-4 text-right font-medium text-slate-600">₹{parseFloat(inv.subtotal).toFixed(2)}</td>
                        <td className="p-4 text-right font-medium text-slate-500">₹{parseFloat(inv.shippingCharges || 0).toFixed(2)}</td>
                        <td className="p-4 text-right font-black text-rose-600">₹{parseFloat(inv.totalAmount).toFixed(2)}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => openInvoiceDetails(inv)}
                              className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-800 flex items-center cursor-pointer"
                              title="View Breakdown Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(inv)}
                              className="p-1.5 hover:bg-rose-50 border border-rose-100 rounded-lg text-rose-600 flex items-center cursor-pointer"
                              title="Print PDF Invoice"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            {inv.status === 'OPEN' && (
                              <>
                                <button
                                  onClick={() => handleCloseInvoice(inv.id)}
                                  className="p-1.5 hover:bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 flex items-center cursor-pointer"
                                  title="Close & Deduct Stock"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteInvoice(inv.id)}
                                  className="p-1.5 hover:bg-rose-55 hover:bg-rose-50 border border-rose-100 rounded-lg text-rose-600 flex items-center cursor-pointer"
                                  title="Delete Invoice"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        // WAREHOUSE DISPATCHES TAB
        transfersLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
          </div>
        ) : (
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-2 uppercase tracking-wider">
              <Truck className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Warehouse Stock Shipments Log</span>
            </h3>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {transfers.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 font-semibold">
                  No warehouse dispatches initiated yet.
                </div>
              ) : (
                transfers.map((item) => (
                  <div 
                    key={item.id} 
                    id={`transfer-${item.id}`}
                    className={`rounded-xl p-4 space-y-3 border transition-all duration-300 ${
                      item.id === highlightedId
                        ? 'border-rose-500 bg-rose-50/10 shadow-md ring-2 ring-rose-500/20'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-slate-800 text-xs">{item.transferNo}</span>
                          {item.invoice?.invoiceNo && (
                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                              Invoice: {item.invoice.invoiceNo}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Dispatched: {new Date(item.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${
                          item.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700' :
                          item.status === 'DISCREPANCY' ? 'bg-amber-50 text-amber-700' :
                          item.status === 'IN_TRANSIT' ? 'bg-indigo-50 text-indigo-700 animate-pulse' :
                          item.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-700'
                        }`}>
                          {item.status}
                        </span>
                        
                        {item.status === 'IN_TRANSIT' && (
                          <button
                            onClick={() => openVerifyModal(item)}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-lg shadow-rose-100 transition-all cursor-pointer flex items-center space-x-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verify & Approve Receipt</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Products details */}
                    <div className="space-y-1">
                      <span className="block text-[9px] font-black uppercase text-slate-400">Shipped Items</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {item.items?.map((it) => (
                          <div key={it.id} className="bg-white border border-slate-150 p-2 rounded-lg flex items-center justify-between">
                            <div className="truncate max-w-[150px]">
                              <p className="font-bold text-slate-700 truncate">{it.product?.name}</p>
                              <span className="text-[9px] font-semibold text-slate-400">SKU: {it.product?.sku}</span>
                            </div>
                            <span className="font-black text-slate-800 bg-slate-50 px-2 py-0.5 rounded text-[10px]">
                              {it.quantity} {it.product?.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {item.notes && (
                      <p className="text-[10px] text-slate-500 bg-slate-100/50 p-2 rounded-lg">
                        <strong>Memo:</strong> {item.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )
      )}

      {/* Invoice Details Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">GST Tax Invoice Breakdown</h3>
                <span className="text-[10px] text-slate-400 block font-bold mt-0.5">Bill: {selectedInvoice.invoiceNo}</span>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Core store, dates grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 border border-slate-100 rounded-xl">
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Outlet Details</span>
                  {selectedInvoice.store ? (
                    <>
                      <p className="font-bold text-slate-880 text-xs font-black">{selectedInvoice.store.name}</p>
                      <p className="text-slate-500">{selectedInvoice.store.address}</p>
                      <p className="text-slate-500">GST: <strong className="text-slate-700">{selectedInvoice.store.gstNumber || 'N/A'}</strong></p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-slate-800 text-xs text-rose-600 font-black">B2B Warehouse Direct</p>
                      <p className="text-slate-500">{selectedInvoice.dealer?.address}</p>
                      <p className="text-slate-500">GSTIN: <strong className="text-slate-700">{selectedInvoice.dealer?.gstNumber || 'N/A'}</strong></p>
                    </>
                  )}
                </div>
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Invoice Info</span>
                  <p className="flex items-center space-x-1.5 text-slate-600">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}</span>
                  </p>
                  <p className="flex items-center space-x-1.5 text-slate-600">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Status: <strong className={`uppercase ${
                      selectedInvoice.status === 'CLOSED' ? 'text-emerald-600' :
                      selectedInvoice.status === 'OPEN' ? 'text-blue-600' : 'text-slate-600'
                    }`}>{selectedInvoice.status}</strong></span>
                  </p>
                  {selectedInvoice.isCredit && (
                    <div className="mt-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-750 font-bold space-y-1">
                      <p className="flex items-center space-x-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                        <span>Terms: 15 Days Credit</span>
                      </p>
                      {selectedInvoice.status === 'OPEN' && (new Date(selectedInvoice.createdAt) <= (() => {
                        const d = new Date();
                        d.setDate(d.getDate() - 15);
                        return d;
                      })()) && (
                        <p className="flex items-center space-x-1 text-amber-700 font-extrabold animate-pulse">
                          <span>⚠️ Credit Follow-up Alert (Overdue)</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Items listing breakdown */}
              <div className="space-y-2">
                <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Items breakdown</span>
                <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                  <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 p-3 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    <div className="col-span-5">Product SKU</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-center">Margin</div>
                    <div className="col-span-3 text-right">Line Total</div>
                  </div>
                  {selectedInvoice.items?.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 items-center p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/20">
                      <div className="col-span-5 font-bold text-slate-800">
                        {item.product?.name}
                        <span className="block text-[9px] font-black text-rose-600">SKU: {item.product?.sku}</span>
                      </div>
                      <div className="col-span-2 text-center font-bold text-slate-700">{item.quantity} {item.product?.unit}</div>
                      <div className="col-span-2 text-center font-bold text-slate-700">{parseFloat(item.marginPct)}%</div>
                      <div className="col-span-3 text-right font-bold text-slate-800">₹{parseFloat(item.lineTotal).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              {selectedInvoice.notes && (
                <div className="text-[10px] bg-slate-50/50 border border-slate-100 p-3 rounded-xl text-slate-500">
                  <strong>Invoice Memo:</strong> {selectedInvoice.notes}
                </div>
              )}

              {/* Summary Calculations */}
              <div className="flex flex-col items-end pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center w-48 text-[11px] text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-700">₹{parseFloat(selectedInvoice.subtotal).toFixed(2)}</span>
                </div>
                {selectedInvoice.isGstEnabled !== false ? (
                  <>
                    <div className="flex justify-between items-center w-48 text-[11px] text-slate-500">
                      <span>CGST:</span>
                      <span className="font-bold text-slate-700">₹{(selectedInvoice.cgst !== undefined ? parseFloat(selectedInvoice.cgst) : (parseFloat(selectedInvoice.totalGst) / 2)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center w-48 text-[11px] text-slate-500">
                      <span>SGST:</span>
                      <span className="font-bold text-slate-700">₹{(selectedInvoice.sgst !== undefined ? parseFloat(selectedInvoice.sgst) : (parseFloat(selectedInvoice.totalGst) / 2)).toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center w-48 text-[11px] text-slate-500">
                    <span>GST:</span>
                    <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[9px] uppercase font-black">Disabled</span>
                  </div>
                )}
                {selectedInvoice.shippingCharges && parseFloat(selectedInvoice.shippingCharges) > 0 && (
                  <div className="flex justify-between items-center w-48 text-[11px] text-slate-500">
                    <span>Shipping Charges:</span>
                    <span className="font-bold text-slate-700">₹{parseFloat(selectedInvoice.shippingCharges).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center w-48 text-xs font-black text-slate-800 border-t border-slate-100 pt-2">
                  <span>Grand Total:</span>
                  <span className="text-rose-600">₹{parseFloat(selectedInvoice.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-between gap-4">
              <div className="flex items-center space-x-2">
                {selectedInvoice.status === 'OPEN' && (
                  <>
                    <button
                      onClick={() => handleCloseInvoice(selectedInvoice.id)}
                      disabled={actionLoading}
                      className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Close & Deduct Stock</span>
                    </button>
                    <button
                      onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                      disabled={actionLoading}
                      className="inline-flex items-center space-x-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Invoice</span>
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => handleDownloadPdf(selectedInvoice)}
                className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Print PDF Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Checklist Modal for Transfers */}
      {showVerifyModal && verifyTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50/80">
              <div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">Shipment Verification</span>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Verify & Approve Shipment: {verifyTransfer.transferNo}</h3>
              </div>
              <button 
                onClick={() => { setShowVerifyModal(false); setVerifyTransfer(null); }} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitVerification} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="bg-indigo-50/50 border border-indigo-100/50 text-indigo-900 p-4 rounded-xl space-y-1">
                <strong className="font-bold block text-indigo-950 flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Shipment Checklist Verification:</span>
                </strong>
                <p className="leading-relaxed text-slate-650">Please check off each item received. If any item has a quantity mismatch or damage, uncheck "Verified" and update the actual received quantity and add a comment. Only verified stock will be added to your inventory after approval.</p>
              </div>

              <div className="space-y-4">
                <span className="block text-[10px] font-black uppercase text-slate-400">Items Checklist</span>
                <div className="space-y-3">
                  {verifyItems.map((item) => (
                    <div key={item.productId} className={`p-4 border rounded-xl space-y-3 transition-colors ${
                      item.isVerified ? 'border-slate-150 bg-slate-50/20' : 'border-rose-300 bg-rose-50/10'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{item.name}</p>
                          <span className="text-[9px] font-semibold text-slate-400 block">SKU: {item.sku} · Shipped: {item.shippedQty} {item.unit}</span>
                        </div>
                        
                        <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.isVerified}
                            onChange={(e) => handleVerifyItemChange(item.productId, 'isVerified', e.target.checked)}
                            className="rounded text-rose-600 border-slate-300 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                          />
                          <span>Verified (No Issues)</span>
                        </label>
                      </div>

                      {!item.isVerified && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-dashed border-rose-200 animate-fade-in">
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Received Qty ({item.unit})</label>
                            <input
                              type="number"
                              min="0"
                              max={item.shippedQty}
                              required
                              value={item.receivedQuantity}
                              onChange={(e) => handleVerifyItemChange(item.productId, 'receivedQuantity', Math.min(item.shippedQty, Math.max(0, parseInt(e.target.value) || 0)))}
                              className="w-full p-2 bg-white border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-slate-500 font-bold mb-1">Explain Issue / Comment *</label>
                            <input
                              type="text"
                              required={item.receivedQuantity !== item.shippedQty}
                              value={item.discrepancyComment}
                              placeholder="e.g. 2 packets damaged, or 3 packets missing"
                              onChange={(e) => handleVerifyItemChange(item.productId, 'discrepancyComment', e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowVerifyModal(false); setVerifyTransfer(null); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all text-center flex items-center justify-center space-x-2 cursor-pointer disabled:bg-slate-200"
                >
                  {verifyLoading ? (
                    <span>Approving Receipt...</span>
                  ) : (
                    <span>Approve Receipt & Update Stock</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
