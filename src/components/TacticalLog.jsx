import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, Cpu, Wifi } from 'lucide-react';

const TacticalLog = () => {
  const [logs, setLogs] = useState([
    { id: 1, type: 'info', msg: 'System initialized. Orbit stable.' },
    { id: 2, type: 'success', msg: 'Sentinel-2 linkage established.' }
  ]);
  const logContainerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const type = Math.random() > 0.8 ? 'warning' : Math.random() > 0.5 ? 'info' : 'success';
      
      setLogs(prev => {
        const newLogs = [...prev, { 
          id: Date.now(), 
          type, 
          msg: randomMsg,
          time: new Date().toLocaleTimeString([], { hour12: false }) 
        }];
        return newLogs.slice(-14);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      const { scrollHeight, clientHeight } = logContainerRef.current;
      logContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  }, [logs]);

  return (
    <div className="glass h-full rounded-2xl border border-white/10 flex flex-col overflow-hidden font-mono">
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Tactical Mission Log</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[8px] text-emerald-400 uppercase">Live</span>
        </div>
      </div>
      
      <div ref={logContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2 text-[10px] scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-start space-x-2"
            >
              <span className="text-slate-600">[{log.time || 'INIT'}]</span>
              <span className={
                log.type === 'warning' ? 'text-teal-400' : 
                log.type === 'success' ? 'text-emerald-400' : 
                'text-slate-300'
              }>
                {log.type === 'warning' ? '>>' : '>'} {log.msg}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-3 bg-black/40 border-t border-white/5 grid grid-cols-3 gap-2">
         <StatusBadge icon={Wifi} label="SIG" val="MAX" />
         <StatusBadge icon={Cpu} label="PROC" val="94%" />
         <StatusBadge icon={Shield} label="SEC" val="ON" />
      </div>
    </div>
  );
};

const StatusBadge = ({ icon: Icon, label, val }) => (
  <div className="flex flex-col items-center p-1 bg-white/5 rounded border border-white/5">
    <Icon className="w-3 h-3 text-slate-500 mb-1" />
    <span className="text-[7px] text-slate-600 uppercase font-black">{label}</span>
    <span className="text-[8px] text-white font-bold">{val}</span>
  </div>
);

export default TacticalLog;
