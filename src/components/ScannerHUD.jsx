import { motion } from 'framer-motion';
import { Target, Scan, Crosshair, Zap } from 'lucide-react';

const ScannerHUD = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Corner Brackets */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-emerald-500/30 rounded-tl-3xl" />
      <div className="absolute top-10 right-10 w-20 h-20 border-t-2 border-r-2 border-emerald-500/30 rounded-tr-3xl" />
      <div className="absolute bottom-10 left-10 w-20 h-20 border-b-2 border-l-2 border-emerald-500/30 rounded-bl-3xl" />
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-emerald-500/30 rounded-br-3xl" />

      {/* Scanning Line */}
      <motion.div 
        initial={{ top: '0%' }}
        animate={{ top: '100%' }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.5)] z-20"
      />

      {/* Dynamic Data Points */}
      <div className="absolute top-1/4 left-20 space-y-4 hidden md:block">
        <HUDData label="SAT_ID" value="S2-B8A" />
        <HUDData label="SIGNAL" value="98.4%" color="text-emerald-400" />
        <HUDData label="COORD" value="12.9716° N" />
      </div>

      <div className="absolute bottom-1/4 right-20 space-y-4 hidden md:block text-right">
        <HUDData label="ALTITUDE" value="786KM" />
        <HUDData label="SENSOR" value="MULTISPECTRAL" />
        <HUDData label="STATUS" value="SCANNING" color="text-emerald-400 animate-pulse" />
      </div>

      {/* Center Target */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Crosshair className="w-64 h-64 text-emerald-500" />
        </motion.div>
      </div>

      {/* Random Glitch Elements */}
      <motion.div
        animate={{ 
          opacity: [0, 0.5, 0],
          x: [0, 10, -10, 0]
        }}
        transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 5 }}
        className="absolute top-1/3 right-1/4 p-2 bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400"
      >
        ERROR: CLOUD_COVER_DETECTED_0.02%
      </motion.div>
    </div>
  );
};

const HUDData = ({ label, value, color = "text-slate-500" }) => (
  <div className="font-mono">
    <div className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</div>
    <div className={`text-sm font-bold ${color}`}>{value}</div>
  </div>
);

export default ScannerHUD;
