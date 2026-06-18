// src/pages/admin/EcomCustomersPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Users, 
  Search, 
  RefreshCw, 
  Eye, 
  Mail, 
  Phone, 
  Calendar, 
  ShoppingBag, 
  ArrowLeft, 
  Package,
  TrendingUp,
  UserCheck,
  CreditCard
} from 'lucide-react';

export default function EcomCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Drawer / Details modal state
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/ecom/customers');
      if (res.data.success) {
        setCustomers(res.data.customers || []);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (customer) => {
    setSelectedCustomerId(customer._id);
    setShowDetailsModal(true);
    setLoadingDetails(true);
    try {
      const res = await axios.get(`/ecom/customers/${customer._id}`);
      if (res.data.success) {
        setCustomerDetails(res.data.customer);
        setCustomerOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Filter logic
  const filteredCustomers = customers.filter(customer => {
    const nameLower = (customer.name || '').toLowerCase();
    const emailLower = (customer.email || '').toLowerCase();
    const phone = customer.phone || '';
    const matchesSearch = nameLower.includes(searchTerm.toLowerCase()) ||
      emailLower.includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm);
    
    let matchesFilter = true;
    if (filterType === 'ordered') {
      matchesFilter = (customer.totalOrders || 0) > 0;
    } else if (filterType === 'unordered') {
      matchesFilter = !(customer.totalOrders) || customer.totalOrders === 0;
    }

    return matchesSearch && matchesFilter;
  });

  // Calculate high level stats
  const totalSpentAll = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  const activeCount = customers.filter(c => c.status !== 'Inactive').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-600" />
            Retail Customers
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">View and analyze the B2C customer database, purchase logs, and lifetime values.</p>
        </div>
        <button
          onClick={fetchCustomers}
          className="inline-flex items-center space-x-1.5 text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Total Accounts</div>
            <div className="text-lg font-black text-slate-800">{customers.length}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Active Users</div>
            <div className="text-lg font-black text-slate-800">{activeCount}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Total Revenue</div>
            <div className="text-lg font-black text-slate-800">₹{totalSpentAll.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Avg Spent / Cust</div>
            <div className="text-lg font-black text-slate-800">
              ₹{customers.length > 0 ? Math.round(totalSpentAll / customers.length).toLocaleString('en-IN') : 0}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-slate-150 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none transition-all"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none transition-all font-semibold text-slate-600 cursor-pointer"
        >
          <option value="all">All Retail Customers</option>
          <option value="ordered">Ordered At Least Once</option>
          <option value="unordered">No Orders Yet</option>
        </select>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-slate-150 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="py-24 text-center text-xs text-slate-400 font-semibold italic bg-white border border-slate-150 rounded-2xl">
          No matching customers found.
        </div>
      ) : (
        <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
                <th className="p-4">Customer Name</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Joined On</th>
                <th className="p-4 text-center">Orders Count</th>
                <th className="p-4">Total Spent</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer._id} className="border-b border-slate-150 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-black uppercase text-sm border border-rose-100">
                        {customer.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{customer.name}</div>
                        <div className="text-[10px] text-slate-400">ID: {customer._id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-700 font-medium">{customer.email}</div>
                    <div className="text-[10px] text-slate-400">{customer.phone || 'No phone'}</div>
                  </td>
                  <td className="p-4 text-slate-500">
                    {new Date(customer.createdAt || customer.joinedDate || Date.now()).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className="p-4 text-center font-bold text-slate-700">
                    {customer.totalOrders || 0}
                  </td>
                  <td className="p-4 font-black text-slate-850">
                    ₹{parseFloat(customer.totalSpent || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                      customer.status === 'Inactive' 
                        ? 'bg-slate-100 text-slate-600 border-slate-200' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      {customer.status || 'Active'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleOpenDetails(customer)}
                      className="inline-flex items-center space-x-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl font-bold cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>History</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Purchase History Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-3xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Customer Profile & History</h3>
              </div>
              <button 
                onClick={() => { setShowDetailsModal(false); setCustomerDetails(null); setCustomerOrders([]); }} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex-1 flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
              </div>
            ) : (
              <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
                {/* Profile detail cards */}
                {customerDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:col-span-2 space-y-3">
                      <h4 className="font-bold text-slate-700 border-b pb-1.5 uppercase tracking-wide">Contact Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-4 h-4 text-rose-600" />
                          <span>{customerDetails.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-4 h-4 text-rose-600" />
                          <span>{customerDetails.phone || 'No Phone Number'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4 text-rose-600" />
                          <span>Joined: {new Date(customerDetails.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 flex flex-col justify-center">
                      <div className="text-center border-b pb-2">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Lifetime Orders</div>
                        <div className="text-2xl font-black text-slate-800">{customerOrders.length}</div>
                      </div>
                      <div className="text-center pt-1.5">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Total Spend</div>
                        <div className="text-2xl font-black text-rose-600">₹{customerOrders.reduce((acc, o) => acc + (o.total || 0), 0).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Orders History timeline */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-rose-600" />
                    Transaction Logs
                  </h4>
                  
                  {customerOrders.length === 0 ? (
                    <div className="py-12 text-center border border-slate-200 rounded-xl text-slate-400 italic font-semibold">
                      This customer has not placed any orders yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {customerOrders.map(order => (
                        <div key={order._id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-slate-350 transition-colors">
                          <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 font-semibold text-slate-700">
                            <div className="flex gap-4">
                              <div>
                                <span className="block text-[9px] uppercase text-slate-400 font-black">Date Placed</span>
                                <span>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                              </div>
                              <div>
                                <span className="block text-[9px] uppercase text-slate-400 font-black">Order ID</span>
                                <span className="font-mono">{order.orderId}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="block text-[9px] uppercase text-slate-400 font-black">Total Paid</span>
                                <span className="font-black text-slate-850">₹{parseFloat(order.total || 0).toFixed(2)}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                order.orderStatus === 'Delivered' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : order.orderStatus === 'Cancelled'
                                  ? 'bg-rose-50 text-rose-700 border-rose-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>{order.orderStatus}</span>
                            </div>
                          </div>
                          <div className="divide-y divide-slate-100 bg-white">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="p-3.5 flex justify-between items-center text-xs">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400 border border-slate-100">
                                    <Package className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-800">{item.name}</div>
                                    <div className="text-[10px] text-slate-400">Qty: {item.quantity} {item.weight ? `(${item.weight})` : ''}</div>
                                  </div>
                                </div>
                                <div className="font-bold text-slate-700">₹{parseFloat(item.price * item.quantity).toFixed(2)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
