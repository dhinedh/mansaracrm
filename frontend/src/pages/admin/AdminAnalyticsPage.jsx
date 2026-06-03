// src/pages/admin/AdminAnalyticsPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
  Cell,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, Award, Map, RefreshCw } from 'lucide-react';

const COLORS = ['#be123c', '#0d9488', '#ea580c', '#6366f1', '#475569'];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Business Intelligence</h2>
          <p className="text-slate-500 text-xs">Visualize sales by territory, track dealer performance, and examine product movements.</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Territory Sales (Area sales) */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-2 uppercase tracking-wider">
            <Map className="w-4 h-4 text-rose-600" />
            <span>Territory Sales (Area distribution)</span>
          </h3>
          <div className="h-64">
            {data?.areaSales?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.areaSales} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={80} />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">No data available</div>
            )}
          </div>
        </div>

        {/* Product movement */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-2 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-rose-600" />
            <span>Product Movement Dispatches</span>
          </h3>
          <div className="h-64">
            {data?.productMovement?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.productMovement}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="sku" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="quantityTransferred" fill="#be123c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard Grid */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-sm p-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-2 uppercase tracking-wider">
          <Award className="w-4 h-4 text-rose-600" />
          <span>Top Dealer Partners Leaderboard</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4">Rank</th>
                <th className="p-4">Dealer / Firm</th>
                <th className="p-4 text-right">Revenue Contributed</th>
              </tr>
            </thead>
            <tbody>
              {data?.dealerPerformance?.map((item, idx) => (
                <tr key={item.dealerId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-400">#{idx + 1}</td>
                  <td className="p-4 font-bold text-slate-800">{item.companyName}</td>
                  <td className="p-4 text-right font-black text-rose-600">₹{parseFloat(item.totalAmount).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
