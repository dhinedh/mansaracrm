// src/pages/admin/AdminCompetitorsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, ShieldAlert, Tag, Building2, Store, User, 
  DollarSign, Download, Eye, X, Image as ImageIcon,
  TrendingDown, TrendingUp, Calendar, AlertTriangle
} from 'lucide-react';

export default function AdminCompetitorsPage() {
  const [intelList, setIntelList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [activeItem, setActiveItem] = useState(null);

  const fetchCompetitorIntel = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/field-sales/admin/competitors');
      if (res.data?.success) {
        setIntelList(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching competitor intel:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitorIntel();
  }, []);

  // Distinct Brands for quick filter
  const brands = Array.from(new Set(intelList.map(item => item.competitorBrand).filter(Boolean)));

  const filtered = intelList.filter(item => {
    const brandMatch = selectedBrand === 'ALL' || item.competitorBrand === selectedBrand;
    const q = search.toLowerCase();
    const searchMatch = !q ||
      item.competitorBrand?.toLowerCase().includes(q) ||
      item.productName?.toLowerCase().includes(q) ||
      item.storeName?.toLowerCase().includes(q) ||
      item.salespersonId?.name?.toLowerCase().includes(q);
    return brandMatch && searchMatch;
  });

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const headers = ['Competitor Brand', 'Product', 'Pack Size', 'MRP', 'Retailer Price', 'Schemes Offered', 'Store / Outlet', 'Reported By', 'Date'];
    const rows = filtered.map(i => [
      `"${i.competitorBrand || ''}"`,
      `"${i.productName || ''}"`,
      `"${i.packSize || ''}"`,
      i.mrp || 0,
      i.retailerPrice || 0,
      `"${(i.schemes || '').replace(/"/g, '""')}"`,
      `"${i.storeName || 'Market Store'}"`,
      `"${i.salespersonId?.name || 'Sales Rep'}"`,
      `"${new Date(i.createdAt || i.date).toLocaleDateString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Competitor_Intel_${new Date().toISOString().split('T')[0]}.csv`);
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
            Competitor Market Intelligence Feed
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time pricing, promotional schemes, and retail feedback captured by sales representatives in the field
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={!filtered.length}
          className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-sm self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Intel CSV</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Intel Reports</span>
            <Tag className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{intelList.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Submissions from field force</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Tracked Competitor Brands</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">{brands.length} Brands</div>
          <p className="text-[11px] text-slate-500 mt-1">Actively competing in retail shops</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Promotional Schemes</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {intelList.filter(i => i.schemes && i.schemes.trim().length > 0).length} Schemes
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Reported trade discount offers</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search competitor brand, product, or retail store..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 shadow-sm"
          />
        </div>

        {/* Brand Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedBrand('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              selectedBrand === 'ALL'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Brands
          </button>
          {brands.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setSelectedBrand(b)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 ${
                selectedBrand === b
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs">
          Loading competitor market data...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs shadow-sm">
          No competitor intelligence reports found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const marginEst = item.mrp && item.retailerPrice && item.mrp > item.retailerPrice 
              ? Math.round(((item.mrp - item.retailerPrice) / item.mrp) * 100)
              : null;

            return (
              <div 
                key={item._id || item.id} 
                className="bg-white border border-slate-200 hover:border-rose-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                        {item.competitorBrand}
                      </span>
                      <h3 className="text-sm font-black text-slate-800 mt-1.5 leading-tight">
                        {item.productName}
                      </h3>
                      {item.packSize && (
                        <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                          Pack Size: {item.packSize}
                        </span>
                      )}
                    </div>

                    {marginEst !== null && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {marginEst}% Margin
                      </span>
                    )}
                  </div>

                  {/* Pricing Comparison Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 my-3 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Competitor MRP</span>
                      <p className="text-xs font-black text-slate-800">
                        {item.mrp ? `₹${item.mrp}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Retailer Price</span>
                      <p className="text-xs font-black text-rose-600">
                        {item.retailerPrice ? `₹${item.retailerPrice}` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Schemes or Offers */}
                  {item.schemes && (
                    <div className="bg-rose-50/60 border border-rose-100 p-2.5 rounded-xl text-xs text-rose-800 mb-3">
                      <span className="font-bold block text-[10px] uppercase text-rose-600 mb-0.5">Active Scheme</span>
                      <p className="text-[11px] leading-snug">{item.schemes}</p>
                    </div>
                  )}

                  {/* Outlet & Rep Footer */}
                  <div className="space-y-1 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <p className="flex items-center gap-1.5 truncate">
                      <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.storeName || 'Retail Outlet'}</span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.salespersonId?.name || 'Sales Executive'}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{new Date(item.createdAt || item.date).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveItem(item)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Intel Details</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              {activeItem.competitorBrand}
            </span>
            <h3 className="text-base font-black text-slate-800 mt-1">
              {activeItem.productName}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Pack Size: {activeItem.packSize || 'Standard'} • Reported on {new Date(activeItem.createdAt || activeItem.date).toLocaleDateString()}
            </p>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Competitor MRP</span>
                  <p className="font-mono font-black text-slate-800 text-sm mt-0.5">
                    {activeItem.mrp ? `₹${activeItem.mrp}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Retailer Purchase Price</span>
                  <p className="font-mono font-black text-rose-600 text-sm mt-0.5">
                    {activeItem.retailerPrice ? `₹${activeItem.retailerPrice}` : 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Promotional Trade Scheme</span>
                <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                  {activeItem.schemes || 'No special schemes or buy-back reported.'}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Retailer Feedback & Perception</span>
                <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium whitespace-pre-wrap">
                  {activeItem.customerFeedback || 'Retailer expressed general acceptance of current market prices.'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px] space-y-1">
                <p><strong>Observed at Store:</strong> {activeItem.storeName || 'Retail Outlet'}</p>
                <p><strong>Logged By:</strong> {activeItem.salespersonId?.name || 'Sales Representative'} ({activeItem.salespersonId?.email || 'N/A'})</p>
              </div>

              {activeItem.photos && activeItem.photos.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Attached Shelf Photos</span>
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {activeItem.photos.map((photo, pIdx) => (
                      <img 
                        key={pIdx} 
                        src={photo} 
                        alt="Competitor Shelf" 
                        className="w-20 h-20 object-cover rounded-xl border border-slate-200" 
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveItem(null)}
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
