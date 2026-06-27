import React, { useEffect, useRef, useState } from 'react';
import { MapPin, ArrowLeft, Loader2, HelpCircle, Layers } from 'lucide-react';

const TAMIL_NADU_DISTRICTS = [
  { name: 'Chennai', coords: [13.0827, 80.2707], isCity: true },
  { name: 'Coimbatore', coords: [11.0168, 76.9558], isCity: true },
  { name: 'Madurai', coords: [9.9252, 78.1198], isCity: true },
  { name: 'Tiruchirappalli', coords: [10.7905, 78.7047], isCity: true },
  { name: 'Salem', coords: [11.6643, 78.1460], isCity: true },
  { name: 'Tirunelveli', coords: [8.7139, 77.7567] },
  { name: 'Vellore', coords: [12.9165, 79.1325] },
  { name: 'Erode', coords: [11.3410, 77.7172] },
  { name: 'Thoothukudi', coords: [8.7642, 78.1348] },
  { name: 'Thanjavur', coords: [10.7870, 79.1378] },
  { name: 'Tiruppur', coords: [11.1085, 77.3411] },
  { name: 'Kanchipuram', coords: [12.8387, 79.7016] },
  { name: 'Tiruvallur', coords: [13.1394, 79.9071] },
  { name: 'Cuddalore', coords: [11.7480, 79.7714] },
  { name: 'Villupuram', coords: [11.9401, 79.4861] },
  { name: 'Dindigul', coords: [10.3673, 77.9803] },
  { name: 'Karur', coords: [10.9601, 78.0766] },
  { name: 'Namakkal', coords: [11.2189, 78.1674] },
  { name: 'Thiruvarur', coords: [10.7722, 79.6361] },
  { name: 'Nagapattinam', coords: [10.7656, 79.8433] },
  { name: 'Pudukkottai', coords: [10.3797, 78.8203] },
  { name: 'Ramanathapuram', coords: [9.3639, 78.8395] },
  { name: 'Sivaganga', coords: [9.8433, 78.4809] },
  { name: 'Virudhunagar', coords: [9.5680, 77.9624] },
  { name: 'Theni', coords: [10.0104, 77.4768] },
  { name: 'Tenkasi', coords: [8.9593, 77.3150] },
  { name: 'Kanniyakumari', coords: [8.0883, 77.5385] },
  { name: 'Dharmapuri', coords: [12.1211, 78.1582] },
  { name: 'Krishnagiri', coords: [12.5266, 78.2145] },
  { name: 'Tirupathur', coords: [12.4934, 78.5678] },
  { name: 'Ranipet', coords: [12.9272, 79.3327] },
  { name: 'Kallakurichi', coords: [11.7380, 78.9634] },
  { name: 'Tiruvannamalai', coords: [12.2272, 79.0700] },
  { name: 'Ariyalur', coords: [11.1401, 79.0786] },
  { name: 'Perambalur', coords: [11.2342, 78.8820] },
  { name: 'Mayiladuthurai', coords: [11.1018, 79.6521] },
  { name: 'The Nilgiris', coords: [11.4167, 76.7000] },
  { name: 'Chengalpattu', coords: [12.6934, 79.9756] },
];

const CHENNAI_ZONES = [
  { name: 'Thiruvottiyur', coords: [13.1600, 80.3000] },
  { name: 'Manali', coords: [13.1670, 80.2600] },
  { name: 'Madhavaram', coords: [13.1500, 80.2300] },
  { name: 'Tondiarpet', coords: [13.1250, 80.2900] },
  { name: 'Royapuram', coords: [13.1100, 80.2900] },
  { name: 'Thiru-Vi-Ka Nagar', coords: [13.1070, 80.2450] },
  { name: 'Ambattur', coords: [13.1143, 80.1548] },
  { name: 'Anna Nagar', coords: [13.0850, 80.2100] },
  { name: 'Teynampet', coords: [13.0450, 80.2500] },
  { name: 'Kodambakkam', coords: [13.0500, 80.2200] },
  { name: 'Valasaravakkam', coords: [13.0400, 80.1700] },
  { name: 'Alandur', coords: [13.0030, 80.2000] },
  { name: 'Adyar', coords: [13.0063, 80.2574] },
  { name: 'Perungudi', coords: [12.9650, 80.2450] },
  { name: 'Sholinganallur', coords: [12.9000, 80.2270] },
];

const COIMBATORE_ZONES = [
  { name: 'Coimbatore North', coords: [11.0300, 76.9600] },
  { name: 'Coimbatore South', coords: [10.9900, 76.9600] },
  { name: 'Pollachi', coords: [10.6590, 77.0078] },
  { name: 'Mettupalayam', coords: [11.3000, 76.9400] },
  { name: 'Sulur', coords: [11.0200, 77.1200] },
  { name: 'Singanallur', coords: [11.0000, 77.0200] },
];

const MADURAI_ZONES = [
  { name: 'Madurai North', coords: [9.9500, 78.1200] },
  { name: 'Madurai South', coords: [9.9000, 78.1200] },
  { name: 'Madurai East', coords: [9.9300, 78.1600] },
  { name: 'Madurai West', coords: [9.9300, 78.0800] },
  { name: 'Thirumangalam', coords: [9.8200, 77.9900] },
  { name: 'Melur', coords: [10.0400, 78.3300] },
];

const TRICHY_ZONES = [
  { name: 'Trichy East', coords: [10.8100, 78.7100] },
  { name: 'Trichy West', coords: [10.8000, 78.6800] },
  { name: 'Srirangam', coords: [10.8600, 78.6900] },
  { name: 'Lalgudi', coords: [10.8700, 78.8300] },
  { name: 'Thiruverumbur', coords: [10.7800, 78.7700] },
  { name: 'Manapparai', coords: [10.6075, 78.4164] },
];

const SALEM_ZONES = [
  { name: 'Salem North', coords: [11.6800, 78.1500] },
  { name: 'Salem South', coords: [11.6400, 78.1500] },
  { name: 'Salem West', coords: [11.6600, 78.1100] },
  { name: 'Salem East', coords: [11.6600, 78.1900] },
  { name: 'Omalur', coords: [11.7400, 78.0400] },
  { name: 'Attur', coords: [11.5900, 78.6000] },
];

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

export default function ZoneSelectionMap({
  selectedZones = [],
  onToggleZone,
  zoneConflicts = [],
  isGrowthPartner = false,
  height = '400px',
}) {
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const layerGroupRef = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [viewState, setViewState] = useState('TN');

  useEffect(() => {
    loadLeaflet().then(() => setLeafletLoaded(true));
  }, []);

  // Init map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    const L = window.L;
    const map = L.map(mapContainerRef.current, {
      center: [11.1271, 78.6569],
      zoom: 7,
      zoomControl: true,
    });
    mapInstance.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    const layerGroup = L.featureGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [leafletLoaded]);

  // Render circles/markers
  useEffect(() => {
    if (!leafletLoaded || !mapInstance.current || !layerGroupRef.current) return;
    const L = window.L;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    let items = TAMIL_NADU_DISTRICTS;
    if (viewState === 'CHENNAI') items = CHENNAI_ZONES;
    else if (viewState === 'COIMBATORE') items = COIMBATORE_ZONES;
    else if (viewState === 'MADURAI') items = MADURAI_ZONES;
    else if (viewState === 'TRICHY') items = TRICHY_ZONES;
    else if (viewState === 'SALEM') items = SALEM_ZONES;

    items.forEach((item) => {
      const isSelected = selectedZones.includes(item.name);
      const conflict = zoneConflicts.find((c) => c.zones && c.zones.includes(item.name));

      let color = '#94a3b8';
      let fillColor = '#e2e8f0';
      let fillOpacity = 0.35;
      let weight = 1.5;

      if (isSelected) { color = '#e11d48'; fillColor = '#fda4af'; fillOpacity = 0.55; weight = 3; }
      if (conflict)  { color = '#d97706'; fillColor = '#fde68a'; fillOpacity = 0.65; weight = 3; }

      const radius = viewState === 'TN' ? (item.isCity ? 12000 : 18000) : (viewState === 'CHENNAI' ? 1200 : 3000);

      const circle = L.circle(item.coords, { color, fillColor, fillOpacity, weight, radius });

      let conflictOwner = conflict ? conflict.companyName : null;
      let popupHtml = `<div style="font-family:system-ui,sans-serif;font-size:11px;line-height:1.5;min-width:120px;">
        <strong style="font-size:13px;color:#1e293b;display:block;margin-bottom:4px;">${item.name}</strong>`;

      if (viewState === 'TN' && item.isCity) {
        popupHtml += `<span style="color:#e11d48;font-weight:bold;font-size:10px;">👉 Click to drill into ${item.name} Zones</span>`;
      } else {
        popupHtml += `<div style="margin-top:2px;">Status: ${isSelected
          ? '<span style="color:#e11d48;font-weight:bold;">✔ Selected</span>'
          : '<span style="color:#64748b;">Not Selected</span>'}</div>`;
        if (conflictOwner) {
          popupHtml += `<div style="color:#d97706;font-weight:bold;margin-top:6px;border-top:1px solid #fcd34d;padding-top:5px;">⚠️ Active dealer:<br/><span style="color:#1e293b">${conflictOwner}</span></div>`;
          if (isGrowthPartner) {
            popupHtml += `<div style="color:#dc2626;font-weight:bold;margin-top:4px;">🚨 Growth partner conflict!</div>`;
          }
        }
        popupHtml += `<div style="margin-top:6px;font-size:10px;color:#94a3b8;">Click to ${isSelected ? 'deselect' : 'select'}</div>`;
      }
      popupHtml += `</div>`;

      circle.bindPopup(popupHtml);
      circle.on('mouseover', function () { this.openPopup(); });
      circle.on('click', () => {
        if (viewState === 'TN' && item.isCity) {
          if (item.name === 'Chennai') {
            mapInstance.current.setView([13.04, 80.22], 11);
            setViewState('CHENNAI');
          } else if (item.name === 'Coimbatore') {
            mapInstance.current.setView([11.0168, 76.9558], 11);
            setViewState('COIMBATORE');
          } else if (item.name === 'Madurai') {
            mapInstance.current.setView([9.9252, 78.1198], 11);
            setViewState('MADURAI');
          } else if (item.name === 'Tiruchirappalli') {
            mapInstance.current.setView([10.7905, 78.7047], 11);
            setViewState('TRICHY');
          } else if (item.name === 'Salem') {
            mapInstance.current.setView([11.6643, 78.1460], 11);
            setViewState('SALEM');
          }
        } else {
          onToggleZone(item.name);
        }
      });

      circle.addTo(layerGroup);

      // Add a label marker for larger circles
      if (viewState === 'TN') {
        const labelIcon = L.divIcon({
          className: '',
          html: `<div style="font-size:9px;font-weight:800;color:#1e293b;white-space:nowrap;text-shadow:0 0 3px white,0 0 3px white;">${item.name}</div>`,
          iconAnchor: [30, 5],
        });
        L.marker(item.coords, { icon: labelIcon, interactive: false }).addTo(layerGroup);
      }
    });
  }, [leafletLoaded, viewState, selectedZones, zoneConflicts, isGrowthPartner]);

  const handleBackToTN = () => {
    if (mapInstance.current) mapInstance.current.setView([11.1271, 78.6569], 7);
    setViewState('TN');
  };

  if (!leafletLoaded) {
    return (
      <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 space-y-2" style={{ height }}>
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        <span className="text-xs font-semibold">Loading interactive map engine...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-[10px] uppercase font-black tracking-wider">
          <Layers className="w-3.5 h-3.5 text-rose-600" />
          <span className="text-slate-500">
            {viewState === 'TN' ? `Tamil Nadu — ${TAMIL_NADU_DISTRICTS.length} Districts` : 
             viewState === 'CHENNAI' ? `Chennai — ${CHENNAI_ZONES.length} Regional Zones` :
             viewState === 'COIMBATORE' ? `Coimbatore — ${COIMBATORE_ZONES.length} Regional Zones` :
             viewState === 'MADURAI' ? `Madurai — ${MADURAI_ZONES.length} Regional Zones` :
             viewState === 'TRICHY' ? `Trichy — ${TRICHY_ZONES.length} Regional Zones` :
             viewState === 'SALEM' ? `Salem — ${SALEM_ZONES.length} Regional Zones` : ''}
          </span>
        </div>
        {viewState !== 'TN' && (
          <button
            type="button"
            onClick={handleBackToTN}
            className="inline-flex items-center space-x-1 text-slate-600 hover:text-rose-600 text-[10px] font-bold bg-slate-100 hover:bg-rose-50 px-2 py-1 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Tamil Nadu</span>
          </button>
        )}
      </div>

      <div className="relative border border-slate-200 rounded-2xl overflow-hidden shadow-inner" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-200 p-2.5 rounded-xl text-[9px] font-bold text-slate-600 space-y-1.5 shadow-sm">
          {isGrowthPartner && zoneConflicts.length > 0 && (
            <div className="text-[9px] text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg font-black animate-pulse uppercase mb-1.5">
              ⚠️ Growth Partner Conflict!
            </div>
          )}
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-400 border-2 border-rose-600 inline-block" />
            <span>Selected ({selectedZones.length})</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-300 border-2 border-amber-600 inline-block" />
            <span>Active Conflict</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-200 border-2 border-slate-400 inline-block" />
            <span>Available</span>
          </div>
        </div>

        {/* Selected count badge */}
        {selectedZones.length > 0 && (
          <div className="absolute top-3 right-3 z-[1000] bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
            {selectedZones.length} zone{selectedZones.length > 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-400 italic flex items-center gap-1">
        <HelpCircle className="w-3.5 h-3.5 text-slate-350 shrink-0" />
        <span>Click zones to toggle selection. Click Chennai, Coimbatore, Madurai, Trichy, or Salem to drill into sub-zones.</span>
      </p>
    </div>
  );
}
