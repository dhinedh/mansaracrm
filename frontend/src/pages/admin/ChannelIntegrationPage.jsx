// src/pages/admin/ChannelIntegrationPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Cable,
  ShoppingBag,
  Globe,
  Store,
  Users,
  Search,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  X,
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Tag,
  IndianRupee,
  ExternalLink,
  Zap,
  TrendingUp
} from 'lucide-react';

export default function ChannelIntegrationPage() {
  const [activeSection, setActiveSection] = useState('b2c'); // 'b2c' | 'channels'

  // B2C section states
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPromoted, setFilterPromoted] = useState('all'); // 'all' | 'promoted' | 'not_promoted'

  // Promote modal states
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [promoting, setPromoting] = useState(false);
  const [promoteResult, setPromoteResult] = useState(null);
  const [promoteError, setPromoteError] = useState('');

  // Promote form fields
  const [pmCompanyName, setPmCompanyName] = useState('');
  const [pmGstNumber, setPmGstNumber] = useState('');
  const [pmDealerType, setPmDealerType] = useState('RETAIL');
  const [pmDealerCategory, setPmDealerCategory] = useState('STARTER');
  const [pmBillingProfile, setPmBillingProfile] = useState('NORMAL');
  const [pmDefaultMargin, setPmDefaultMargin] = useState('0');

  useEffect(() => {
    fetchB2CCustomers();
  }, []);

  const fetchB2CCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/ecom/b2c/customers');
      if (res.data.success) {
        setCustomers(res.data.customers || []);
      }
    } catch (err) {
      console.error('Failed to load B2C customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const openPromoteModal = (customer) => {
    setSelectedCustomer(customer);
    setPmCompanyName(customer.name || '');
    setPmGstNumber('');
    setPmDealerType('RETAIL');
    setPmDealerCategory('STARTER');
    setPmBillingProfile('NORMAL');
    setPmDefaultMargin('0');
    setPromoteResult(null);
    setPromoteError('');
    setShowPromoteModal(true);
  };

  const handlePromote = async (e) => {
    e.preventDefault();
    setPromoting(true);
    setPromoteError('');
    setPromoteResult(null);
    try {
      const res = await axios.post(`/ecom/b2c/customers/${selectedCustomer._id}/promote`, {
        companyName: pmCompanyName,
        gstNumber: pmGstNumber,
        dealerType: pmDealerType,
        dealerCategory: pmDealerCategory,
        billingProfile: pmBillingProfile,
        defaultMargin: parseFloat(pmDefaultMargin) || 0
      });
      if (res.data.success) {
        setPromoteResult(res.data.data);
        // Update local state so the badge shows immediately
        setCustomers(prev => prev.map(c =>
          c._id === selectedCustomer._id ? { ...c, isPromoted: true, crmDealerId: res.data.data.dealerId } : c
        ));
      }
    } catch (err) {
      setPromoteError(err.response?.data?.message || 'Failed to promote customer. Please try again.');
    } finally {
      setPromoting(false);
    }
  };

  const closeModal = () => {
    setShowPromoteModal(false);
    setSelectedCustomer(null);
    setPromoteResult(null);
    setPromoteError('');
  };

  // Filter
  const filtered = customers.filter(c => {
    const query = search.toLowerCase();
    const matchSearch = (c.name || '').toLowerCase().includes(query) ||
      (c.email || '').toLowerCase().includes(query) ||
      (c.phone || '').includes(query);
    const matchFilter =
      filterPromoted === 'all' ? true :
      filterPromoted === 'promoted' ? c.isPromoted :
      !c.isPromoted;
    return matchSearch && matchFilter;
  });

  const promotedCount = customers.filter(c => c.isPromoted).length;
  const notPromotedCount = customers.filter(c => !c.isPromoted).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Cable className="w-5 h-5 text-rose-600" />
            Channel Integration
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Bridge B2C retail customers into the B2B CRM dealer network for unified billing and stock management.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchB2CCustomers}
            className="inline-flex items-center space-x-1.5 text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Section Toggle */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveSection('b2c')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold border-b-2 -mb-px transition-all ${
            activeSection === 'b2c' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>B2C → Dealer Bridge</span>
          {notPromotedCount > 0 && (
            <span className="ml-1 bg-rose-100 text-rose-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-rose-200">
              {notPromotedCount} pending
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('channels')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold border-b-2 -mb-px transition-all ${
            activeSection === 'channels' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>External Channels</span>
        </button>
      </div>

      {activeSection === 'b2c' && (
        <div className="space-y-5">
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total B2C Accounts', value: customers.length, icon: Users, color: 'rose' },
              { label: 'Promoted to CRM', value: promotedCount, icon: CheckCircle2, color: 'emerald' },
              { label: 'Not Yet Promoted', value: notPromotedCount, icon: AlertCircle, color: 'amber' },
              {
                label: 'Total B2C Revenue',
                value: `₹${customers.reduce((a, c) => a + (c.totalSpent || 0), 0).toLocaleString('en-IN')}`,
                icon: TrendingUp,
                color: 'indigo'
              }
            ].map(stat => {
              const Icon = stat.icon;
              const colors = {
                rose: 'bg-rose-50 text-rose-600',
                emerald: 'bg-emerald-50 text-emerald-600',
                amber: 'bg-amber-50 text-amber-600',
                indigo: 'bg-indigo-50 text-indigo-600'
              };
              return (
                <div key={stat.label} className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${colors[stat.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{stat.label}</div>
                    <div className="text-lg font-black text-slate-800">{stat.value}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* How It Works Banner */}
          <div className="bg-gradient-to-r from-indigo-50 to-rose-50 border border-indigo-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl border border-indigo-100 shadow-sm flex items-center justify-center text-indigo-600">
              <Zap className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-slate-800 text-xs mb-1">How B2C → Dealer Promotion Works</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Select any B2C customer from the list below and click <strong>"Promote to Dealer"</strong>. 
                A CRM Dealer account is auto-created from their profile. Their e-com orders remain linked, 
                and they gain access to wholesale invoicing, stock transfers, and the CRM dealer portal. 
                A login password is auto-generated and shown to you.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 shrink-0">
              <div className="flex flex-col items-center gap-1">
                <ShoppingBag className="w-4 h-4 text-rose-500" />
                <span>B2C Store</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300" />
              <div className="flex flex-col items-center gap-1">
                <Cable className="w-4 h-4 text-indigo-500" />
                <span>Bridge</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300" />
              <div className="flex flex-col items-center gap-1">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>CRM Dealer</span>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white border border-slate-150 rounded-2xl p-4 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none transition-all"
              />
            </div>
            <select
              value={filterPromoted}
              onChange={e => setFilterPromoted(e.target.value)}
              className="px-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none font-semibold text-slate-600 cursor-pointer"
            >
              <option value="all">All Customers</option>
              <option value="not_promoted">Not Yet Promoted</option>
              <option value="promoted">Already Promoted</option>
            </select>
          </div>

          {/* Customer Table */}
          {loading ? (
            <div className="flex justify-center items-center py-20 bg-white border border-slate-150 rounded-2xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center text-xs text-slate-400 font-semibold italic bg-white border border-slate-150 rounded-2xl">
              No customers found.
            </div>
          ) : (
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Orders</th>
                    <th className="p-4">Revenue</th>
                    <th className="p-4">CRM Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(customer => (
                    <tr key={customer._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-black uppercase text-sm border border-rose-100 shrink-0">
                            {customer.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{customer.name}</div>
                            <div className="text-[10px] text-slate-400">
                              Joined: {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-600 mb-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{customer.phone || customer.whatsapp || 'No phone'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-700">{customer.totalOrders || 0}</span>
                        <span className="text-slate-400 ml-1">orders</span>
                      </td>
                      <td className="p-4 font-black text-slate-800">
                        ₹{parseFloat(customer.totalSpent || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4">
                        {customer.isPromoted ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              CRM Dealer
                            </span>
                            <div className="text-[9px] text-slate-400 font-mono">
                              ID: {(customer.crmDealerId || '').substring(0, 10)}...
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-100">
                            <AlertCircle className="w-2.5 h-2.5" />
                            B2C Only
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {customer.isPromoted ? (
                          <button
                            onClick={() => window.open(`/admin/dealers`, '_self')}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View in CRM
                          </button>
                        ) : (
                          <button
                            onClick={() => openPromoteModal(customer)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-xl shadow-sm transition-all cursor-pointer"
                          >
                            <ArrowRight className="w-3 h-3" />
                            Promote
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSection === 'channels' && (
        <div className="space-y-5">
          <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 text-xs">Under Development — Channel Router Architecture</p>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                Channel Integration will serve as the master gateway connecting Mansara Foods' central inventory database 
                directly to external platforms. When enabled, stock adjustments in the Cockpit will update listings instantly across channels.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                name: 'Self Storefront Website',
                desc: 'Sync direct B2C sales from mansarafoods.com to adjust central stock counts. B2C customers can be promoted to CRM Dealer accounts.',
                icon: Globe,
                status: 'Active (B2C Bridge)',
                statusColor: 'emerald',
                feature: 'B2C → Dealer bridge live'
              },
              {
                name: 'Amazon Seller Portal',
                desc: 'Auto-update FBA/FBM listing quantities and pull order receipts into billing.',
                icon: ShoppingBag,
                status: 'Scheduled',
                statusColor: 'amber',
                feature: 'Coming Q3 2025'
              },
              {
                name: 'Dealers B2B Portal',
                desc: 'Link wholesale stock levels for dealers to review live before placing PO requests.',
                icon: Store,
                status: 'Active (B2B)',
                statusColor: 'rose',
                feature: 'Core CRM module'
              }
            ].map((c) => {
              const Icon = c.icon;
              const sc = c.statusColor;
              const statusClasses = {
                emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
                amber: 'bg-amber-50 border-amber-100 text-amber-700',
                rose: 'bg-rose-50 border-rose-100 text-rose-700'
              };
              return (
                <div key={c.name} className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-xs">{c.name}</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{c.desc}</p>
                    <p className="text-[10px] font-bold text-indigo-600">{c.feature}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-[9px]">
                    <span className="text-slate-400 font-medium">Integration Status:</span>
                    <span className={`${statusClasses[sc]} px-2 py-0.5 rounded-full font-black uppercase tracking-wider border`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Promote to Dealer Modal */}
      {showPromoteModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden animate-zoom-in my-8">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-indigo-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                  {selectedCustomer.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm">Promote to CRM Dealer</h3>
                  <p className="text-[11px] text-slate-500">{selectedCustomer.name} — {selectedCustomer.email}</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {promoteResult ? (
                /* Success State */
                <div className="space-y-5 text-center py-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm mb-1">Dealer Account Created!</h4>
                    <p className="text-[11px] text-slate-500">{selectedCustomer.name} is now a CRM Dealer.</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Dealer ID</span>
                      <span className="font-mono text-slate-700 font-bold">{promoteResult.dealerId?.substring(0, 16)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Email</span>
                      <span className="font-semibold text-slate-700">{promoteResult.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Temp Password</span>
                      <span className="font-mono bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg font-bold">
                        {promoteResult.defaultPassword}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Share the temp password with the dealer. They can change it after first login.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={closeModal}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-colors cursor-pointer text-xs"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => { closeModal(); window.location.href = '/admin/dealers'; }}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl shadow-sm transition-all cursor-pointer text-xs flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Go to Dealers
                    </button>
                  </div>
                </div>
              ) : (
                /* Form State */
                <form onSubmit={handlePromote} className="space-y-4 text-xs">
                  {/* Customer Profile Preview */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{selectedCustomer.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <ShoppingBag className="w-3 h-3 text-slate-400" />
                      <span>{selectedCustomer.totalOrders || 0} orders</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <IndianRupee className="w-3 h-3 text-slate-400" />
                      <span>₹{parseFloat(selectedCustomer.totalSpent || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {promoteError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 font-semibold text-[11px] flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {promoteError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-500 font-bold mb-1">Company / Trading Name *</label>
                      <input
                        required
                        type="text"
                        value={pmCompanyName}
                        onChange={e => setPmCompanyName(e.target.value)}
                        placeholder="e.g. ABC Stores"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">GST Number</label>
                      <input
                        type="text"
                        value={pmGstNumber}
                        onChange={e => setPmGstNumber(e.target.value)}
                        placeholder="Optional"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Default Margin (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={pmDefaultMargin}
                        onChange={e => setPmDefaultMargin(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Dealer Type */}
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Dealer Type</label>
                    <select
                      value={pmDealerType}
                      onChange={e => setPmDealerType(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer"
                    >
                      <option value="RETAIL">Retail</option>
                      <option value="WHOLESALE">Wholesale</option>
                      <option value="DISTRIBUTOR">Distributor</option>
                    </select>
                  </div>

                  {/* Tier */}
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Dealer Tier</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['STARTER', 'GROWTH', 'PREMIUM', 'SUPER'].map(tier => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setPmDealerCategory(tier)}
                          className={`py-1.5 rounded-xl text-[10px] font-black border transition-all ${
                            pmDealerCategory === tier
                              ? tier === 'SUPER' ? 'bg-purple-600 text-white border-purple-600'
                                : tier === 'PREMIUM' ? 'bg-amber-500 text-white border-amber-500'
                                : tier === 'GROWTH' ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-slate-600 text-white border-slate-600'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-rose-300'
                          }`}
                        >
                          {tier === 'SUPER' ? '⭐' : tier === 'PREMIUM' ? '🥇' : tier === 'GROWTH' ? '📈' : '🌱'}
                          <div className="mt-0.5">{tier}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Billing Profile */}
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Billing Profile</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'NORMAL', label: '📄 Normal', desc: 'Invoice on delivery' },
                        { value: 'ADVANCE', label: '⚡ Advance', desc: 'Payment before dispatch' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPmBillingProfile(opt.value)}
                          className={`py-2.5 px-3 rounded-xl text-[11px] font-black border transition-all text-left cursor-pointer ${
                            pmBillingProfile === opt.value
                              ? opt.value === 'ADVANCE' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-700 text-white border-slate-700'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-rose-300'
                          }`}
                        >
                          <div>{opt.label}</div>
                          <div className={`text-[9px] font-medium mt-0.5 ${pmBillingProfile === opt.value ? 'opacity-80' : 'text-slate-400'}`}>{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={promoting}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {promoting ? (
                        <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating...</>
                      ) : (
                        <><ArrowRight className="w-3.5 h-3.5" /> Promote to Dealer</>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
