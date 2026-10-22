// src/pages/admin/AdminBeatsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MapPin, Users, Store, CheckCircle2, Search, 
  Calendar, ArrowRight, Save, Layers, Edit3 
} from 'lucide-react';

export default function AdminBeatsPage() {
  const [beatsData, setBeatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState('');
  const [beatRouteName, setBeatRouteName] = useState('');
  const [assignedZones, setAssignedZones] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchBeats = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/field-sales/admin/beats');
      if (res.data?.success) {
        setBeatsData(res.data.data);
        if (res.data.data.beats?.length > 0) {
          const first = res.data.data.beats[0];
          setSelectedExecutiveId(first.salesperson?._id || first.profile?.userId?._id);
          setBeatRouteName(first.assignedBeat || 'Beat Route A');
          setAssignedZones(first.assignedZones?.join(', ') || 'Chennai North');
        }
      }
    } catch (err) {
      console.error('Error fetching beats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeats();
  }, []);

  const handleSelectExecutive = (item) => {
    const uid = item.salesperson?._id || item.profile?.userId?._id || item.profile?.userId;
    setSelectedExecutiveId(uid);
    setBeatRouteName(item.assignedBeat || '');
    setAssignedZones(item.assignedZones?.join(', ') || '');
  };

  const handleSaveBeat = async (e) => {
    e.preventDefault();
    if (!selectedExecutiveId || !beatRouteName) return;

    setSaving(true);
    try {
      const zonesArray = assignedZones.split(',').map(z => z.trim()).filter(Boolean);
      const res = await axios.post('/field-sales/admin/beats/assign', {
        salespersonId: selectedExecutiveId,
        activeBeatRoute: beatRouteName,
        assignedZones: zonesArray
      });

      if (res.data?.success) {
        alert('Beat route and territory mapping saved!');
        fetchBeats();
      }
    } catch (err) {
      alert('Failed to update beat route');
    } finally {
      setSaving(false);
    }
  };

  const beats = beatsData?.beats || [];
  const stores = beatsData?.stores || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          Beat & Route Master Planning
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Cluster retail shops into daily beat routes (Monday–Saturday) and allocate territories to sales executives
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Field Beats</span>
          <div className="text-2xl font-black text-slate-800 mt-1">{beats.length} Active Routes</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Assigned to sales executives</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Retail Stores</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{stores.length} Retail Outlets</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Mapped to distributors</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Coverage Balance</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">100% Territory Covered</div>
          <p className="text-[10px] text-slate-500 mt-0.5">No unassigned retail zones</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Beat Roster List */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 pb-3 border-b border-slate-100 flex items-center justify-between">
            <span>Salesperson Beats Roster</span>
            <span className="text-xs text-slate-400 font-normal">Select to edit</span>
          </h3>

          <div className="space-y-2">
            {beats.map((b, idx) => {
              const uid = b.salesperson?._id || b.profile?.userId?._id || b.profile?.userId;
              const isSelected = selectedExecutiveId === uid;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectExecutive(b)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-rose-50 border-rose-300 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-800">
                      {b.salesperson?.name || 'Sales Officer'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                      {b.profile?.employeeCode || 'SALES'}
                    </span>
                  </div>
                  <p className="text-xs text-rose-600 font-semibold flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{b.assignedBeat || 'Unassigned'}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 cols: Edit Beat Assignment & Stores in Beat */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Beat Assignment Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 pb-3 border-b border-slate-100">
              Configure Selected Beat Route
            </h3>

            <form onSubmit={handleSaveBeat} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Beat Route Title / Schedule *</label>
                <input
                  type="text"
                  required
                  value={beatRouteName}
                  onChange={(e) => setBeatRouteName(e.target.value)}
                  placeholder="e.g. Beat B - T. Nagar & Kodambakkam Retail Circuit"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Assigned Commercial Zones</label>
                <input
                  type="text"
                  value={assignedZones}
                  onChange={(e) => setAssignedZones(e.target.value)}
                  placeholder="Chennai Central, T.Nagar, Vadapalani"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Update Beat Assignment'}</span>
              </button>
            </form>
          </div>

          {/* Stores in Database sample table */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Registered Retail Stores ({stores.length})
              </h3>
              <span className="text-xs text-slate-400">Available for beat clustering</span>
            </div>

            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Shop Name</th>
                    <th className="px-4 py-2.5">Phone</th>
                    <th className="px-4 py-2.5">Address / Area</th>
                    <th className="px-4 py-2.5">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {stores.slice(0, 15).map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-bold text-slate-800">{s.name}</td>
                      <td className="px-4 py-2 text-slate-500">{s.phone}</td>
                      <td className="px-4 py-2 truncate max-w-xs">{s.address || 'Chennai'}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {s.category || 'Retail'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
