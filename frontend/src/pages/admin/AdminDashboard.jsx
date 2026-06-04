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
  X
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

  const handleDownloadPdf = async (id, invoiceNo) => {
    try {
      const response = await axios.get(`/billing/${id}/pdf`, {
        responseType: 'blob'
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `Invoice_${invoiceNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to generate PDF. Make sure Puppeteer is installed and running.');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/analytics/admin');
      setData(res.data.data);
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiList.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.name} className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.name}</span>
                <div className={`p-2.5 rounded-xl ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800">{kpi.value}</h3>
              <p className="text-slate-400 text-[10px] font-medium mt-1">{kpi.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales by Zone */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm lg:col-span-1">
          <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Sales by Zone</h3>
          <div className="h-64">
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
                  <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">No data available</div>
            )}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            {data?.zoneSales?.map((entry, idx) => (
              <div key={entry.name} className="flex items-center space-x-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                <span className="text-slate-600 font-semibold">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dealer Revenue Rankings */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Top Performing Partners</h3>
          <div className="h-72">
            {data?.dealerPerformance?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dealerPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="companyName" tick={{ fontSize: 10, fontWeight: 500 }} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 500 }} />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Bar dataKey="totalAmount" fill="#be123c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Quick Executive Controls</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/admin/dealers')}
            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-rose-50/50 hover:border-rose-100 transition-all text-left group"
          >
            <div>
              <span className="block text-xs font-bold text-slate-800">Add New Partner</span>
              <span className="text-[10px] text-slate-400">Register new dealers</span>
            </div>
            <PlusCircle className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
          </button>
          
          <button
            onClick={() => navigate('/admin/inventory')}
            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-rose-50/50 hover:border-rose-100 transition-all text-left group"
          >
            <div>
              <span className="block text-xs font-bold text-slate-800">Initiate Transfer</span>
              <span className="text-[10px] text-slate-400">Move stocks to dealer</span>
            </div>
            <Truck className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
          </button>

          <button
            onClick={() => navigate('/admin/products')}
            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-rose-50/50 hover:border-rose-100 transition-all text-left group"
          >
            <div>
              <span className="block text-xs font-bold text-slate-800">Add Catalog Product</span>
              <span className="text-[10px] text-slate-400">Add price & SKU details</span>
            </div>
            <PlusCircle className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
          </button>
        </div>
      </div>

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
                      <p className="font-bold text-slate-800 text-xs">{selectedInvoice.store?.name}</p>
                      <p className="text-slate-500">{selectedInvoice.store?.address}</p>
                      <p className="text-slate-500">GST: <strong className="text-slate-700">{selectedInvoice.store?.gstNumber || 'N/A'}</strong></p>
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
                      <span className="inline-flex text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase">
                        {selectedInvoice.status}
                      </span>
                    </div>
                  </div>

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
                    <div className="flex justify-between items-center w-48 text-xs font-black text-slate-800 border-t border-slate-100 pt-2">
                      <span>Grand Total:</span>
                      <span className="text-rose-600 font-extrabold text-sm">₹{parseFloat(selectedInvoice.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    onClick={() => handleDownloadPdf(selectedInvoice.id, selectedInvoice.invoiceNo)}
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
