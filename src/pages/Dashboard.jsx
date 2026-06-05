import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, ComposedChart, Bar, ScatterChart, Scatter, ZAxis
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, Map as MapIcon,
  Calendar, Info, Plus, Trash2, Monitor, AlertTriangle,
  ArrowUpRight, CheckCircle2, AlertCircle, Shield,
  History, FileText, MapPin, X, Droplets
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import TacticalLog from '../components/TacticalLog';

const KPICard = ({ title, value, subValue, icon: Icon, color }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  return (
    <motion.div
      style={{ rotateX, rotateY, perspective: 1000 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden group cursor-crosshair glow-card"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-12 h-12" />
      </div>
      <div className="flex items-center space-x-4 mb-4 relative z-10">
        <div className={`p-3 bg-white/5 rounded-2xl border border-white/10 glow-green ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase">{title}</p>
          <p className="text-2xl font-black text-white matrix-text">{value}</p>
        </div>
      </div>
      <p className="text-xs text-slate-400 font-medium relative z-10">{subValue}</p>

      {/* Glare effect */}
      <motion.div
        className="absolute inset-0 z-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          x: useTransform(x, [-100, 100], [-50, 50]),
          y: useTransform(y, [-100, 100], [-50, 50]),
        }}
      />
    </motion.div>
  );
};

const Dashboard = () => {
  const {
    data = [],
    allRegionsData = {},
    stats = { avg: 0, max: 0, min: 0, currentStatus: 'N/A' },
    selectedRegions = ['Bangalore'],
    setSelectedRegions,
    allCities = [],
    seasonalTrends = [],
    loading,
    startDate, setStartDate,
    endDate, setEndDate,
    bufferSize, setBufferSize,
    showYoY, setShowYoY,
    yoyDataMap,
    addCustomRegion
  } = useData();

  const [activeLogRegion, setActiveLogRegion] = useState(selectedRegions[0]);
  const currentLogRegion = selectedRegions.includes(activeLogRegion) ? activeLogRegion : selectedRegions[0];
  const logData = allRegionsData[currentLogRegion] || [];

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const [customSlotIndex, setCustomSlotIndex] = useState(null);

  const [aiReport, setAiReport] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const generateAIReport = async () => {
    setIsGeneratingReport(true);
    try {
      const response = await fetch('http://localhost:3001/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats,
          selectedRegions,
          data: allRegionsData[selectedRegions[0]] || []
        })
      });
      const result = await response.json();
      if (result.error) {
        setAiReport(`Error: ${result.error}`);
      } else {
        setAiReport(result.report);
      }
    } catch (err) {
      setAiReport('Failed to connect to backend AI service.');
    }
    setIsGeneratingReport(false);
  };

  const handleAddCustomRegion = () => {
    const name = customName.trim();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (!name || isNaN(lat) || isNaN(lng)) return;

    addCustomRegion(name, lat, lng);

    if (customSlotIndex !== null) {
      // Replace existing slot
      setTimeout(() => updateSlot(customSlotIndex, name), 100);
    } else {
      // Add as new slot
      setTimeout(() => setSelectedRegions(prev => [...prev, name]), 100);
    }

    setCustomName('');
    setCustomLat('');
    setCustomLng('');
    setCustomSlotIndex(null);
    setShowCustomModal(false);
  };

  const exportToPDF = () => {
    window.print();
  };

  const addSlot = () => {
    if (selectedRegions.length < 5) {
      const nextCity = allCities.find(c => !selectedRegions.includes(c)) || allCities[0];
      setSelectedRegions([...selectedRegions, nextCity]);
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
    if (!selectedRegions || selectedRegions.length === 0) return [];

    const dateMap = {};

    selectedRegions.forEach(region => {
      if (allRegionsData[region]) {
        allRegionsData[region].forEach(d => {
          if (!dateMap[d.date]) dateMap[d.date] = { date: d.date };
          dateMap[d.date][region] = d.ndvi;
        });
      }
    });

    if (showYoY) {
      selectedRegions.forEach(region => {
        if (yoyDataMap[region]) {
          yoyDataMap[region].forEach(d => {
            const yDate = new Date(d.date);
            yDate.setFullYear(yDate.getFullYear() + 1);
            const shiftedDateStr = yDate.toISOString().split('T')[0];

            if (!dateMap[shiftedDateStr]) dateMap[shiftedDateStr] = { date: shiftedDateStr };
            dateMap[shiftedDateStr][`${region} (Prev Year)`] = d.ndvi;
          });
        }
      });
    }

    return Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [allRegionsData, selectedRegions, showYoY, yoyDataMap]);

  const envData = useMemo(() => {
    if (!selectedRegions || selectedRegions.length === 0 || !allRegionsData[selectedRegions[0]]) return [];
    return allRegionsData[selectedRegions[0]].map(d => ({
      date: new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      rainfall: d.rainfall != null ? Number(d.rainfall.toFixed(1)) : 0,
      temperature: d.temperature != null ? Number(d.temperature.toFixed(1)) : 0,
      ndvi: d.ndvi != null ? Number(d.ndvi.toFixed(3)) : 0
    }));
  }, [allRegionsData, selectedRegions]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading && (!allRegionsData || Object.keys(allRegionsData).length === 0)) {
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
    <>
      {/* --- DASHBOARD VIEW (HIDDEN ON PRINT) --- */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 print:hidden">

      {/* Custom Location Modal */}
      <AnimatePresence>
        {showCustomModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowCustomModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass p-8 rounded-[2rem] border border-white/10 w-full max-w-md space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-cyan-400" />
                  Add Custom Location
                </h3>
                <button onClick={() => setShowCustomModal(false)} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Location Name</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. New Delhi"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={customLat}
                      onChange={(e) => setCustomLat(e.target.value)}
                      placeholder="28.6139"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={customLng}
                      onChange={(e) => setCustomLng(e.target.value)}
                      placeholder="77.2090"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={handleAddCustomRegion}
                disabled={!customName.trim() || !customLat || !customLng}
                className="w-full py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-xl text-cyan-300 font-bold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                🛰️ Deploy Satellite Scan
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Slot Selection & Mission Parameters */}
      <div className="flex flex-col gap-8 print:hidden">
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
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setCustomSlotIndex(idx);
                        setShowCustomModal(true);
                      } else {
                        updateSlot(idx, e.target.value);
                      }
                    }}
                    className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer pr-1"
                  >
                    {allCities.map(c => (
                      <option key={c} value={c} className="bg-[#0f172a]">{c}</option>
                    ))}
                    <option value="__custom__" className="bg-[#0f172a] text-emerald-400">📍 Custom Location...</option>
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
              <>
                <button
                  onClick={addSlot}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-bold transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Region</span>
                </button>
                <button
                  onClick={() => { setCustomSlotIndex(null); setShowCustomModal(true); }}
                  className="flex items-center space-x-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl text-cyan-400 text-sm font-bold transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Custom</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex gap-2">
              <button onClick={exportToPDF} className="flex items-center space-x-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl text-purple-400 text-sm font-bold transition-all">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            </div>
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

        {/* Dynamic Mission Parameters Panel */}
        <div className="glass p-8 rounded-[2rem] border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center">
              <Calendar className="w-3 h-3 mr-2 text-emerald-400" />
              Analysis Start
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:border-emerald-500/50 outline-none transition-all"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center">
              <Calendar className="w-3 h-3 mr-2 text-blue-400" />
              Analysis End
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:border-blue-500/50 outline-none transition-all"
            />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center">
                <Shield className="w-3 h-3 mr-2 text-yellow-400" />
                Scanning Buffer
              </label>
              <span className="text-[10px] font-mono text-white bg-white/5 px-2 py-0.5 rounded-md">{bufferSize}m</span>
            </div>
            <input
              type="range"
              min="100" max="5000" step="100"
              value={bufferSize}
              onChange={(e) => setBufferSize(parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
            />
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
        <div className="lg:col-span-2 glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
          {loading && (
            <div className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-sm z-50 flex items-center justify-center rounded-[2.5rem]">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-[10px] text-emerald-400 font-black tracking-widest uppercase animate-pulse">Re-syncing GEE Feed...</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-emerald-400" />
                Comparative NDVI Timeline
              </h3>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Multi-spectral temporal distribution</p>
            </div>
            <button
              onClick={() => setShowYoY(!showYoY)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${showYoY ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
            >
              <History className="w-3.5 h-3.5" />
              <span>YoY Compare</span>
            </button>
          </div>

          <div className="h-[350px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#475569"
                  fontSize={10}
                  tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={10}
                  domain={[0.2, 1]}
                  tickFormatter={(val) => Number(val).toFixed(2)}
                />
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
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    connectNulls
                  />
                ))}
                {showYoY && selectedRegions.map((region, idx) => (
                  <Line
                    key={`${region} (Prev Year)`}
                    type="monotone"
                    dataKey={`${region} (Prev Year)`}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                    connectNulls
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
              const total = regionData.length || 1;
              const healthyCount = regionData.filter(d => d.ndvi > 0.6).length;
              const moderateCount = regionData.filter(d => d.ndvi >= 0.3 && d.ndvi <= 0.6).length;
              const unhealthyCount = regionData.filter(d => d.ndvi < 0.3).length;

              return (
                <div key={city} className="space-y-2 p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{city}</span>
                    <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">{idx === 0 ? 'Primary' : `Slot ${idx + 1}`}</span>
                  </div>
                  <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden flex">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(healthyCount / total) * 100}%` }} className="h-full bg-emerald-500" />
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(moderateCount / total) * 100}%` }} className="h-full bg-yellow-500" />
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(unhealthyCount / total) * 100}%` }} className="h-full bg-red-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Seasonal Trends */}
        <div className="glass p-8 rounded-[2.5rem] border border-white/10">
          <h3 className="text-xl font-black text-white mb-6 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-emerald-400" />
            Seasonal Performance
          </h3>
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-white flex items-center">
              <Shield className="w-5 h-5 mr-2 text-emerald-400" />
              AI Insights Hub
            </h3>
            <button
              onClick={generateAIReport}
              disabled={isGeneratingReport}
              className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 rounded-xl text-indigo-300 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingReport ? 'Generating...' : '✨ Generate AI Report'}
            </button>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {!aiReport && !isGeneratingReport && (
              <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-start space-x-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-1" />
                <div>
                  <p className="text-sm font-bold text-white">System Synchronized</p>
                  <p className="text-xs text-slate-500">Live feed active for {selectedRegions.length} sectors. Click 'Generate' for AI analysis.</p>
                </div>
              </div>
            )}
            {isGeneratingReport && (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {aiReport && !isGeneratingReport && (
              <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                {aiReport}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:hidden">
        {/* Environmental Overlay */}
        <div className="glass p-8 rounded-[2.5rem] border border-white/10">
          <h3 className="text-xl font-black text-white mb-6 flex items-center">
            <Droplets className="w-5 h-5 mr-2 text-blue-400" />
            Environmental Factors ({selectedRegions[0]})
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={envData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" fontSize={10} />
                <YAxis yAxisId="left" stroke="#3b82f6" fontSize={10} width={40} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={10} width={40} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} />
                <Bar yAxisId="left" dataKey="rainfall" name="Rainfall (mm)" fill="#3b82f6" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* NDVI vs Rainfall Scatter */}
        <div className="glass p-8 rounded-[2.5rem] border border-white/10">
          <h3 className="text-xl font-black text-white mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-emerald-400" />
            Rainfall to NDVI Correlation
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="rainfall" name="Rainfall" stroke="#475569" fontSize={10} tickFormatter={v => `${v}mm`} />
                <YAxis type="number" dataKey="ndvi" name="NDVI" stroke="#475569" fontSize={10} domain={['auto', 'auto']} />
                <ZAxis type="number" range={[40, 40]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Scatter name="Correlation" data={envData} fill="#10b981" opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Log Registry - Hidden from report to keep it concise */}
      <div className="glass rounded-[2.5rem] border border-white/10 overflow-hidden print:hidden">
        <div className="px-8 py-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between bg-white/5 gap-4">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Spectral Log Registry</h3>

          {/* Tabs for Regions */}
          <div className="flex flex-wrap gap-2">
            {selectedRegions.map((region) => (
              <button
                key={region}
                onClick={() => setActiveLogRegion(region)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${currentLogRegion === region
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="text-[10px] text-slate-500 uppercase tracking-[0.2em] bg-white/2 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5">NDVI Index</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
              {Array.isArray(logData) && logData.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="px-8 py-4 text-slate-400">{row.date}</td>
                  <td className="px-8 py-4 text-white font-bold matrix-text">{row.ndvi.toFixed(4)}</td>
                  <td className="px-8 py-4">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border ${row.ndvi > 0.6 ? 'border-emerald-500/20 text-emerald-400' : 'border-red-500/20 text-red-400'
                      }`}>
                      {row.ndvi > 0.6 ? 'Healthy' : 'Stress'}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    {idx > 0 && logData[idx - 1].ndvi < row.ndvi ? <ArrowUpRight className="inline w-4 h-4 text-emerald-400" /> : <TrendingDown className="inline w-4 h-4 text-red-500/30" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tactical Log - Hidden from report */}
      <div className="h-[300px] print:hidden">
        <TacticalLog />
      </div>
    </div>

      {/* --- FORMAL PRINT REPORT VIEW --- */}
      <div className="hidden print:block font-serif text-black bg-white min-h-screen relative pt-8 pb-16 px-4">
        
        {/* Repeating Footer */}
        <div className="fixed bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-400 border-t border-gray-200 pt-3 pb-4 bg-white font-sans">
          <span className="font-semibold">SatCrop Intelligence Platform</span>
          <span>Generated: {new Date().toLocaleDateString()}</span>
        </div>

        {/* Report Header */}
        <div className="border-b-2 border-black pb-6 mb-8 text-center">
          <h1 className="text-3xl font-bold uppercase tracking-widest text-black">SatCrop Analytical Report</h1>
          <p className="mt-2 text-gray-600 font-sans text-sm">Automated Crop Health & Environmental Synthesis</p>
        </div>

        {/* Mission Parameters */}
        <div className="mb-10 font-sans">
          <div className="grid grid-cols-2 gap-4 border border-gray-300 p-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Analysis Period</p>
              <p className="text-sm font-semibold">{startDate} to {endDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Target Regions</p>
              <p className="text-sm font-semibold">{selectedRegions.join(', ')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Scan Resolution</p>
              <p className="text-sm font-semibold">{bufferSize}m Buffer</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Mission Status</p>
              <p className="text-sm font-semibold text-emerald-700">{selectedRegions.length > 1 ? 'Multi-Sector Benchmark' : 'Single Grid Recon'}</p>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4 border-b border-gray-300 pb-1 text-black">1. Executive Summary</h2>
          <div className="grid grid-cols-4 gap-4 mb-6 font-sans">
            <div className="border border-gray-200 p-3 bg-gray-50">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Average Health</p>
              <p className="text-lg font-bold text-emerald-700">{stats.avg}</p>
              <p className="text-[10px] uppercase font-bold text-emerald-600">{stats.currentStatus}</p>
            </div>
            <div className="border border-gray-200 p-3 bg-gray-50">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Peak NDVI</p>
              <p className="text-lg font-bold">{stats.max}</p>
            </div>
            <div className="border border-gray-200 p-3 bg-gray-50">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Min Index</p>
              <p className="text-lg font-bold text-red-600">{stats.min}</p>
            </div>
            <div className="border border-gray-200 p-3 bg-gray-50">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Active Sectors</p>
              <p className="text-lg font-bold">{selectedRegions.length}</p>
            </div>
          </div>
          <div className="border border-gray-300 p-5 bg-blue-50/30 text-sm font-sans leading-relaxed">
            <h3 className="font-bold text-indigo-900 mb-2 border-b border-indigo-100 pb-2">AI Diagnostic Insights</h3>
            <div className="whitespace-pre-wrap text-gray-800">
              {aiReport ? aiReport : "No AI insights generated. Click 'Generate AI Report' on the dashboard prior to export."}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="mb-12 break-inside-avoid">
           <h2 className="text-xl font-bold mb-6 border-b border-gray-300 pb-1 text-black">2. Temporal NDVI Analysis</h2>
           <div className="mx-auto" style={{ width: '750px', height: '350px' }}>
             <LineChart data={comparisonData} width={750} height={350} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="#ccc" vertical={false} />
               <XAxis dataKey="date" stroke="#000" fontSize={11} tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })} />
               <YAxis stroke="#000" fontSize={11} domain={[0.2, 1]} />
               <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }} />
               {selectedRegions.map((region, idx) => (
                 <Line key={region} type="monotone" dataKey={region} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={false} isAnimationActive={false} />
               ))}
             </LineChart>
           </div>
        </div>

        <div className="mb-12 break-inside-avoid">
           <h2 className="text-xl font-bold mb-6 border-b border-gray-300 pb-1 text-black">3. Environmental Overlay ({selectedRegions[0]})</h2>
           <div className="mx-auto" style={{ width: '750px', height: '350px' }}>
             <ComposedChart data={envData} width={750} height={350} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="#ccc" vertical={false} />
               <XAxis dataKey="date" stroke="#000" fontSize={11} />
               <YAxis yAxisId="left" stroke="#3b82f6" fontSize={11} width={40} />
               <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={11} width={40} />
               <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
               <Bar yAxisId="left" dataKey="rainfall" name="Rainfall (mm)" fill="#3b82f6" fillOpacity={0.6} isAnimationActive={false} />
               <Line yAxisId="right" type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
             </ComposedChart>
           </div>
        </div>

      </div>
    </>
  );
};

export default Dashboard;