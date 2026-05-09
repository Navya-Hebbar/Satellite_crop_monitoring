import { motion } from 'framer-motion';
import { Target, Scan, Crosshair, Zap } from 'lucide-react';

const ScannerHUD = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {/* Corner Brackets */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t border-l border-emerald-500/20 rounded-tl-2xl" />
      <div className="absolute top-8 right-8 w-16 h-16 border-t border-r border-emerald-500/20 rounded-tr-2xl" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b border-l border-emerald-500/20 rounded-bl-2xl" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b border-r border-emerald-500/20 rounded-br-2xl" />

      {/* Scanning Line */}
      <motion.div 
        initial={{ top: '0%' }}
        animate={{ top: '100%' }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.2)] z-20"
      />

      {/* Top Left Data - Far Corner */}
      <div className="absolute top-12 left-12 space-y-2 hidden lg:block opacity-50">
        <HUDData label="SAT_LINK" value="ACTIVE" color="text-emerald-400" />
        <HUDData label="ORBIT" value="LEO-SYNC" />
      </div>

      {/* Top Right Data - Far Corner */}
      <div className="absolute top-12 right-12 space-y-2 hidden lg:block text-right opacity-50">
        <HUDData label="COORD" value="12.97° N" />
        <HUDData label="SIG_STR" value="98.4%" />
      </div>

      {/* Bottom Left Data - Far Corner */}
      <div className="absolute bottom-12 left-12 space-y-2 hidden lg:block opacity-50">
        <HUDData label="SENSOR" value="SPECTRAL-v4" />
        <HUDData label="MODE" value="RECON" />
      </div>

      {/* Bottom Right Data - Far Corner */}
      <div className="absolute bottom-12 right-12 space-y-2 hidden lg:block text-right opacity-50">
        <HUDData label="STATUS" value="NOMINAL" color="text-emerald-400" />
        <HUDData label="TIME" value={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
      </div>

      {/* Center Target - Subtle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <Crosshair className="w-96 h-96 text-emerald-500" />
        </motion.div>
      </div>
    </div>
  );
};

const HUDData = ({ label, value, color = "text-slate-500" }) => (
  <div className="font-mono">
    <div className="text-[8px] text-slate-500 uppercase tracking-[0.2em]">{label}</div>
    <div className={`text-[10px] font-black ${color}`}>{value}</div>
  </div>
);

export default ScannerHUD;
