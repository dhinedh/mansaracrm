// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  DollarSign, 
  Users, 
  ShoppingBag, 
  Warehouse, 
  TrendingUp, 
  AlertCircle,
  Truck,
  PlusCircle,
  Calendar,
  FileText,
  Store,
  Download,
  X,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';

const COLORS = ['#be123c', '#475569', '#0d9488', '#ea580c', '#6366f1'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [dashboardTab, setDashboardTab] = useState('daily'); // 'daily', 'monthly', 'financial'

  // Invoice Details Modal state (for navigation from notification)
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (location.state?.invoiceId) {
      fetchInvoiceDetail(location.state.invoiceId);
    }
  }, [location.state]);

  const fetchInvoiceDetail = async (id) => {
    setInvoiceLoading(true);
    setShowInvoiceModal(true);
    try {
      const res = await axios.get(`/billing/${id}`);
      setSelectedInvoice(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setInvoiceLoading(false);
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

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/analytics/admin');
      setData(res.data.data);

      const billRes = await axios.get('/billing');
      const allInvoices = billRes.data.data || [];
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      const overdue = allInvoices.filter(inv => 
        (inv.status === 'GENERATED' || (inv.isCredit && inv.status === 'OPEN')) && 
        new Date(inv.createdAt) <= fifteenDaysAgo
      );
      setOverdueInvoices(overdue);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  const kpiList = [
    { name: 'Total Revenue', value: `₹${data?.kpis?.totalRevenue?.toLocaleString('en-IN') || 0}`, desc: 'Total bills generated', icon: DollarSign, color: 'text-rose-600 bg-rose-50' },
    { name: 'Active Dealers', value: data?.kpis?.activeDealers || 0, desc: `Out of ${data?.kpis?.totalDealers || 0} registered`, icon: Users, color: 'text-slate-600 bg-slate-100' },
    { name: 'Total Products', value: data?.kpis?.totalProducts || 0, desc: 'Active items in catalog', icon: ShoppingBag, color: 'text-teal-600 bg-teal-50' },
    { name: 'Total Invoices', value: data?.kpis?.totalInvoices || 0, desc: 'GST compliant invoices', icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 p-8 rounded-3xl text-white relative overflow-hidden shadow-xl shadow-slate-100">
        <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12"></div>
        <div className="relative z-10 space-y-2">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">Mansara Distributor Cockpit</h2>
          <p className="text-slate-300 text-xs md:text-sm">Manage dealers, products, track global stock transfers, and visualize revenue metrics.</p>
        </div>
      </div>

      {/* Dashboard Tabs Selector */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex space-x-1 max-w-lg shadow-sm border border-slate-200/50 backdrop-blur-sm">
        <button
          onClick={() => setDashboardTab('daily')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer ${
            dashboardTab === 'daily'
              ? 'bg-white text-rose-600 shadow-md shadow-slate-200/50'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily Pulse</span>
        </button>
        <button
          onClick={() => setDashboardTab('monthly')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer ${
            dashboardTab === 'monthly'
              ? 'bg-white text-rose-600 shadow-md shadow-slate-200/50'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Monthly Analytics</span>
        </button>
        <button
          onClick={() => setDashboardTab('financial')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer ${
            dashboardTab === 'financial'
              ? 'bg-white text-rose-600 shadow-md shadow-slate-200/50'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Financial Insights</span>
        </button>
      </div>

      {/* Daily Tab View */}
      {dashboardTab === 'daily' && (
        <div className="space-y-8 animate-fade-in">
          {/* Daily Pulse KPIs Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Today's Sales</span>
                <h4 className="text-xl font-black text-slate-800">₹{(data?.kpis?.todaySales || 0).toLocaleString('en-IN')}</h4>
                <p className="text-[9px] text-slate-400 font-medium">Billed revenue today</p>
              </div>
            </div>
            
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center space-x-4">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Collections Received</span>
                <h4 className="text-xl font-black text-slate-800">₹{(data?.kpis?.collectionsReceived || 0).toLocaleString('en-IN')}</h4>
                <p className="text-[9px] text-slate-400 font-medium">Payments cleared today</p>
              </div>
            </div>

            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center space-x-4">
              <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Orders Received</span>
                <h4 className="text-xl font-black text-slate-800">{data?.kpis?.ordersReceived || 0}</h4>
                <p className="text-[9px] text-slate-400 font-medium">Requests + Bills today</p>
              </div>
            </div>

            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center space-x-4">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Dispatches</span>
                <h4 className="text-xl font-black text-slate-800">{data?.kpis?.dispatchPending || 0}</h4>
                <p className="text-[9px] text-slate-400 font-medium">Awaiting delivery</p>
              </div>
            </div>
          </div>

          {/* Overdue Invoices Alert Section */}
          {overdueInvoices.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center space-x-3 text-amber-800 font-bold">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                <h3 className="text-sm uppercase tracking-wide">Action Required: Overdue Unpaid Invoices (&gt;= 15 Days)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 text-xs">
                {overdueInvoices.map(inv => {
                  const days = Math.floor((new Date() - new Date(inv.createdAt)) / (1000 * 60 * 60 * 24));
                  return (
                    <div 
                      key={inv.id} 
                      onClick={() => fetchInvoiceDetail(inv.id)}
                      className="bg-white border border-amber-100 hover:border-amber-300 hover:shadow-md cursor-pointer transition-all p-4 rounded-xl flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <p className="font-bold text-slate-800 text-xs truncate max-w-[130px]">{inv.dealer?.companyName}</p>
                            {inv.isCredit && (
                              <span className="text-[8px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded uppercase">
                                Credit
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono">Bill #: {inv.invoiceNo}</p>
                        </div>
                        <span className="text-rose-600 font-black text-xs">₹{(inv.totalAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                          inv.isCredit 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.isCredit ? `⚠️ Credit Follow-up (${days}d)` : `⚠️ ${days} Days Overdue`}
                        </span>
                        <span className="text-[9px] text-rose-600 font-bold hover:underline">View Invoice →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions Panel */}
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Quick Executive Controls</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/admin/dealers')}
                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-rose-50/50 hover:border-rose-100 transition-all text-left group cursor-pointer"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-800">Add New Partner</span>
                  <span className="text-[10px] text-slate-400">Register new dealers</span>
                </div>
                <PlusCircle className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
              </button>
              
              <button
                onClick={() => navigate('/admin/inventory')}
                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-rose-50/50 hover:border-rose-100 transition-all text-left group cursor-pointer"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-800">Initiate Transfer</span>
                  <span className="text-[10px] text-slate-400">Move stocks to dealer</span>
                </div>
                <Truck className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/admin/products')}
                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-rose-50/50 hover:border-rose-100 transition-all text-left group cursor-pointer"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-800">Add Catalog Product</span>
                  <span className="text-[10px] text-slate-400">Add price & SKU details</span>
                </div>
                <PlusCircle className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Tab View */}
      {dashboardTab === 'monthly' && (
        <div className="space-y-8 animate-fade-in">
          {/* Top Rankings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Distributors Ranking */}
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider flex items-center space-x-2">
                <Store className="w-4 h-4 text-rose-600" />
                <span>Distributor Performance</span>
              </h3>
              <div className="space-y-4">
                {data?.distributorPerformance?.length > 0 ? (
                  data.distributorPerformance.map((dist, idx) => {
                    const maxAmt = Math.max(...data.distributorPerformance.map(d => d.totalAmount), 1);
                    const pct = (dist.totalAmount / maxAmt) * 100;
                    return (
                      <div key={dist.dealerId || idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center space-x-2 font-medium">
                            <span className="w-5 h-5 flex items-center justify-center bg-slate-100 rounded text-[10px] font-bold text-slate-500">#{idx + 1}</span>
                            <span className="text-slate-800 font-bold">{dist.companyName}</span>
                          </div>
                          <span className="font-extrabold text-slate-800">₹{dist.totalAmount?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-rose-500 to-rose-600 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-400 text-xs italic text-center py-6">No distributor billing logs found</p>
                )}
              </div>
            </div>

            {/* Dealers/Retailers Ranking */}
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider flex items-center space-x-2">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Dealer / Retailer Performance</span>
              </h3>
              <div className="space-y-4">
                {data?.dealerPerformance?.length > 0 ? (
                  data.dealerPerformance.map((deal, idx) => {
                    const maxAmt = Math.max(...data.dealerPerformance.map(d => d.totalAmount), 1);
                    const pct = (deal.totalAmount / maxAmt) * 100;
                    return (
                      <div key={deal.dealerId || idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center space-x-2 font-medium">
                            <span className="w-5 h-5 flex items-center justify-center bg-slate-100 rounded text-[10px] font-bold text-slate-500">#{idx + 1}</span>
                            <span className="text-slate-800 font-bold">{deal.companyName}</span>
                          </div>
                          <span className="font-extrabold text-slate-800">₹{deal.totalAmount?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-teal-500 to-teal-600 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-400 text-xs italic text-center py-6">No dealer billing logs found</p>
                )}
              </div>
            </div>
          </div>

          {/* Product Movers Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Top Fast-Moving Products</span>
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {data?.fastMovers?.length > 0 ? data.fastMovers.map((prod, idx) => (
                  <div key={prod.productId || idx} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800 text-xs">{prod.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono">SKU: {prod.sku}</p>
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-700 font-black px-2.5 py-1 rounded-lg">
                      {prod.quantityTransferred} Dispatched
                    </span>
                  </div>
                )) : (
                  <p className="text-slate-400 py-6 text-center italic">No transfer logs recorded</p>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Slow-Moving Products</span>
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {data?.slowMovers?.length > 0 ? data.slowMovers.map((prod, idx) => (
                  <div key={prod.productId || idx} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800 text-xs">{prod.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono">SKU: {prod.sku}</p>
                    </div>
                    <span className="text-xs bg-rose-50 text-rose-700 font-black px-2.5 py-1 rounded-lg">
                      {prod.quantityTransferred} Dispatched
                    </span>
                  </div>
                )) : (
                  <p className="text-slate-400 py-6 text-center italic">No transfer logs recorded</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Tab View */}
      {dashboardTab === 'financial' && (
        <div className="space-y-8 animate-fade-in">
          {/* Financial KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Billed Revenue</span>
                <div className="p-2.5 rounded-xl text-rose-600 bg-rose-50">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800">₹{(data?.kpis?.totalRevenue || 0).toLocaleString('en-IN')}</h3>
              <p className="text-slate-400 text-[10px] font-medium mt-1">Total revenue generated from all bills</p>
            </div>

            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Amount</span>
                <div className="p-2.5 rounded-xl text-indigo-600 bg-indigo-50">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800">₹{(data?.kpis?.outstandingAmount || 0).toLocaleString('en-IN')}</h3>
              <p className="text-slate-400 text-[10px] font-medium mt-1">Pending payments from generated/open bills</p>
            </div>

            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profit Estimate (15%)</span>
                <div className="p-2.5 rounded-xl text-teal-600 bg-teal-50">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800">₹{((data?.kpis?.totalRevenue || 0) * 0.15).toLocaleString('en-IN')}</h3>
              <p className="text-slate-400 text-[10px] font-medium mt-1">Estimated standard dealer profit margin</p>
            </div>
          </div>

          {/* Collection comparison and Zone Sales */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Collection Ratio and Stats */}
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm lg:col-span-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Billed vs Outstanding</h3>
                {(() => {
                  const revenue = data?.kpis?.totalRevenue || 0;
                  const outstanding = data?.kpis?.outstandingAmount || 0;
                  const collected = Math.max(0, revenue - outstanding);
                  const collectedPct = revenue > 0 ? (collected / revenue) * 100 : 0;
                  const outstandingPct = revenue > 0 ? (outstanding / revenue) * 100 : 0;
                  return (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Collected (Cleared Payments)</span>
                          <span className="font-bold text-emerald-600">{collectedPct.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-xs font-black text-slate-800">
                          <span>₹{collected.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Outstanding (Credit/Pending)</span>
                          <span className="font-bold text-indigo-600">{outstandingPct.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-xs font-black text-slate-800">
                          <span>₹{outstanding.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Stacked Progress Bar */}
                      <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex border border-slate-150">
                        {collectedPct > 0 && (
                          <div 
                            className="bg-emerald-500 h-full transition-all" 
                            style={{ width: `${collectedPct}%` }}
                            title={`Collected: ${collectedPct.toFixed(1)}%`}
                          ></div>
                        )}
                        {outstandingPct > 0 && (
                          <div 
                            className="bg-indigo-500 h-full transition-all" 
                            style={{ width: `${outstandingPct}%` }}
                            title={`Outstanding: ${outstandingPct.toFixed(1)}%`}
                          ></div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="border-t border-slate-100 pt-4 mt-6 text-[10px] text-slate-400 font-semibold leading-relaxed">
                ℹ️ Collection ratio reflects the percentage of generated invoice values that have been fully completed/cleared.
              </div>
            </div>

            {/* Sales by Zone */}
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Regional Distribution (Sales by Zone)</h3>
                <span className="text-[10px] font-black text-rose-600 uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Zone Revenue</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="h-56">
                  {data?.zoneSales?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.zoneSales}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {data.zoneSales.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-slate-400">No zone sales recorded</div>
                  )}
                </div>

                <div className="space-y-3">
                  {data?.zoneSales?.map((entry, idx) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                        <span className="text-slate-800 font-bold">{entry.name}</span>
                        <span className="text-[10px] text-slate-400">({entry.dealerCount || 0} Partners)</span>
                      </div>
                      <span className="font-extrabold text-slate-800">₹{entry.value?.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">GST Tax Invoice Breakdown</h3>
                {selectedInvoice && (
                  <span className="text-[10px] text-slate-400 block font-bold mt-0.5">Bill: {selectedInvoice.invoiceNo}</span>
                )}
              </div>
              <button 
                onClick={() => { setShowInvoiceModal(false); setSelectedInvoice(null); }} 
                className="text-slate-400 hover:text-slate-600 font-bold bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
            
            {invoiceLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600"></div>
                <p className="text-slate-500 text-xs font-semibold">Fetching complete invoice details...</p>
              </div>
            ) : selectedInvoice ? (
              <>
                <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
                  {/* Dealer & Store info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 border border-slate-100 rounded-xl">
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Dealer Details</span>
                      <p className="font-bold text-slate-800 text-xs">{selectedInvoice.dealer?.companyName}</p>
                      <p className="text-slate-500">Contact: {selectedInvoice.dealer?.phone}</p>
                      <p className="text-slate-500">GSTIN: {selectedInvoice.dealer?.gstNumber || 'N/A'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Outlet Details</span>
                      {selectedInvoice.store ? (
                        <>
                          <p className="font-bold text-slate-800 text-xs">{selectedInvoice.store.name}</p>
                          <p className="text-slate-500">{selectedInvoice.store.address}</p>
                          <p className="text-slate-500">GST: <strong className="text-slate-700">{selectedInvoice.store.gstNumber || 'N/A'}</strong></p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-slate-800 text-xs text-rose-600">B2B Direct Dispatch</p>
                          <p className="text-slate-500">{selectedInvoice.dealer?.address}</p>
                          <p className="text-slate-500">Channel: <strong className="text-slate-700">{selectedInvoice.channel || 'B2B'}</strong></p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Date and status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 border border-slate-150 rounded-xl">
                    <div className="space-y-1">
                      <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Invoice Date</span>
                      <p className="font-bold text-slate-700">{new Date(selectedInvoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Invoice Status</span>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className={`inline-flex text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${
                          selectedInvoice.status === 'CLOSED' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                          selectedInvoice.status === 'OPEN' ? 'text-blue-700 bg-blue-50 border-blue-100' :
                          'text-slate-700 bg-slate-50 border-slate-100'
                        }`}>
                          {selectedInvoice.status}
                        </span>
                        {selectedInvoice.isCredit && (
                          <span className="inline-flex text-[10px] font-black px-2.5 py-0.5 rounded-full border border-indigo-100 text-indigo-700 bg-indigo-50 uppercase">
                            Credit (15 Days)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedInvoice.isCredit && (
                    <div className="p-4 border border-indigo-100 bg-indigo-50/50 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="block text-[9px] font-black uppercase text-indigo-500 tracking-wider">Credit Terms</span>
                        <p className="font-bold text-indigo-800 text-xs">15 Days Payment Terms</p>
                      </div>
                      {selectedInvoice.status === 'OPEN' && (new Date(selectedInvoice.createdAt) <= (() => {
                        const d = new Date();
                        d.setDate(d.getDate() - 15);
                        return d;
                      })()) ? (
                        <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase animate-pulse border border-amber-200">
                          ⚠️ Credit Follow-up Alert (Overdue)
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full uppercase">
                          Active Credit
                        </span>
                      )}
                    </div>
                  )}

                  {/* Items listing breakdown */}
                  <div className="space-y-2">
                    <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Items Breakdown</span>
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
                    <div className="flex justify-between items-center w-48 text-[11px] text-slate-500">
                      <span>GST (CGST+SGST):</span>
                      <span className="font-bold text-slate-700">₹{parseFloat(selectedInvoice.totalGst).toFixed(2)}</span>
                    </div>
                    {selectedInvoice.shippingCharges && parseFloat(selectedInvoice.shippingCharges) > 0 && (
                      <div className="flex justify-between items-center w-48 text-[11px] text-slate-500">
                        <span>Shipping Charges:</span>
                        <span className="font-bold text-slate-700">₹{parseFloat(selectedInvoice.shippingCharges).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center w-48 text-xs font-black text-slate-800 border-t border-slate-100 pt-2">
                      <span>Grand Total:</span>
                      <span className="text-rose-600 font-extrabold text-sm">₹{parseFloat(selectedInvoice.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {selectedInvoice.status === 'OPEN' && (
                      <>
                        <button
                          onClick={async () => {
                            if (window.confirm('Close invoice?')) {
                              try {
                                await axios.patch(`/billing/${selectedInvoice.id}/close`);
                                alert('Invoice closed successfully.');
                                fetchInvoiceDetail(selectedInvoice.id);
                                fetchDashboardData();
                              } catch (err) {
                                alert(err.response?.data?.message || 'Failed to close');
                              }
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-xl cursor-pointer"
                        >
                          Close & Deduct Stock
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('Delete invoice?')) {
                              try {
                                await axios.delete(`/billing/${selectedInvoice.id}`);
                                alert('Invoice deleted.');
                                setShowInvoiceModal(false);
                                fetchDashboardData();
                              } catch (err) {
                                alert(err.response?.data?.message || 'Failed to delete');
                              }
                            }
                          }}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs px-3 py-2 rounded-xl cursor-pointer"
                        >
                          Delete
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
              </>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 font-semibold">No invoice details loaded.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
