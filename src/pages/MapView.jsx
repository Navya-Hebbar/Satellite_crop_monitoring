import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useMotionTemplate, AnimatePresence } from 'framer-motion';
import { Map as MapIcon, Shield, Code, Copy, Check, Activity } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customMarkerIcon = new L.DivIcon({
  className: 'custom-leaflet-icon',
  html: `
    <div class="relative flex items-center justify-center pointer-events-none mt-2 ml-2">
      <div class="w-8 h-8 bg-emerald-500 rounded-full animate-ping absolute"></div>
      <div class="w-4 h-4 bg-white rounded-full relative z-10 border-[3px] border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,1)]"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

function LocationMarker({ coords, onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return coords.lat && coords.lng ? (
    <Marker position={[coords.lat, coords.lng]} icon={customMarkerIcon} />
  ) : null;
}

const MapView = () => {
  const [coords, setCoords] = useState({ lat: 12.9716, lng: 77.5946, buffer: 0.2 });
  const [dates, setDates] = useState({ start: '2023-01-01', end: '2024-01-01' }); // Better defaults for GEE
  const [copied, setCopied] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [mapMode, setMapMode] = useState('gee');
  const [searchInput, setSearchInput] = useState("");
  const containerRef = useRef(null);

  const runGEEAnalysis = async (lat, lng) => {
    setCoords((prev) => ({ ...prev, lat, lng }));
    setAnalysisData(null);
    setIsCalculating(true);

    let locationName = "Unknown Region";
    try {
      const osmRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await osmRes.json();
      locationName = data.address ? (data.address.city || data.address.town || data.address.village || data.address.county || data.address.state || data.address.country || "Unknown Region") : "Unknown Region";
    } catch (error) {
      console.warn("OSM Geocoding Error");
    }

    try {
      const geeRes = await fetch(`http://localhost:3001/api/ndvi?lat=${lat}&lng=${lng}&startDate=${dates.start}&endDate=${dates.end}&buffer=500`);
      const geeData = await geeRes.json();

      if (geeData && geeData.length > 0) {
        const latest = geeData[geeData.length - 1];
        const ndvi = parseFloat(latest.ndvi).toFixed(3);
        const health = latest.status;
        const color = ndvi > 0.6 ? 'text-emerald-400 border-emerald-400' : ndvi >= 0.3 ? 'text-yellow-400 border-yellow-400' : 'text-red-400 border-red-400';
        setAnalysisData({ ndvi, health, color, locationName, date: latest.date });
      } else {
        setAnalysisData({ error: 'No cloud-free data available in this range.', locationName });
      }
    } catch (err) {
      setAnalysisData({ error: 'Failed to connect to Earth Engine backend.', locationName });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput) return;
    
    const parts = searchInput.split(',').map(s => s.trim());
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      runGEEAnalysis(parseFloat(parts[0]), parseFloat(parts[1]));
      return;
    }

    setIsCalculating(true);
    setAnalysisData(null);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        runGEEAnalysis(parseFloat(data[0].lat), parseFloat(data[0].lon));
      } else {
        setAnalysisData({ error: 'Location not found.', locationName: searchInput });
        setIsCalculating(false);
      }
    } catch (err) {
      setAnalysisData({ error: 'Search failed.', locationName: searchInput });
      setIsCalculating(false);
    }
  };

  const GEE_APP_LINK = "https://datavisual-494214.projects.earthengine.app/view/dav-el";

  // Spotlight
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlightBackground = useMotionTemplate`radial-gradient(800px circle at ${mouseX}px ${mouseY}px, rgba(16,185,129,0.15), transparent 40%)`;

  const generatedScript = `// 1. Define region (Generated from SatCrop)
var region = ee.Geometry.Rectangle([${(coords.lng - coords.buffer).toFixed(4)}, ${(coords.lat - coords.buffer).toFixed(4)}, ${(coords.lng + coords.buffer).toFixed(4)}, ${(coords.lat + coords.buffer).toFixed(4)}]);

// 2. Load dataset
var collection = ee.ImageCollection("COPERNICUS/S2_SR")
  .filterBounds(region)
  .filterDate('${dates.start}', '${dates.end}')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));

// 3. Take one image for map display
var image = collection.first();

// 4. NDVI for map
var ndviImage = image.normalizedDifference(['B8', 'B4']).rename('NDVI');

// Show map
Map.setCenter(${coords.lng.toFixed(4)}, ${coords.lat.toFixed(4)}, 10);
Map.addLayer(ndviImage, {min: 0, max: 1, palette: ['red','yellow','green']}, 'NDVI Map');

// 5. Mean NDVI (single value)
var meanNDVI = ndviImage.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: region,
  scale: 10,
  maxPixels: 1e9
});

print("Mean NDVI:", meanNDVI);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] p-6 md:p-10 space-y-12 flex flex-col items-center">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <MapIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Interactive Spectral Map</h1>
          </div>
          <p className="text-slate-400 font-mono text-sm">Switch modes to interact with the global satellite feed or analyze specific targets.</p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 backdrop-blur-md">
          <button 
            onClick={() => setMapMode('gee')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${mapMode === 'gee' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-slate-400 hover:text-white'}`}
          >
            Live Feed (GEE)
          </button>
          <button 
            onClick={() => setMapMode('interactive')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${mapMode === 'interactive' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-slate-400 hover:text-white'}`}
          >
            Targeting Mode
          </button>
        </div>
      </motion.div>

      {/* Main Large Map Container */}
      <div 
        ref={containerRef}
        onMouseMove={(e) => {
          const rect = containerRef.current.getBoundingClientRect();
          mouseX.set(e.clientX - rect.left);
          mouseY.set(e.clientY - rect.top);
        }}
        className="w-full max-w-7xl h-[65vh] min-h-[500px] relative group overflow-hidden rounded-[2rem] glass border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)] hover:shadow-[0_0_60px_rgba(16,185,129,0.4)] transition-shadow duration-500"
      >
        {/* Interactive Spotlight Overlay */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100 z-[999]"
          style={{ background: spotlightBackground }}
        />
        
        {/* Map Header Overlay */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-black/60 backdrop-blur-md border border-emerald-500/50 px-4 py-1 rounded-full pointer-events-none flex items-center space-x-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-[0.2em] matrix-text">Live Global Satellite Feed</span>
        </div>

        {/* Search Overlay */}
        <form onSubmit={handleSearch} className="absolute top-6 left-6 z-[1000] flex items-center space-x-2">
          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search City or Lat, Lng..." 
            className="bg-black/60 border border-emerald-500/50 text-white text-xs px-4 py-2 rounded-full focus:outline-none focus:border-emerald-400 backdrop-blur-md w-64 shadow-[0_0_20px_rgba(16,185,129,0.2)] placeholder-slate-400"
          />
          <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold p-2 rounded-full transition-colors flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            <Activity className="w-4 h-4" />
          </button>
        </form>

        {/* Map Layers */}
        {mapMode === 'gee' ? (
          <iframe 
            src={GEE_APP_LINK}
            width="100%" 
            height="100%" 
            className="border-none absolute inset-0 z-10 filter contrast-125 saturate-150"
            title="Google Earth Engine Map"
            allowFullScreen
          ></iframe>
        ) : (
          <div className="absolute inset-0 z-10 bg-[#020617] cursor-crosshair">
            <MapContainer 
              center={[coords.lat, coords.lng]} 
              zoom={8} 
              style={{ height: '100%', width: '100%', background: 'transparent' }}
              zoomControl={false}
            >
              {/* Google Maps Hybrid Satellite Tiles (Matches GEE exactly) */}
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                attribution="&copy; Google Maps"
                maxZoom={20}
              />
              <LocationMarker coords={coords} onLocationSelect={runGEEAnalysis} />
            </MapContainer>
          </div>
        )}
        
        {/* Dynamic Point Analysis HUD */}
        <AnimatePresence>
          {(analysisData || isCalculating) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute top-6 right-6 p-6 bg-black/60 rounded-2xl border border-emerald-500/30 backdrop-blur-2xl z-[1000] shadow-[0_0_40px_rgba(0,0,0,0.8)] min-w-[260px]"
            >
              <h4 className="text-sm font-bold text-white mb-4 flex items-center border-b border-white/10 pb-2">
                <Activity className="w-4 h-4 mr-2 text-emerald-400" />
                Target Analysis
              </h4>
              <div className="space-y-4">
                {isCalculating ? (
                  <div className="flex flex-col items-center justify-center py-6 space-y-4">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-mono text-center animate-pulse">Calculating via GEE...</p>
                  </div>
                ) : analysisData?.error ? (
                  <div className="py-4 text-center">
                    <p className="text-xs font-bold text-red-400 mb-1">{analysisData.locationName}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">{analysisData.error}</p>
                  </div>
                ) : analysisData ? (
                  <>
                    {analysisData.locationName && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Detected Region</p>
                        <p className="text-sm font-bold text-white truncate" title={analysisData.locationName}>
                          {analysisData.locationName}
                        </p>
                      </div>
                    )}
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Local NDVI</p>
                        <p className="text-[9px] text-emerald-500 font-mono">{analysisData.date}</p>
                      </div>
                      <p className={`text-4xl font-black matrix-text ${analysisData.color.split(' ')[0]}`}>{analysisData.ndvi}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Health Status</p>
                      <div className={`inline-block px-3 py-1 mt-1 rounded-md text-[10px] uppercase font-black border ${analysisData.color} shadow-[0_0_15px_currentColor]`}>
                        {analysisData.health}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-white/10 flex justify-between text-[11px] text-slate-300 font-mono bg-black/40 p-2 rounded-lg border border-white/5">
                      <div><span className="text-emerald-500 font-bold">LAT:</span> {coords.lat.toFixed(4)}</div>
                      <div><span className="text-emerald-500 font-bold">LNG:</span> {coords.lng.toFixed(4)}</div>
                    </div>
                  </>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="absolute bottom-6 right-6 p-4 bg-black/60 rounded-xl border border-white/10 backdrop-blur-xl z-[1000] shadow-2xl pointer-events-none">
          <h4 className="text-xs font-bold text-white mb-3 flex items-center">
            <Shield className="w-3 h-3 mr-2 text-emerald-400" />
            Legend
          </h4>
          <div className="space-y-2 text-[10px] text-slate-300">
            <div className="flex items-center space-x-3"><div className="w-3 h-3 bg-emerald-500 rounded-sm" /><span>Healthy (0.6+)</span></div>
            <div className="flex items-center space-x-3"><div className="w-3 h-3 bg-yellow-500 rounded-sm" /><span>Moderate (0.4-0.6)</span></div>
            <div className="flex items-center space-x-3"><div className="w-3 h-3 bg-red-500 rounded-sm" /><span>Stressed ({"<"} 0.4)</span></div>
          </div>
        </div>
      </div>

      {/* Script Generator Panel Below the Map */}
      <div className="w-full max-w-7xl glass p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Code className="w-5 h-5 mr-2 text-emerald-400" />
            GEE Script Generator
          </h3>
          <button 
            onClick={copyToClipboard}
            className="flex items-center space-x-2 px-6 py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-xl text-sm font-bold hover:bg-emerald-500 hover:text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy GEE Script'}</span>
          </button>
        </div>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Latitude</label>
            <input 
              type="number" 
              value={coords.lat} 
              onChange={(e) => setCoords({...coords, lat: parseFloat(e.target.value)})}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Longitude</label>
            <input 
              type="number" 
              value={coords.lng} 
              onChange={(e) => setCoords({...coords, lng: parseFloat(e.target.value)})}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Region Size (deg)</label>
            <input 
              type="number" 
              step="0.01"
              value={coords.buffer} 
              onChange={(e) => setCoords({...coords, buffer: parseFloat(e.target.value)})}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div className="relative z-10 bg-black/80 rounded-xl p-6 font-mono text-sm text-emerald-400 max-h-60 overflow-y-auto border border-emerald-500/30 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] relative group/code">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover/code:opacity-100 transition-opacity pointer-events-none mix-blend-screen" />
          <pre className="matrix-text whitespace-pre-wrap">{generatedScript}</pre>
        </div>
      </div>
    </div>
  );
};

export default MapView;