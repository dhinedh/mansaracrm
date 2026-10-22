// src/pages/admin/AdminFieldOrdersPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShoppingBag, Search, Filter, CheckCircle2, Clock, 
  Truck, XCircle, Eye, X, Download, User, Store, 
  Building2, DollarSign, Calendar, Tag, ChevronDown
} from 'lucide-react';

export default function AdminFieldOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalOrderValue: 0, pendingOrdersCount: 0, approvedOrdersCount: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/field-sales/admin/orders?status=${statusFilter}&search=${encodeURIComponent(search)}`);
      if (res.data?.success) {
        setOrders(res.data.data.orders || []);
        setStats({
          totalOrders: res.data.data.totalOrders || 0,
          totalOrderValue: res.data.data.totalOrderValue || 0,
          pendingOrdersCount: res.data.data.pendingOrdersCount || 0,
          approvedOrdersCount: res.data.data.approvedOrdersCount || 0
        });
      }
    } catch (err) {
      console.error('Error fetching admin field sales orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await axios.put(`/field-sales/admin/orders/${orderId}/status`, { status: newStatus });
      if (res.data?.success) {
        setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCSV = () => {
    if (!orders.length) return;
    const headers = ['Order No', 'Date', 'Salesperson', 'Retail Store', 'Dealer', 'Items Count', 'Total Amount (INR)', 'Payment Method', 'Status'];
    const rows = orders.map(o => [
      `"${o.orderNumber}"`,
      `"${new Date(o.createdAt).toLocaleDateString()}"`,
      `"${o.salespersonId?.name || 'Sales Officer'}"`,
      `"${o.storeName || o.storeId?.name || 'Store'}"`,
      `"${o.dealerId?.companyName || 'Dealer'}"`,
      o.items?.length || 0,
      o.totalAmount || 0,
      `"${o.paymentMethod || 'NONE'}"`,
      `"${o.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Field_Sales_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Field Sales Orders Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete traceability of secondary orders booked by field executives on retail shops for distributor fulfillment
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={!orders.length}
          className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Orders CSV</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Field Orders</span>
            <ShoppingBag className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{stats.totalOrders}</div>
          <p className="text-[11px] text-slate-500 mt-1">Booked across all territories</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Booking Value</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            ₹{stats.totalOrderValue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Cumulative sales volume</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Orders</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{stats.pendingOrdersCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting admin/dealer approval</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Approved & In-Transit</span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">{stats.approvedOrdersCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Ready for warehouse dispatch</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order Number or Retail Store Name..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 shadow-sm"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'PENDING', 'APPROVED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            Loading field sales orders queue...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            No field sales orders found matching status "{statusFilter}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Order Number</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Sales Executive</th>
                  <th className="px-4 py-3">Retail Customer Store</th>
                  <th className="px-4 py-3">Distributor Dealer</th>
                  <th className="px-4 py-3">Order Value</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((o) => {
                  const rep = o.salespersonId?.name || 'Sales Rep';
                  const storeName = o.storeName || o.storeId?.name || 'Retail Outlet';
                  const dealerName = o.dealerId?.companyName || 'Assigned Dealer';

                  return (
                    <tr key={o._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        {o.orderNumber}
                      </td>

                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {rep.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">{rep}</span>
                            <span className="text-[10px] text-slate-400">{o.salespersonId?.phone || 'Mobile N/A'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800 block">{storeName}</span>
                        <span className="text-[10px] text-slate-400 truncate block max-w-xs">{o.storeId?.address || 'Retail Customer'}</span>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {dealerName}
                      </td>

                      <td className="px-4 py-3 font-mono font-black text-rose-600 text-sm">
                        ₹{(o.totalAmount || 0).toLocaleString('en-IN')}
                        <span className="text-[10px] font-normal text-slate-400 block">
                          {o.items?.length || 0} item(s) • {o.paymentMethod || 'NONE'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          o.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          o.status === 'DISPATCHED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          o.status === 'DELIVERED' ? 'bg-slate-100 text-slate-700' :
                          o.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {o.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {o.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(o._id, 'APPROVED')}
                              disabled={updatingId === o._id}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-lg cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {o.status === 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(o._id, 'DISPATCHED')}
                              disabled={updatingId === o._id}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold rounded-lg cursor-pointer"
                            >
                              Dispatch
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(o)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              {selectedOrder.status}
            </span>
            <h3 className="text-base font-black text-slate-800 mt-1">
              Field Sales Order: {selectedOrder.orderNumber}
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              Booked on: {new Date(selectedOrder.createdAt).toLocaleString()}
            </p>

            <div className="space-y-4 text-xs text-slate-700">
              {/* Stakeholders grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Sales Executive</span>
                  <p className="font-black text-slate-800">{selectedOrder.salespersonId?.name || 'Sales Representative'}</p>
                  <p className="text-[11px] text-slate-500">{selectedOrder.salespersonId?.email || 'N/A'}</p>
                  <p className="text-[11px] text-slate-500">{selectedOrder.salespersonId?.phone || ''}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Retail Customer Store</span>
                  <p className="font-black text-slate-800">{selectedOrder.storeName || selectedOrder.storeId?.name}</p>
                  <p className="text-[11px] text-slate-500">{selectedOrder.storeId?.address || 'Retail Customer'}</p>
                  <p className="text-[11px] text-slate-500">{selectedOrder.storeId?.phone || ''}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Assigned Distributor Dealer</span>
                <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-semibold text-slate-800">
                  {selectedOrder.dealerId?.companyName || 'Main Distributor'}
                </p>
              </div>

              {/* Items List */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Booked Items Breakdown</span>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2 text-center">Qty</th>
                        <th className="px-3 py-2 text-right">Price</th>
                        <th className="px-3 py-2 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-medium">{item.productName}</td>
                          <td className="px-3 py-2 text-center font-bold">{item.quantity}</td>
                          <td className="px-3 py-2 text-right font-mono">₹{item.price}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold">
                            ₹{(item.lineTotal || (item.price * item.quantity)).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-black border-t border-slate-200 text-xs">
                      <tr>
                        <td colSpan="3" className="px-3 py-2.5 text-right uppercase">Total Amount:</td>
                        <td className="px-3 py-2.5 text-right font-mono text-rose-600 text-sm">
                          ₹{(selectedOrder.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Order Notes</span>
                  <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex gap-2">
                {selectedOrder.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'APPROVED')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                  >
                    Approve Order
                  </button>
                )}
                {selectedOrder.status === 'APPROVED' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'DISPATCHED')}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                  >
                    Mark Dispatched
                  </button>
                )}
                {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'DELIVERED' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'CANCELLED')}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
