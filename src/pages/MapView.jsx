import { motion } from 'framer-motion';
import { Map as MapIcon, Shield, Info, Maximize, ZoomIn } from 'lucide-react';

const MapView = () => {
  // Using a sample Earth Engine app or a high-quality satellite map embed
  // Note: Replace "GEE_APP_LINK" with an actual link if available.
  const GEE_APP_LINK = "https://earthengine.google.com/iframes/timelapse_player_embed.html#v=12.9716,77.5946,10,latLng&t=3.54&l=skybox";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <MapIcon className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Satellite NDVI Visualization</h1>
        </div>
        <p className="text-slate-400 max-w-2xl">
          Real-time spatial analysis of vegetation health across the selected geographic region.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="glass rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative">
            <div className="absolute top-4 right-4 z-10 flex space-x-2">
              <button className="p-2 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 hover:bg-black/70 transition-all text-white">
                <Maximize className="w-4 h-4" />
              </button>
              <button className="p-2 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 hover:bg-black/70 transition-all text-white">
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            <iframe 
              src={GEE_APP_LINK}
              width="100%" 
              height="600" 
              className="border-none"
              title="Google Earth Engine Map"
              allowFullScreen
            ></iframe>
            
            {/* Map Legend Overlay */}
            <div className="absolute bottom-6 left-6 p-4 glass rounded-xl border border-white/10 backdrop-blur-xl">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-emerald-400" />
                NDVI Health Legend
              </h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-emerald-500 rounded-sm shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  <span className="text-xs text-slate-300">Healthy (0.6 - 1.0)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded-sm shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                  <span className="text-xs text-slate-300">Moderate (0.3 - 0.6)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-sm shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  <span className="text-xs text-slate-300">Low/Unhealthy ({"<"} 0.3)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-emerald-400" />
              Map Context
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Coordinates</p>
                <p className="text-sm text-slate-300">12.9716° N, 77.5946° E</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Region</p>
                <p className="text-sm text-slate-300">Bangalore (Agricultural Periphery)</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Last Update</p>
                <p className="text-sm text-slate-300">May 2026</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Satellite</p>
                <p className="text-sm text-slate-300">Sentinel-2A</p>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
            <h3 className="text-sm font-bold text-emerald-400 mb-2">Analysis Insight</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Current spatial data indicates a high concentration of healthy vegetation in the northwest sector, while the southern regions show moderate stress potentially due to early summer heat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
