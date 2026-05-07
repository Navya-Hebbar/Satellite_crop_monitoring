import { useState } from 'react';
import { motion } from 'framer-motion';
import { Map as MapIcon, Shield, Info, Maximize, ZoomIn, Code, Copy, Check } from 'lucide-react';

const MapView = () => {
  const [coords, setCoords] = useState({ lat: 12.9716, lng: 77.5946, buffer: 0.2 });
  const [dates, setDates] = useState({ start: '2022-01-01', end: '2022-06-01' });
  const [copied, setCopied] = useState(false);

  const GEE_APP_LINK = "https://datavisual-494214.projects.earthengine.app/view/dav-el";

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
Map.setCenter(${coords.lng}, ${coords.lat}, 10);
Map.addLayer(ndviImage, {min: 0, max: 1, palette: ['red','yellow','green']}, 'NDVI Map');

// 5. Mean NDVI (single value)
var meanNDVI = ndviImage.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: region,
  scale: 10,
  maxPixels: 1e9
});

print("Mean NDVI:", meanNDVI);

// 6. Function for time-series NDVI
var getNDVI = function(image) {
  var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
  var stats = ndvi.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: region,
    scale: 10,
    maxPixels: 1e9
  });
  return ee.Feature(null, {
    'date': image.date().format('YYYY-MM-dd'),
    'NDVI': stats.get('NDVI')
  });
};

// 7. Apply function and Export
var ndviData = collection.map(getNDVI);
Export.table.toDrive({
  collection: ndviData,
  description: 'NDVI_Export_${new Date().getTime()}',
  fileFormat: 'CSV'
});`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <MapIcon className="w-6 h-6 text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Satellite NDVI Visualization</h1>
            </div>
          </motion.div>

          {/* Map */}
          <div className="glass rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative group">
            {/* HUD Decoration */}
            <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-emerald-500/50 rounded-tl-xl z-20 pointer-events-none" />
            <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-emerald-500/50 rounded-tr-xl z-20 pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-emerald-500/50 rounded-bl-xl z-20 pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-emerald-500/50 rounded-br-xl z-20 pointer-events-none" />
            
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-md border border-emerald-500/30 px-4 py-1 rounded-full pointer-events-none flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-[0.2em]">Live Spectral Interface</span>
            </div>

            <iframe 
              src={GEE_APP_LINK}
              width="100%" 
              height="600" 
              className="border-none relative z-10"
              title="Google Earth Engine Map"
              allowFullScreen
            ></iframe>
            
            <div className="absolute bottom-6 left-6 p-4 glass rounded-xl border border-white/10 backdrop-blur-xl z-20">

              <h4 className="text-sm font-bold text-white mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-emerald-400" />
                NDVI Health Legend
              </h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center space-x-3"><div className="w-4 h-4 bg-emerald-500 rounded-sm" /><span>Healthy (0.6 - 1.0)</span></div>
                <div className="flex items-center space-x-3"><div className="w-4 h-4 bg-yellow-500 rounded-sm" /><span>Moderate (0.3 - 0.6)</span></div>
                <div className="flex items-center space-x-3"><div className="w-4 h-4 bg-red-500 rounded-sm" /><span>Unhealthy ({"<"} 0.3)</span></div>
              </div>
            </div>
          </div>

          {/* Script Generator Panel */}
          <div className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Code className="w-5 h-5 mr-2 text-emerald-400" />
                GEE Script Generator
              </h3>
              <button 
                onClick={copyToClipboard}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy GEE Script'}</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Latitude</label>
                <input 
                  type="number" 
                  value={coords.lat} 
                  onChange={(e) => setCoords({...coords, lat: parseFloat(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Longitude</label>
                <input 
                  type="number" 
                  value={coords.lng} 
                  onChange={(e) => setCoords({...coords, lng: parseFloat(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Region Size (deg)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={coords.buffer} 
                  onChange={(e) => setCoords({...coords, buffer: parseFloat(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-emerald-400/80 max-h-40 overflow-y-auto border border-white/5">
              <pre>{generatedScript}</pre>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-emerald-400" />
              Analysis Specs
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Start Date</p>
                <input type="date" value={dates.start} onChange={(e) => setDates({...dates, start: e.target.value})} className="bg-transparent text-sm text-slate-300 focus:outline-none" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">End Date</p>
                <input type="date" value={dates.end} onChange={(e) => setDates({...dates, end: e.target.value})} className="bg-transparent text-sm text-slate-300 focus:outline-none" />
              </div>
              <div className="pt-4 border-t border-white/10">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-2">Instructions</h4>
                <ol className="text-[10px] text-slate-400 space-y-2 list-decimal ml-3">
                  <li>Adjust coordinates and dates.</li>
                  <li>Click <strong>Copy GEE Script</strong>.</li>
                  <li>Paste into GEE Code Editor.</li>
                  <li>Run script and download CSV.</li>
                  <li>Upload CSV in <strong>Upload Data</strong>.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
