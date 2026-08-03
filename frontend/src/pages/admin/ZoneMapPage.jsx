// src/pages/admin/ZoneMapPage.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import {
  MapPin, Users, Search, RefreshCw, Layers, AlertTriangle,
  TrendingUp, ChevronRight, X, Building2, Phone, Eye,
  CheckCircle2, XCircle, BarChart3, Map
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TN_DISTRICTS = [
  { name: 'Chennai', coords: [13.0827, 80.2707], region: 'North' },
  { name: 'Tiruvallur', coords: [13.1394, 79.9071], region: 'North' },
  { name: 'Kanchipuram', coords: [12.8387, 79.7016], region: 'North' },
  { name: 'Chengalpattu', coords: [12.6934, 79.9756], region: 'North' },
  { name: 'Vellore', coords: [12.9165, 79.1325], region: 'North' },
  { name: 'Tirupathur', coords: [12.4934, 78.5678], region: 'North' },
  { name: 'Ranipet', coords: [12.9272, 79.3327], region: 'North' },
  { name: 'Tiruvannamalai', coords: [12.2272, 79.0700], region: 'North' },
  { name: 'Villupuram', coords: [11.9401, 79.4861], region: 'North' },
  { name: 'Kallakurichi', coords: [11.7380, 78.9634], region: 'North' },
  { name: 'Cuddalore', coords: [11.7480, 79.7714], region: 'North' },
  { name: 'Dharmapuri', coords: [12.1211, 78.1582], region: 'West' },
  { name: 'Krishnagiri', coords: [12.5266, 78.2145], region: 'West' },
  { name: 'Salem', coords: [11.6643, 78.1460], region: 'West' },
  { name: 'Namakkal', coords: [11.2189, 78.1674], region: 'West' },
  { name: 'Erode', coords: [11.3410, 77.7172], region: 'West' },
  { name: 'Tiruppur', coords: [11.1085, 77.3411], region: 'West' },
  { name: 'Coimbatore', coords: [11.0168, 76.9558], region: 'West' },
  { name: 'The Nilgiris', coords: [11.4167, 76.7000], region: 'West' },
  { name: 'Karur', coords: [10.9601, 78.0766], region: 'Central' },
  { name: 'Tiruchirappalli', coords: [10.7905, 78.7047], region: 'Central' },
  { name: 'Perambalur', coords: [11.2342, 78.8820], region: 'Central' },
  { name: 'Ariyalur', coords: [11.1401, 79.0786], region: 'Central' },
  { name: 'Thanjavur', coords: [10.7870, 79.1378], region: 'Central' },
  { name: 'Tiruvarur', coords: [10.7722, 79.6361], region: 'Delta' },
  { name: 'Nagapattinam', coords: [10.7656, 79.8433], region: 'Delta' },
  { name: 'Mayiladuthurai', coords: [11.1018, 79.6521], region: 'Delta' },
  { name: 'Pudukkottai', coords: [10.3797, 78.8203], region: 'South' },
  { name: 'Dindigul', coords: [10.3673, 77.9803], region: 'South' },
  { name: 'Theni', coords: [10.0104, 77.4768], region: 'South' },
  { name: 'Madurai', coords: [9.9252, 78.1198], region: 'South' },
  { name: 'Sivaganga', coords: [9.8433, 78.4809], region: 'South' },
  { name: 'Ramanathapuram', coords: [9.3639, 78.8395], region: 'South' },
  { name: 'Virudhunagar', coords: [9.5680, 77.9624], region: 'South' },
  { name: 'Tenkasi', coords: [8.9593, 77.3150], region: 'South' },
  { name: 'Tirunelveli', coords: [8.7139, 77.7567], region: 'South' },
  { name: 'Thoothukudi', coords: [8.7642, 78.1348], region: 'South' },
  { name: 'Kanniyakumari', coords: [8.0883, 77.5385], region: 'South' },
];

const REGION_COLORS = {
  North:   { fill: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', label: 'North TN' },
  West:    { fill: '#dcfce7', border: '#22c55e', text: '#15803d', label: 'West TN' },
  Central: { fill: '#fef9c3', border: '#eab308', text: '#854d0e', label: 'Central TN' },
  Delta:   { fill: '#e0f2fe', border: '#38bdf8', text: '#0369a1', label: 'Delta Region' },
  South:   { fill: '#fce7f3', border: '#ec4899', text: '#9d174d', label: 'South TN' },
};

function loadLeaflet() {
  return new Promise((resolve) => {
    if (window.L) { resolve(); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.crossOrigin = '';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

export default function ZoneMapPage() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(null);

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [hoveredDistrict, setHoveredDistrict] = useState(null);

  // Derived data
  const zoneMap = React.useMemo(() => {
    const map = {};
    dealers.forEach((d) => {
      if (d.approvalStatus === 'APPROVED' && d.user?.isActive) {
        (d.zones || []).forEach((z) => {
          if (!map[z]) map[z] = [];
          map[z].push(d);
        });
      }
    });
    return map;
  }, [dealers]);

  const stats = React.useMemo(() => {
    const covered = TN_DISTRICTS.filter((d) => zoneMap[d.name]?.length > 0).length;
    const conflicts = TN_DISTRICTS.filter((d) => (zoneMap[d.name]?.length || 0) > 1).length;
    return {
      total: TN_DISTRICTS.length,
      covered,
      uncovered: TN_DISTRICTS.length - covered,
      conflicts,
    };
  }, [zoneMap]);

  useEffect(() => {
    loadLeaflet().then(() => setLeafletLoaded(true));
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/dealers');
      setDealers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load dealers', err);
    } finally {
      setLoading(false);
    }
  };

  // Init map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [11.1271, 78.6569],
      zoom: 7,
      zoomControl: true,
      scrollWheelZoom: true,
    });
    mapInstanceRef.current = map;

    // Dark-ish map style for better contrast
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 18,
    }).addTo(map);

    markersRef.current = L.featureGroup().addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // Draw districts whenever dealers load
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current || !markersRef.current) return;
    const L = window.L;
    markersRef.current.clearLayers();

    TN_DISTRICTS.forEach((district) => {
      const assigned = zoneMap[district.name] || [];
      const isAssigned = assigned.length > 0;
      const hasConflict = assigned.length > 1;
      const regionColor = REGION_COLORS[district.region];

      let fillColor, borderColor, fillOpacity, weight;
      if (hasConflict) {
        fillColor = '#fde68a'; borderColor = '#d97706'; fillOpacity = 0.75; weight = 3;
      } else if (isAssigned) {
        fillColor = '#bbf7d0'; borderColor = '#16a34a'; fillOpacity = 0.7; weight = 2.5;
      } else {
        fillColor = regionColor.fill; borderColor = regionColor.border; fillOpacity = 0.4; weight = 1.5;
      }

      const radius = district.name === 'Chennai' ? 15000 : 20000;

      const circle = L.circle(district.coords, {
        color: borderColor,
        fillColor,
        fillOpacity,
        weight,
        radius,
      });

      // Label
      const labelIcon = L.divIcon({
        className: '',
        html: `<div style="
          font-size:9px;font-weight:800;
          color:${isAssigned ? '#065f46' : '#475569'};
          white-space:nowrap;
          text-shadow:0 0 4px white,0 0 4px white,0 0 4px white;
          pointer-events:none;
        ">${district.name}${isAssigned ? ' ✓' : ''}</div>`,
        iconAnchor: [30, 4],
      });
      L.marker(district.coords, { icon: labelIcon, interactive: false }).addTo(markersRef.current);

      // Popup
      const dealerList = assigned
        .slice(0, 3)
        .map((d) => `<div style="display:flex;align-items:center;gap:4px;margin-top:4px;"><span style="width:6px;height:6px;background:#16a34a;border-radius:50%;display:inline-block;flex-shrink:0;"></span><span style="font-weight:700">${d.companyName}</span></div>`)
        .join('');

      const moreCount = assigned.length - 3;
      const popup = `
        <div style="font-family:system-ui,sans-serif;font-size:11px;line-height:1.5;min-width:150px;max-width:200px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <strong style="font-size:13px;color:#1e293b;">${district.name}</strong>
            <span style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;padding:1px 6px;border-radius:999px;background:${regionColor.fill};color:${regionColor.text};border:1px solid ${regionColor.border};">${district.region}</span>
          </div>
          ${isAssigned
            ? `<div style="color:#16a34a;font-weight:bold;font-size:10px;margin-bottom:4px;">✔ ${assigned.length} Dealer${assigned.length > 1 ? 's' : ''} Assigned${hasConflict ? ' ⚠️ Overlap' : ''}</div>${dealerList}${moreCount > 0 ? `<div style="color:#94a3b8;font-size:10px;margin-top:4px;">+ ${moreCount} more...</div>` : ''}`
            : `<div style="color:#94a3b8;font-weight:600;font-size:10px;">No dealer assigned</div>`
          }
          <div style="margin-top:8px;font-size:10px;color:#64748b;border-top:1px solid #f1f5f9;padding-top:6px;">Click to view details</div>
        </div>`;

      circle.bindPopup(popup);
      circle.on('click', () => setSelectedDistrict(district.name));
      circle.on('mouseover', function () { this.openPopup(); setHoveredDistrict(district.name); });
      circle.on('mouseout', () => setHoveredDistrict(null));

      circle.addTo(markersRef.current);
    });
  }, [leafletLoaded, zoneMap]);

  const filteredDistricts = React.useMemo(() => {
    return TN_DISTRICTS.filter((d) => {
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
      const matchRegion = selectedRegion === 'All' || d.region === selectedRegion;
      return matchSearch && matchRegion;
    });
  }, [search, selectedRegion]);

  const selectedDealers = selectedDistrict ? (zoneMap[selectedDistrict] || []) : [];

  const flyTo = (district) => {
    if (!mapInstanceRef.current) return;
    const d = TN_DISTRICTS.find((x) => x.name === district);
    if (d) mapInstanceRef.current.setView(d.coords, 10, { animate: true });
    setSelectedDistrict(district);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Map className="w-5 h-5 text-rose-600" />
            Territory Zone Map
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Interactive map of Tamil Nadu dealer territory allocations across all {TN_DISTRICTS.length} districts.
          </p>
        </div>
        <button
          onClick={fetchDealers}
          disabled={loading}
          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Districts', value: stats.total, icon: Layers, color: 'slate', bg: 'bg-slate-50', text: 'text-slate-600' },
          { label: 'Zones Covered', value: stats.covered, icon: CheckCircle2, color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600' },
          { label: 'Uncovered Zones', value: stats.uncovered, icon: XCircle, color: 'rose', bg: 'bg-rose-50', text: 'text-rose-600' },
          { label: 'Zone Conflicts', value: stats.conflicts, icon: AlertTriangle, color: 'amber', bg: 'bg-amber-50', text: 'text-amber-600' },
        ].map(({ label, value, icon: Icon, bg, text }) => (
          <div key={label} className="bg-white border border-slate-150 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className={`p-2.5 rounded-xl ${bg} shrink-0`}>
              <Icon className={`w-5 h-5 ${text}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
              <p className={`text-xl font-black ${text}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel — Map */}
        <div className="xl:col-span-2 bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-600" />
              Interactive Territory Map
            </h3>
            <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-emerald-600 inline-block" /> Assigned</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-300 border-2 border-amber-600 inline-block" /> Conflict</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-200 border-2 border-slate-400 inline-block" /> Open</span>
            </div>
          </div>

          {!leafletLoaded ? (
            <div className="h-[500px] flex items-center justify-center text-slate-400 space-y-2 flex-col">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
              <p className="text-xs font-semibold">Loading map engine...</p>
            </div>
          ) : (
            <div ref={mapRef} style={{ height: '500px', width: '100%' }} />
          )}

          {/* Region color key */}
          <div className="px-4 py-2.5 border-t border-slate-100 flex flex-wrap gap-2">
            {Object.entries(REGION_COLORS).map(([key, val]) => (
              <span key={key} className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border" style={{ backgroundColor: val.fill, color: val.text, borderColor: val.border }}>
                {val.label}
              </span>
            ))}
          </div>
        </div>

        {/* Right Panel — Districts sidebar */}
        <div className="bg-white border border-slate-150 rounded-2xl shadow-sm flex flex-col overflow-hidden" style={{ maxHeight: '600px' }}>
          <div className="px-4 py-3 border-b border-slate-100 space-y-2">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-rose-600" />
              District Directory
            </h3>
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search district..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-slate-50 border border-slate-200 focus:border-rose-400 rounded-lg focus:outline-none transition-all"
              />
            </div>
            {/* Region filter */}
            <div className="flex flex-wrap gap-1">
              {['All', ...Object.keys(REGION_COLORS)].map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(r)}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                    selectedRegion === r
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-rose-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* District list */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
            {filteredDistricts.map((district) => {
              const assigned = zoneMap[district.name] || [];
              const isConflict = assigned.length > 1;
              const regionColor = REGION_COLORS[district.region];
              const isSelected = selectedDistrict === district.name;

              return (
                <button
                  key={district.name}
                  onClick={() => flyTo(district.name)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-all cursor-pointer ${isSelected ? 'bg-rose-50 border-l-2 border-rose-500' : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isConflict ? 'bg-amber-500' : assigned.length > 0 ? 'bg-emerald-500' : 'bg-slate-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-700 truncate">{district.name}</span>
                      <span className="text-[8px] font-bold px-1.5 py-0 rounded-full flex-shrink-0" style={{ backgroundColor: regionColor.fill, color: regionColor.text }}>
                        {district.region}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {assigned.length > 0
                        ? <span className={`font-semibold ${isConflict ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {assigned.length} dealer{assigned.length > 1 ? 's' : ''}{isConflict ? ' ⚠ overlap' : ''}
                          </span>
                        : <span className="text-slate-400">Unassigned</span>
                      }
                    </p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
                </button>
              );
            })}
            {filteredDistricts.length === 0 && (
              <p className="px-4 py-8 text-center text-slate-400 text-xs italic">No districts found</p>
            )}
          </div>
        </div>
      </div>

      {/* District Detail Panel */}
      {selectedDistrict && (
        <div className="bg-white border border-slate-150 rounded-2xl shadow-sm p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 rounded-xl">
                <MapPin className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-800">{selectedDistrict}</h3>
                <p className="text-[10px] text-slate-400">
                  {REGION_COLORS[TN_DISTRICTS.find((d) => d.name === selectedDistrict)?.region]?.label} •{' '}
                  {selectedDealers.length > 0
                    ? `${selectedDealers.length} dealer${selectedDealers.length > 1 ? 's' : ''} assigned`
                    : 'No dealer assigned'}
                </p>
              </div>
            </div>
            <button onClick={() => setSelectedDistrict(null)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-all cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedDealers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <XCircle className="w-10 h-10 mx-auto mb-2 text-slate-200" />
              <p className="text-sm font-semibold">No active dealer in this zone</p>
              <p className="text-xs mt-1">Assign a dealer from the Dealers page</p>
              <button
                onClick={() => navigate('/admin/dealers')}
                className="mt-3 text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
              >
                Go to Dealers →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedDealers.map((dealer) => (
                <div
                  key={dealer.id}
                  className="border border-slate-100 rounded-xl p-3 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer group"
                  onClick={() => navigate('/admin/dealers', { state: { dealerId: dealer.id } })}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0">
                        {(dealer.companyName || 'D').charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-tight">{dealer.companyName}</p>
                        <span className={`text-[9px] font-black px-1.5 py-0 rounded-full ${
                          dealer.dealerCategory === 'SUPER' ? 'bg-purple-100 text-purple-700' :
                          dealer.dealerCategory === 'PREMIUM' ? 'bg-amber-100 text-amber-700' :
                          dealer.dealerCategory === 'GROWTH' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {dealer.dealerCategory || 'STARTER'}
                        </span>
                      </div>
                    </div>
                    <Eye className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                  </div>
                  <div className="space-y-1 text-[10px] text-slate-500">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span>{dealer.phone || '—'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{dealer.city || dealer.address || '—'}</span>
                    </p>
                    {(dealer.zones || []).length > 1 && (
                      <p className="text-[9px] text-slate-400 mt-1">
                        Also covers: {(dealer.zones || []).filter((z) => z !== selectedDistrict).slice(0, 2).join(', ')}
                        {(dealer.zones || []).length - 1 > 2 ? ' ...' : ''}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Coverage Summary by Region */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-sm p-5">
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-4">
          <TrendingUp className="w-4 h-4 text-rose-600" />
          Coverage Summary by Region
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(REGION_COLORS).map(([region, colors]) => {
            const regionDistricts = TN_DISTRICTS.filter((d) => d.region === region);
            const covered = regionDistricts.filter((d) => (zoneMap[d.name]?.length || 0) > 0).length;
            const pct = Math.round((covered / regionDistricts.length) * 100);
            return (
              <div key={region} className="rounded-xl p-3 border" style={{ backgroundColor: colors.fill, borderColor: colors.border }}>
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: colors.text }}>{colors.label}</p>
                <p className="text-2xl font-black mt-1" style={{ color: colors.text }}>{pct}%</p>
                <div className="w-full bg-white/60 rounded-full h-1.5 mt-2">
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: colors.border }} />
                </div>
                <p className="text-[9px] mt-1.5 font-semibold" style={{ color: colors.text }}>
                  {covered}/{regionDistricts.length} districts
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
