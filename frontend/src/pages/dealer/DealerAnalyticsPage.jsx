// src/pages/dealer/DealerAnalyticsPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, RefreshCw, Store, AlertTriangle, AlertCircle } from 'lucide-react';

export default function DealerAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/analytics/dealer');
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
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Dealer Sales Analytics</h2>
          <p className="text-slate-500 text-xs">Analyze retail store performance, identify fast moving stock, and inspect warning alerts.</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Store Sales Chart */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-2 uppercase tracking-wider">
            <Store className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Store Outlet Revenue Breakdown</span>
          </h3>
          <div className="h-64">
            {data?.storeSales?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.storeSales}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Bar dataKey="totalSales" fill="#be123c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">No data available</div>
            )}
          </div>
        </div>

        {/* Fast Movers list */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-2 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Fast Moving Products</span>
          </h3>
          <div className="space-y-3.5 max-h-64 overflow-y-auto pt-2">
            {data?.fastMovers?.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400 font-semibold">
                No billing movements recorded.
              </div>
            ) : (
              data?.fastMovers?.map(item => (
                <div key={item.productId} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800">{item.name}</h4>
                    <span className="text-[9px] font-black text-rose-600 block">SKU: {item.sku}</span>
                  </div>
                  <strong className="font-black text-slate-700 bg-white border border-slate-100 px-3 py-1 rounded-lg">
                    {item.quantitySold} sold
                  </strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low stock alerts panel */}
      {data?.lowStockAlerts?.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-amber-800 flex items-center space-x-2 uppercase tracking-wider animate-pulse">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Stock Replenishment Required</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.lowStockAlerts.map(item => (
              <div key={item.productId} className="bg-white border border-amber-100 p-4 rounded-xl flex items-center justify-between text-xs shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-800 truncate max-w-[120px]">{item.name}</h4>
                  <span className="text-[9px] font-black text-rose-600 block">SKU: {item.sku}</span>
                </div>
                <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg text-[10px]">
                  {item.quantity} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
