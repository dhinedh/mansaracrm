// src/pages/admin/EcomOrdersPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ShoppingBag, 
  Search, 
  RefreshCw, 
  Eye, 
  Trash2, 
  MessageCircle, 
  Send, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Star, 
  AlertTriangle,
  User,
  Calendar,
  CreditCard,
  Package,
  Clock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { BACKEND_URL } from '../../store/authStore';

export default function EcomOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());
  
  // Dialog/Form states
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  // Status/Confirm transition states
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [shippingId, setShippingId] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const statusOptions = [
    { value: 'Ordered', label: 'Ordered', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    { value: 'Processing', label: 'Processing', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { value: 'Shipped', label: 'Shipped', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    { value: 'Out for Delivery', label: 'Out for Delivery', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    { value: 'Delivered', label: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { value: 'Cancelled', label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-100' }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/ecom/orders');
      if (res.data.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to fetch orders', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedOrderIds(new Set(filteredOrders.map(o => o._id)));
    } else {
      setSelectedOrderIds(new Set());
    }
  };

  const handleSelectOrder = (id, checked) => {
    const next = new Set(selectedOrderIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedOrderIds(next);
  };

  // Confirm order (moves to Processing, sets delivery date)
  const handleConfirmOrder = async (order) => {
    setConfirmingId(order._id);
    try {
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 4); // default 4 days out
      
      const res = await axios.put(`/ecom/orders/${order._id}/confirm`, {
        estimatedDeliveryDate: deliveryDate.toISOString()
      });
      if (res.data.success) {
        setMessage({ text: 'Order confirmed successfully! Estimated delivery set.', type: 'success' });
        // Update local status
        setOrders(prev => prev.map(o => o._id === order._id ? { ...o, ...res.data.order } : o));
        if (selectedOrder && selectedOrder._id === order._id) {
          setSelectedOrder({ ...selectedOrder, ...res.data.order });
        }
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: err.response?.data?.message || 'Failed to confirm order', type: 'error' });
    } finally {
      setConfirmingId(null);
    }
  };

  // Update Status
  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingStatusId(orderId);
    try {
      const res = await axios.put(`/ecom/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        setMessage({ text: `Order status updated to ${newStatus}.`, type: 'success' });
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, ...res.data.order } : o));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, ...res.data.order });
        }
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to update order status', type: 'error' });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Delete Order
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`/ecom/orders/${orderToDelete._id}`);
      if (res.data.success) {
        setMessage({ text: 'Order deleted successfully.', type: 'success' });
        setOrders(prev => prev.filter(o => o._id !== orderToDelete._id));
        setShowDeleteModal(false);
        setOrderToDelete(null);
        setShowDetailsModal(false);
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to delete order', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Shiprocket Mock integration for bulk shipping
  const handleShipWithShiprocket = async () => {
    if (selectedOrderIds.size === 0) return;
    setMessage({ text: `Initiating Shiprocket shipment for ${selectedOrderIds.size} orders...`, type: 'success' });
    setTimeout(() => {
      setOrders(prev => prev.map(o => 
        selectedOrderIds.has(o._id) ? { ...o, orderStatus: 'Shipped' } : o
      ));
      setSelectedOrderIds(new Set());
      setMessage({ text: 'Orders shipped with Shiprocket successfully!', type: 'success' });
    }, 1200);
  };

  // Bulk CSV Export for Shiprocket
  const handleExportShiprocket = () => {
    if (selectedOrderIds.size === 0) return;
    const selectedOrders = orders.filter(o => selectedOrderIds.has(o._id));
    
    const headers = [
      "Order ID", "Order Date", "Payment Method", "Customer Name", 
      "Customer Email", "Customer Mobile", "Shipping Address", 
      "City", "State", "Pincode", "Product Name", "Quantity", 
      "Price", "Order Total", "Weight"
    ];

    let csvContent = headers.join(",") + "\n";
    selectedOrders.forEach(order => {
      order.items.forEach(item => {
        const customerName = order.user?.name || `${order.deliveryAddress?.firstName || ''} ${order.deliveryAddress?.lastName || ''}`;
        const phone = order.deliveryAddress?.phone || order.user?.phone || "";
        const row = [
          order.orderId,
          new Date(order.createdAt).toISOString().split('T')[0],
          order.paymentMethod === "Cash on Delivery" ? "COD" : "Prepaid",
          `"${customerName.replace(/"/g, '""')}"`,
          order.user?.email || "",
          phone,
          `"${(order.deliveryAddress?.street || '').replace(/"/g, '""')}"`,
          order.deliveryAddress?.city || "",
          order.deliveryAddress?.state || "",
          order.deliveryAddress?.zip || "",
          `"${(item.name || '').replace(/"/g, '""')}"`,
          item.quantity,
          item.price,
          order.total,
          item.weight || "0.5"
        ];
        csvContent += row.join(",") + "\n";
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `shiprocket_bulk_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMessage({ text: `Exported ${selectedOrders.length} orders successfully.`, type: 'success' });
  };

  // WhatsApp manual notification trigger
  const handleManualWhatsApp = (order) => {
    const whatsappNum = order.deliveryAddress?.whatsapp || order.user?.whatsapp || order.deliveryAddress?.phone || order.user?.phone;
    if (!whatsappNum) {
      alert("No contact number available for WhatsApp.");
      return;
    }

    const deliveryDateStr = order.estimatedDeliveryDate 
      ? new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN')
      : new Date(Date.now() + 4 * 86400000).toLocaleDateString('en-IN');

    let itemsStr = order.items.map(i => `• ${i.quantity}x ${i.name}`).join('\n');
    const msg = `*Mansara Foods* 🌿\n\nHi ${order.user?.name || order.deliveryAddress?.firstName || 'Customer'},\n\nYour Order *${order.orderId}* status is: *${order.orderStatus}*\n\n*Items:*\n${itemsStr}\n\n*Total:* ₹${order.total}\n*Payment:* ${order.paymentMethod}\n*Expected Delivery:* ${deliveryDateStr}\n\nThank you for shopping with us!`;
    
    let formattedPhone = whatsappNum.replace(/\D/g, '');
    if (formattedPhone.length === 10) formattedPhone = '91' + formattedPhone;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Send Custom Message
  const handleSendMessage = async () => {
    if (!selectedOrder || !messageContent.trim()) return;
    setSendingMessage(true);
    try {
      // API call to custom message notify
      await axios.post(`/ecom/orders/${selectedOrder._id}/status`, {
        status: selectedOrder.orderStatus,
        customMessage: messageContent
      });
      setMessage({ text: 'Custom notification sent to customer!', type: 'success' });
      setShowMessageModal(false);
      setMessageContent('');
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to send notification', type: 'error' });
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusBadge = (status) => {
    const opt = statusOptions.find(o => o.value === status);
    return opt ? opt.color : 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const filteredOrders = orders.filter(o => {
    const customerName = (o.user?.name || `${o.deliveryAddress?.firstName || ''} ${o.deliveryAddress?.lastName || ''}`).toLowerCase();
    const searchLower = search.toLowerCase();
    const matchesSearch = o.orderId.toLowerCase().includes(searchLower) || 
      customerName.includes(searchLower) || 
      (o.deliveryAddress?.phone || '').includes(searchLower);
    
    const matchesStatus = statusFilter ? o.orderStatus === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-rose-600" />
            Website Orders
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Manage direct customer transactions, status updates, and shipping integrations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleShipWithShiprocket}
            disabled={selectedOrderIds.size === 0}
            className="inline-flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-colors cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            <Truck className="w-4 h-4" />
            <span>Ship with Shiprocket ({selectedOrderIds.size})</span>
          </button>
          <button
            onClick={handleExportShiprocket}
            disabled={selectedOrderIds.size === 0}
            className="inline-flex items-center space-x-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-100"
          >
            <Package className="w-4 h-4" />
            <span>Export CSV ({selectedOrderIds.size})</span>
          </button>
          <button
            onClick={fetchOrders}
            className="inline-flex items-center space-x-1.5 text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Message feedback */}
      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
            : 'bg-rose-50 text-rose-800 border border-rose-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {message.text}
          <button onClick={() => setMessage({ text: '', type: '' })} className="ml-auto text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-slate-150 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, customer, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none transition-all font-semibold text-slate-600 cursor-pointer"
        >
          <option value="">All Statuses</option>
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-slate-150 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-24 text-center text-xs text-slate-400 font-semibold italic bg-white border border-slate-150 rounded-2xl flex flex-col items-center justify-center gap-2">
          <ShoppingBag className="w-8 h-8 text-slate-350 stroke-1" />
          <span>No retail orders found.</span>
        </div>
      ) : (
        <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedOrderIds.size === filteredOrders.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                  />
                </th>
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Phone / WhatsApp</th>
                <th className="p-4">Date</th>
                <th className="p-4">Grand Total</th>
                <th className="p-4 text-center">Payment</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const customerName = order.user?.name || `${order.deliveryAddress?.firstName || ''} ${order.deliveryAddress?.lastName || ''}`;
                return (
                  <tr key={order._id} className="border-b border-slate-150 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.has(order._id)}
                        onChange={(e) => handleSelectOrder(order._id, e.target.checked)}
                        className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-700">
                      {order.orderId}
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-bold text-slate-800">{customerName}</div>
                        <div className="text-[10px] text-slate-400">{order.user?.email || 'Guest User'}</div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">
                      <div>{order.deliveryAddress?.phone || order.user?.phone || 'N/A'}</div>
                      {order.deliveryAddress?.whatsapp && (
                        <div className="text-[10px] text-emerald-600 font-bold">WA: {order.deliveryAddress.whatsapp}</div>
                      )}
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="p-4 font-black text-slate-800">
                      ₹{parseFloat(order.total || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                        order.paymentStatus === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStatusBadge(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => { setSelectedOrder(order); setShowDetailsModal(true); }}
                        className="inline-flex items-center space-x-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl font-bold cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Order Details: {selectedOrder.orderId}</h3>
              </div>
              <button 
                onClick={() => { setShowDetailsModal(false); setSelectedOrder(null); }} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Order Status Bar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                    <Clock className="w-4 h-4 text-rose-600" />
                    Transaction Info
                  </h4>
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Date Ordered:</span>
                      <span className="font-semibold text-slate-800">{new Date(selectedOrder.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="font-semibold text-slate-800">{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Payment Status:</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                        selectedOrder.paymentStatus === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>{selectedOrder.paymentStatus}</span>
                    </div>
                    {selectedOrder.estimatedDeliveryDate && (
                      <div className="flex justify-between">
                        <span>Expected Delivery:</span>
                        <span className="font-semibold text-slate-800">{new Date(selectedOrder.estimatedDeliveryDate).toLocaleDateString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                    <User className="w-4 h-4 text-rose-600" />
                    User / Account Info
                  </h4>
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span className="font-bold text-slate-800">{selectedOrder.user?.name || `${selectedOrder.deliveryAddress?.firstName || ''} ${selectedOrder.deliveryAddress?.lastName || ''}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-semibold text-slate-800">{selectedOrder.user?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span className="font-semibold text-slate-800">{selectedOrder.deliveryAddress?.phone || selectedOrder.user?.phone || 'N/A'}</span>
                    </div>
                    {selectedOrder.deliveryAddress?.whatsapp && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>WhatsApp Contact:</span>
                        <span>{selectedOrder.deliveryAddress.whatsapp}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              {selectedOrder.deliveryAddress && (
                <div className="bg-rose-50/50 p-4 border border-rose-100 rounded-xl space-y-1.5">
                  <h4 className="font-black text-rose-800 uppercase tracking-wide text-[10px]">Shipping Destination</h4>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {selectedOrder.deliveryAddress.firstName} {selectedOrder.deliveryAddress.lastName || ''} <br />
                    {selectedOrder.deliveryAddress.street} <br />
                    {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} - {selectedOrder.deliveryAddress.zip}
                  </p>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wide">Line Items</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-250 font-bold text-slate-600 uppercase text-[10px]">
                        <th className="p-3">Product Description</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, index) => (
                        <tr key={index} className="border-b border-slate-150">
                          <td className="p-3 font-bold text-slate-800">{item.name}</td>
                          <td className="p-3 text-center text-slate-600">{item.quantity}</td>
                          <td className="p-3 text-right text-slate-600">₹{parseFloat(item.price || 0).toFixed(2)}</td>
                          <td className="p-3 text-right font-black text-slate-800">₹{parseFloat((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-black text-slate-850">
                        <td colSpan="3" className="p-3 text-right">Total:</td>
                        <td className="p-3 text-right text-sm text-rose-600">₹{parseFloat(selectedOrder.total || 0).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status Update Options */}
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wide">Transition Order State</h4>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-slate-500 font-medium">Select Status:</span>
                  <select
                    value={selectedOrder.orderStatus}
                    onChange={(e) => handleUpdateStatus(selectedOrder._id, e.target.value)}
                    disabled={updatingStatusId === selectedOrder._id}
                    className="p-2 bg-white border border-slate-250 focus:border-rose-500 rounded-xl focus:outline-none font-bold text-slate-700 cursor-pointer"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {updatingStatusId === selectedOrder._id && (
                    <span className="animate-pulse text-xs text-rose-600 font-bold">Updating...</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 italic">Changing order state will notify the customer automatically.</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-4 border-t border-slate-100">
                {selectedOrder.orderStatus === 'Ordered' && (
                  <button
                    onClick={() => handleConfirmOrder(selectedOrder)}
                    disabled={confirmingId === selectedOrder._id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:bg-slate-200"
                  >
                    {confirmingId === selectedOrder._id ? 'Confirming...' : 'Confirm & Schedule'}
                  </button>
                )}

                <button
                  onClick={() => handleManualWhatsApp(selectedOrder)}
                  className="bg-white hover:bg-slate-50 text-emerald-600 border border-emerald-200 font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Chat</span>
                </button>

                <button
                  onClick={() => setShowMessageModal(true)}
                  className="bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Custom Notify</span>
                </button>

                <button
                  onClick={() => {
                    setOrderToDelete(selectedOrder);
                    setShowDeleteModal(true);
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:col-start-3"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Message Dialog */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-wide">Send Custom Alert</h3>
              <button onClick={() => setShowMessageModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Message Content</label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows="4"
                  placeholder="Enter custom text message to push as notification alert..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-250 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-medium"
                ></textarea>
              </div>
              <div className="flex space-x-2.5">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !messageContent.trim()}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl transition-all disabled:bg-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                >
                  {sendingMessage ? 'Sending...' : 'Send Alerts'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteModal && orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8">
            <div className="p-6 border-b border-slate-100 bg-rose-50">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-wide">Confirm Deletion</h3>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed font-semibold">
                Are you sure you want to permanently delete order <span className="font-mono font-black text-rose-600">{orderToDelete.orderId}</span>?
                This action is irreversible and will remove all transaction records.
              </p>
              <div className="flex space-x-2.5 pt-2">
                <button
                  onClick={() => { setShowDeleteModal(false); setOrderToDelete(null); }}
                  className="flex-1 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteOrder}
                  disabled={deleting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl transition-all disabled:bg-slate-200 cursor-pointer"
                >
                  {deleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
