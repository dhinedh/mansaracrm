import React, { useEffect, useRef, useState } from 'react';
import { MapPin, ArrowLeft, Loader2, HelpCircle } from 'lucide-react';

const TAMIL_NADU_DISTRICTS = [
  { name: 'Chennai', coords: [13.0827, 80.2707], isCity: true },
  { name: 'Coimbatore', coords: [11.0168, 76.9558] },
  { name: 'Madurai', coords: [9.9252, 78.1198] },
  { name: 'Tiruchirappalli', coords: [10.7905, 78.7047] },
  { name: 'Salem', coords: [11.6643, 78.1460] },
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
  { name: 'The Nilgiris', coords: [11.4167, 76.7000] }
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
  { name: 'Sholinganallur', coords: [12.9000, 80.2270] }
];

export default function ZoneSelectionMap({ selectedZones = [], onToggleZone, zoneConflicts = [], isGrowthPartner = false }) {
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const layerGroupRef = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [viewState, setViewState] = useState('TN'); // 'TN' | 'CHENNAI'

  // Load Leaflet assets dynamically from CDN
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    // Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  // Initialize Map Instance
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;

    const L = window.L;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [11.1271, 78.6569],
      zoom: 7,
      zoomControl: true
    });
    mapInstance.current = map;

    // CartoDB Voyager Tile Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // FeatureGroup for circles
    const layerGroup = L.featureGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [leafletLoaded]);

  // Sync circles and markers with active state
  useEffect(() => {
    if (!leafletLoaded || !mapInstance.current || !layerGroupRef.current) return;

    const L = window.L;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    const items = viewState === 'TN' ? TAMIL_NADU_DISTRICTS : CHENNAI_ZONES;

    items.forEach((item) => {
      const isSelected = selectedZones.includes(item.name);
      const conflict = zoneConflicts.find(c => c.zones.includes(item.name));

      // Style determination
      let color = '#94a3b8';      // slate-400
      let fillColor = '#e2e8f0';  // slate-200
      let fillOpacity = 0.35;
      let weight = 1.5;

      if (isSelected) {
        color = '#e11d48';        // rose-600
        fillColor = '#fda4af';    // rose-300
        fillOpacity = 0.55;
        weight = 3;
      }

      if (conflict) {
        color = '#d97706';        // amber-600
        fillColor = '#fde68a';    // amber-200
        fillOpacity = 0.65;
        weight = 3;
      }

      // Radius in meters
      const radius = viewState === 'TN' ? (item.isCity ? 12000 : 18000) : 1000;

      const circle = L.circle(item.coords, {
        color,
        fillColor,
        fillOpacity,
        weight,
        radius
      });

      // Tooltip/Popup contents
      let popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 11px; line-height: 1.4;">
          <strong style="font-size: 12px; color: #1e293b; display: block; margin-bottom: 2px;">${item.name}</strong>
      `;

      if (item.name === 'Chennai' && viewState === 'TN') {
        popupHtml += `<span style="color: #e11d48; font-weight: bold; font-size: 10px;">👉 Click to zoom into Chennai Zones</span>`;
      } else {
        popupHtml += `Status: ${isSelected ? '<span style="color: #e11d48; font-weight: bold;">Selected</span>' : '<span style="color: #64748b;">Not Selected</span>'}`;
        if (conflict) {
          popupHtml += `<div style="color: #d97706; font-weight: bold; margin-top: 4px; border-top: 1px solid #fcd34d; padding-top: 4px;">⚠️ Assigned to active dealer:<br/>${conflict.companyName}</div>`;
          if (isGrowthPartner) {
            popupHtml += `<div style="color: #dc2626; font-weight: bold; margin-top: 4px; border-top: 1px dashed #fca5a5; padding-top: 4px;">🚨 Partner Overlap Warning: Growth partner conflict!</div>`;
          }
        }
      }
      popupHtml += `</div>`;

      circle.bindPopup(popupHtml);

      // Event handlers
      circle.on('mouseover', function () {
        this.openPopup();
      });

      circle.on('click', () => {
        if (item.name === 'Chennai' && viewState === 'TN') {
          mapInstance.current.setView([13.04, 80.22], 11);
          setViewState('CHENNAI');
        } else {
          onToggleZone(item.name);
        }
      });

      circle.addTo(layerGroup);
    });
  }, [leafletLoaded, viewState, selectedZones, zoneConflicts, isGrowthPartner]);

  const handleBackToTN = () => {
    if (mapInstance.current) {
      mapInstance.current.setView([11.1271, 78.6569], 7);
    }
    setViewState('TN');
  };

  if (!leafletLoaded) {
    return (
      <div className="h-[350px] w-full bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        <span className="text-xs font-semibold">Loading interactive map engine...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-[10px] uppercase font-black tracking-wider">
          <MapPin className="w-3.5 h-3.5 text-rose-600" />
          <span className="text-slate-500">
            Scope: {viewState === 'TN' ? 'Tamil Nadu Districts' : 'Chennai Regional Zones'}
          </span>
        </div>
        {viewState === 'CHENNAI' && (
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

      <div className="relative border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
        <div ref={mapContainerRef} className="h-[350px] w-full" />
        
        {/* Quick legend overlay */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-200 p-2 rounded-xl text-[9px] font-bold text-slate-600 space-y-1.5 shadow-sm">
          {isGrowthPartner && zoneConflicts.length > 0 && (
            <div className="text-[9px] text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg font-black animate-pulse uppercase mb-1.5">
              ⚠️ Overlap Warning: Growth Conflict!
            </div>
          )}
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 opacity-60 border border-rose-600" />
            <span>Selected Zones</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-70 border border-amber-600" />
            <span>Active Conflicts</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 opacity-40 border border-slate-400" />
            <span>Available Zones</span>
          </div>
        </div>
      </div>
      
      <p className="text-[10px] text-slate-400 italic flex items-center gap-1">
        <HelpCircle className="w-3.5 h-3.5 text-slate-350 shrink-0" />
        <span>Click markers to toggle selection. Click Chennai to drill down to municipal wards.</span>
      </p>
    </div>
  );
}
