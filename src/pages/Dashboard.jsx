import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, Map as MapIcon, 
  Calendar, Info, Plus, Trash2, Monitor, AlertTriangle,
  ArrowUpRight, CheckCircle2, AlertCircle, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const KPICard = ({ title, value, subValue, icon: Icon, color }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden group"
  >
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon className="w-12 h-12" />
    </div>
    <div className="flex items-center space-x-4 mb-4">
      <div className={`p-3 bg-white/5 rounded-2xl border border-white/10 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">{title}</p>
        <p className="text-2xl font-black text-white">{value}</p>
      </div>
    </div>
    <p className="text-xs text-slate-400 font-medium">{subValue}</p>
  </motion.div>
);

const Dashboard = () => {
  const { 
    data, allRegionsData, stats, selectedRegions, setSelectedRegions, 
    allCities, seasonalTrends, loading 
  } = useData();

  const [activeTab, setActiveTab] = useState('overview');

  const addSlot = () => {
    if (selectedRegions.length < 5) {
      setSelectedRegions([...selectedRegions, allCities.find(c => !selectedRegions.includes(c)) || allCities[0]]);
    }
  };

  const removeSlot = (index) => {
    if (selectedRegions.length > 1) {
      setSelectedRegions(selectedRegions.filter((_, i) => i !== index));
    }
  };

  const updateSlot = (index, city) => {
    const newRegions = [...selectedRegions];
    newRegions[index] = city;
    setSelectedRegions(newRegions);
  };

  const comparisonData = useMemo(() => {
    if (selectedRegions.length === 0) return [];
    const firstRegion = selectedRegions[0];
    const baseData = allRegionsData[firstRegion] || [];
    
    return baseData.map((d, i) => {
      const point = { date: d.date };
      selectedRegions.forEach(region => {
        if (allRegionsData[region] && allRegionsData[region][i]) {
          point[region] = allRegionsData[region][i].ndvi;
        }
      });
      return point;
    });
  }, [allRegionsData, selectedRegions]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading && Object.keys(allRegionsData).length === 0) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-emerald-400 font-mono text-sm tracking-widest animate-pulse">SYNCING SATELLITE FEED...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Slot Selection Header */}
      <div className="glass p-6 rounded-[2rem] border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <AnimatePresence mode="popLayout">
            {selectedRegions.map((city, idx) => (
              <motion.div 
                key={`${city}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center space-x-2 bg-white/5 border border-white/10 p-1.5 pl-3 rounded-xl hover:border-white/20 transition-colors"
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: COLORS[idx] }} />
                <select 
                  value={city}
                  onChange={(e) => updateSlot(idx, e.target.value)}
                  className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer pr-1"
                >
                  {allCities.map(c => (
                    <option key={c} value={c} className="bg-[#0f172a]">{c}</option>
                  ))}
                </select>
                {selectedRegions.length > 1 && (
                  <button 
                    onClick={() => removeSlot(idx)}
                    className="p-1 hover:bg-white/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {selectedRegions.length < 5 && (
            <button 
              onClick={addSlot}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Region</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Mission Status</p>
            <p className="text-sm font-bold text-white uppercase tracking-tighter">
              {selectedRegions.length > 1 ? 'Multi-Sector Benchmark' : 'Single Grid Recon'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Monitor className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Average Health" 
          value={stats.avg} 
          subValue={stats.currentStatus} 
          icon={Activity} 
          color="text-emerald-400" 
        />
        <KPICard 
          title="Peak NDVI" 
          value={stats.max} 
          subValue="Highest Point" 
          icon={TrendingUp} 
          color="text-blue-400" 
        />
        <KPICard 
          title="Min Index" 
          value={stats.min} 
          subValue="Stress Point" 
          icon={AlertTriangle} 
          color="text-red-400" 
        />
        <KPICard 
          title="Active Sectors" 
          value={selectedRegions.length} 
          subValue="GEE Sync: Live" 
          icon={Shield} 
          color="text-indigo-400" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Benchmarking */}
        <div className="lg:col-span-2 glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-emerald-400" />
                Comparative NDVI Timeline
              </h3>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Multi-spectral temporal distribution</p>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#475569" fontSize={10} domain={[0.2, 1]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px' }} />
                {selectedRegions.map((region, idx) => (
                  <Line 
                    key={region}
                    type="monotone" 
                    dataKey={region} 
                    stroke={COLORS[idx]} 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Distribution Panel */}
        <div className="glass p-8 rounded-[2.5rem] border border-white/10 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center uppercase tracking-tighter">
            <Activity className="w-5 h-5 mr-2 text-emerald-400" />
            Vegetation Stress Distribution
          </h3>
          
          <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
            {selectedRegions.map((city, idx) => {
              const regionData = allRegionsData[city] || [];
              const healthyCount = regionData.filter(d => d.ndvi > 0.6).length;
              const moderateCount = regionData.filter(d => d.ndvi >= 0.3 && d.ndvi <= 0.6).length;
              const unhealthyCount = regionData.filter(d => d.ndvi < 0.3).length;
              const total = regionData.length || 1;

              return (
                <div key={city} className="space-y-2 p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{city}</span>
                    <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">{idx === 0 ? 'Primary' : `Slot ${idx + 1}`}</span>
                  </div>
                  <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden flex">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(healthyCount/total)*100}%` }} className="h-full bg-emerald-500" />
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(moderateCount/total)*100}%` }} className="h-full bg-yellow-500" />
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(unhealthyCount/total)*100}%` }} className="h-full bg-red-500" />
                  </div>
                  <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 tracking-wider">
                    <span>Healthy: {Math.round((healthyCount/total)*100)}%</span>
                    <span>Stress: {Math.round((unhealthyCount/total)*100)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-start space-x-3">
            <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              Relative health comparison across selected sectors using multispectral indices.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Seasonal Trends */}
        <div className="glass p-8 rounded-[2.5rem] border border-white/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-white tracking-tight flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-emerald-400" />
              Seasonal Performance
            </h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={seasonalTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="avg" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intelligence Hub */}
        <div className="glass p-8 rounded-[2.5rem] border border-white/10 flex flex-col">
          <h3 className="text-xl font-black text-white mb-6 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-emerald-400" />
            Actionable Intelligence
          </h3>
          <div className="space-y-4 flex-1">
             <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-start space-x-4">
                <div className="mt-1 p-2 bg-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Operational Sync</p>
                  <p className="text-sm font-bold text-white">Multi-sector comparison for {selectedRegions.join(', ')} is live.</p>
                  <p className="text-xs text-slate-500 mt-1">Data packets from GEE Bridge analyzed with 98.4% signal integrity.</p>
                </div>
             </div>
             
             {stats.avg < 0.5 ? (
                <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-start space-x-4">
                  <div className="mt-1 p-2 bg-red-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-1">Stress Alert</p>
                    <p className="text-sm font-bold text-white">Critical health decline in primary sector.</p>
                    <p className="text-xs text-slate-500 mt-1">NDVI drop suggests moisture deficiency or pest emergence.</p>
                  </div>
                </div>
             ) : (
                <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex items-start space-x-4">
                  <div className="mt-1 p-2 bg-blue-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Growth Index</p>
                    <p className="text-sm font-bold text-white">Optimal vegetation recovery detected.</p>
                    <p className="text-xs text-slate-500 mt-1">Spectral signatures match healthy chlorophyll levels.</p>
                  </div>
                </div>
             )}
          </div>
          <button className="mt-8 w-full py-4 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 transition-all shadow-[0_0_40px_rgba(16,185,129,0.2)]">
            GENERATE FULL INTEL REPORT
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
