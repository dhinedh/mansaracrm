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
  PlusCircle
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
import { useNavigate } from 'react-router-dom';

const COLORS = ['#be123c', '#475569', '#0d9488', '#ea580c', '#6366f1'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
    </div>
  );
}
