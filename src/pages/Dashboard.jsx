import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
  Download,
  Zap,
  MapPin,
  PieChart as PieIcon,
  BarChart3,
  Waves,
  Crosshair,
  Maximize2
} from 'lucide-react';
import { useData } from '../context/DataContext';
import TacticalLog from '../components/TacticalLog';

const KPICard = ({ title, value, icon: Icon, color, delay, subValue }) => {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    teal: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass p-6 rounded-2xl border border-white/10 glow-card relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20" />
      
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color] || 'bg-slate-500/10 border-slate-500/20 text-slate-400'} border group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        {subValue && (
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{subValue}</span>
        )}
      </div>
      <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-black text-white mt-1 tabular-nums">{value}</h3>
    </motion.div>
  );
};

const Dashboard = () => {
  const { 
    data = [], 
    allRegionsData = {},
    stats = { avg: 0, max: 0, min: 0, classification: { Healthy: 0, Moderate: 0, Unhealthy: 0 } }, 
    insights = [],
    regions = [],
    selectedRegion,
    setSelectedRegion,
    seasonalTrends = [],
    loading
  } = useData();
  
  const [isCompareMode, setIsCompareMode] = useState(false);

  const getStatusClasses = (status) => {
    switch (status) {
      case 'Healthy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Moderate': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'Unhealthy': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const chartData = useMemo(() => {
    return data.slice(-24);
  }, [data]);

  const comparisonData = useMemo(() => {
    if (!isCompareMode) return [];
    
    // Merge data from all regions based on date
    const dates = allRegionsData['Bangalore']?.map(d => d.date) || [];
    return dates.slice(-24).map((date, idx) => {
      const entry = { date };
      regions.forEach(region => {
        const regionPoints = allRegionsData[region] || [];
        // Find matching date point or take by index if dates match perfectly
        entry[region] = regionPoints.find(d => d.date === date)?.ndvi || regionPoints[idx]?.ndvi;
      });
      return entry;
    });
  }, [allRegionsData, regions, isCompareMode]);

  const classificationData = useMemo(() => {
    return [
      { name: 'Healthy', value: stats.classification.Healthy, color: '#10b981' },
      { name: 'Moderate', value: stats.classification.Moderate, color: '#f59e0b' },
      { name: 'Unhealthy', value: stats.classification.Unhealthy, color: '#ef4444' }
    ];
  }, [stats.classification]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <p className="text-emerald-400 font-mono text-sm animate-pulse uppercase tracking-widest">Synchronizing Satellite Link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center uppercase">
            Surveillance Command
            <span className="ml-3 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-[10px] text-emerald-400 font-mono tracking-widest animate-pulse">Alpha-7</span>
          </h1>
          <div className="flex items-center text-emerald-400 text-xs font-mono mt-1 uppercase tracking-widest">
            <MapPin className="w-3 h-3 mr-1" />
            Active Grid: {isCompareMode ? 'Multi-Region Comparative' : selectedRegion}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Region Selector */}
          <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl">
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => {
                  setSelectedRegion(region);
                  setIsCompareMode(false);
                }}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                  selectedRegion === region && !isCompareMode
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                  : 'text-slate-500 hover:text-white'
                }`}
              >
                {region}
              </button>
            ))}
            <button
              onClick={() => setIsCompareMode(!isCompareMode)}
              className={`ml-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2 ${
                isCompareMode 
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                : 'text-slate-500 hover:text-white bg-white/5'
              }`}
            >
              <Maximize2 className="w-3 h-3" />
              Compare
            </button>
          </div>

          <button className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
            <Download className="w-4 h-4" />
            <span>Export Intel</span>
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard 
          title="Region Average" 
          value={stats.avg} 
          icon={Activity} 
          color="emerald" 
          delay={0.1}
          subValue={stats.currentStatus}
        />
        <KPICard 
          title="Monthly Peak" 
          value={stats.max} 
          icon={TrendingUp} 
          color="teal" 
          delay={0.2}
          subValue="Growth phase"
        />
        <KPICard 
          title="Baseline NDVI" 
          value={stats.min} 
          icon={TrendingDown} 
          color="red" 
          delay={0.3}
          subValue="Stress Threshold"
        />
        <KPICard 
          title="Active Sensors" 
          value={isCompareMode ? regions.length : 1} 
          icon={Crosshair} 
          color="indigo" 
          delay={0.4}
          subValue="Sync Frequency"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Main Trend Chart */}
        <div className="lg:col-span-8 glass p-6 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center">
              <Zap className="w-5 h-5 mr-2 text-emerald-400" />
              {isCompareMode ? 'Multi-Region Trend Analysis' : 'Vegetation Health Timeline'}
            </h3>
            {isCompareMode && (
              <div className="flex gap-4">
                {regions.map((r, i) => (
                  <div key={r} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: i === 0 ? '#10b981' : i === 1 ? '#6366f1' : '#f59e0b' }} />
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {isCompareMode ? (
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    fontFamily="monospace"
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={[0, 1]} fontFamily="monospace" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                    itemStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="Bangalore" stroke="#10b981" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="Kolar" stroke="#6366f1" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="Mysore" stroke="#f59e0b" strokeWidth={3} dot={false} />
                </LineChart>
              ) : (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorNdvi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    fontFamily="monospace"
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={[0, 1]} fontFamily="monospace" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                    itemStyle={{ color: '#10b981' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="ndvi" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorNdvi)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Classification Pie/Bar */}
        <div className="lg:col-span-4 glass p-6 rounded-2xl border border-white/10 flex flex-col">
          <div className="flex items-center space-x-2 mb-8">
            <PieIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Health Distribution</h3>
          </div>
          
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classificationData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={10} 
                  stroke="#94a3b8"
                  width={80}
                  fontFamily="monospace"
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {classificationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 space-y-2">
            {classificationData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.name}</span>
                </div>
                <span className="text-sm font-black text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Seasonal Analysis */}
        <div className="lg:col-span-4 glass p-6 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center space-x-2 mb-6">
            <Waves className="w-5 h-5 text-teal-400" />
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Seasonal Cycle</h3>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={seasonalTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="month" fontSize={9} axisLine={false} tickLine={false} stroke="#475569" fontFamily="monospace" />
                <YAxis hide domain={[0, 1]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Area type="stepAfter" dataKey="avg" stroke="#2dd4bf" fill="#2dd4bf20" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-teal-500/5 border border-teal-500/10 rounded-xl">
            <p className="text-[10px] text-teal-400 font-mono uppercase leading-relaxed tracking-wider">
              {seasonalTrends.length > 0 && (
                `Peak vegetation detected: ${seasonalTrends.reduce((a, b) => a.avg > b.avg ? a : b).month}. 
                Decline cycle typically starts in ${seasonalTrends.reduce((a, b) => a.avg < b.avg ? a : b).month}.`
              )}
            </p>
          </div>
        </div>

        {/* Intelligence / Alerts */}
        <div className="lg:col-span-5 glass p-6 rounded-2xl border border-white/10 flex flex-col">
          <div className="flex items-center space-x-2 mb-6">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Intelligence</h3>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-hide max-h-[300px]">
            {insights.map((insight, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
                className={`p-4 rounded-2xl border flex items-start space-x-4 group hover:scale-[1.02] transition-all duration-300 ${
                  insight.type === 'alert' 
                  ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}
              >
                <div className="mt-1">
                  {insight.type === 'alert' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                    {insight.type === 'alert' ? 'Threat Detected' : 'Operational Update'}
                  </h4>
                  <p className="text-sm font-medium text-slate-200">{insight.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tactical Log Mini */}
        <div className="lg:col-span-3 h-full min-h-[300px]">
          <TacticalLog />
        </div>
      </div>

      {/* Registry Table */}
      <div className="glass rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Log Registry</h3>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Region: {selectedRegion} | Logs: {data.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] text-slate-500 uppercase tracking-[0.2em] bg-white/2">
              <tr>
                <th className="px-8 py-5 font-black">Timestamp</th>
                <th className="px-8 py-5 font-black">NDVI Index</th>
                <th className="px-8 py-5 font-black">Classification</th>
                <th className="px-8 py-5 font-black text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-emerald-500/5 transition-colors group">
                  <td className="px-8 py-4 text-slate-400">{row.date}</td>
                  <td className="px-8 py-4">
                    <span className="text-white font-bold">{row.ndvi.toFixed(4)}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusClasses(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    {idx > 0 && data[idx-1].ndvi < row.ndvi ? (
                      <div className="flex items-center justify-end text-emerald-400">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-end text-red-500/50">
                        <TrendingDown className="w-4 h-4" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
