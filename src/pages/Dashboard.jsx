import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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
  Cell
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
  Zap
} from 'lucide-react';
import { useData } from '../context/DataContext';
import TacticalLog from '../components/TacticalLog';

const KPICard = ({ title, value, icon: Icon, color, delay }) => {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    teal: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
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
      </div>
      <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-black text-white mt-1 tabular-nums">{value}</h3>
    </motion.div>
  );
};

const Dashboard = () => {
  const { data = [], stats = { avg: 0, max: 0, min: 0 }, insights = [] } = useData();
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusClasses = (status) => {
    switch (status) {
      case 'Healthy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Moderate': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'Unhealthy': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const chartData = useMemo(() => {
    return data.slice(-20); // Show last 20 data points for better visibility
  }, [data]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">DATA COMMAND</h1>
          <div className="flex items-center text-emerald-400 text-xs font-mono mt-1 uppercase tracking-widest">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2" />
            Live Satellite Feed : Connected
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Time Range</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
            <Download className="w-4 h-4" />
            <span>Export Intelligence</span>
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard 
          title="Avg NDVI" 
          value={Number(stats?.avg || 0).toFixed(3)} 
          icon={Activity} 
          color="emerald" 
          delay={0.1}
        />
        <KPICard 
          title="Peak NDVI" 
          value={Number(stats?.max || 0).toFixed(3)} 
          icon={TrendingUp} 
          color="teal" 
          delay={0.2}
        />
        <KPICard 
          title="Min NDVI" 
          value={Number(stats?.min || 0).toFixed(3)} 
          icon={TrendingDown} 
          color="red" 
          delay={0.3}
        />
        <KPICard 
          title="Data Points" 
          value={data?.length || 0} 
          icon={Layers} 
          color="slate" 
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-white/10 relative overflow-hidden">
          {/* Chart Scanning Effect */}
          <motion.div 
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent skew-x-12 z-0"
          />

          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center">
              <Zap className="w-5 h-5 mr-2 text-emerald-400" />
              Vegetation Trend Matrix
            </h3>
            <div className="flex space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Active Scan</span>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorNdvi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  fontFamily="monospace"
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  domain={[0, 1]}
                  fontFamily="monospace"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ndvi" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorNdvi)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights & Log Panel */}
        <div className="flex flex-col space-y-8">
          {/* Insights Panel */}
          <div className="glass p-6 rounded-2xl border border-white/10 relative overflow-hidden flex-1">
            <div className="flex items-center space-x-2 mb-6">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">Intelligence</h3>
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
              {(insights || []).map((insight, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (idx * 0.1) }}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-start space-x-3 group hover:bg-white/10 transition-colors"
                >
                  {insight.type === 'info' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-teal-400 mt-0.5" />
                  )}
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">{insight.text}</p>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-8 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2">
                <Zap className="w-4 h-4 text-emerald-500/30" />
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Overall Health</span>
                <span className="text-2xl font-black text-white">{(Number(stats?.avg || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(Number(stats?.avg || 0) * 100)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="bg-emerald-500 h-full rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6)]" 
                />
              </div>
            </div>
          </div>

          {/* Tactical Log */}
          <div className="h-[250px]">
            <TacticalLog />
          </div>
        </div>

      </div>

      {/* Data Table */}
      <div className="glass rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <h3 className="text-xl font-bold text-white uppercase tracking-tight">Log Registry</h3>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Total Entries: {data.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] text-slate-500 uppercase tracking-[0.2em] bg-white/2">
              <tr>
                <th className="px-8 py-5 font-black">Timestamp</th>
                <th className="px-8 py-5 font-black">Index Value</th>
                <th className="px-8 py-5 font-black">Classification</th>
                <th className="px-8 py-5 font-black text-right">Vector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-emerald-500/5 transition-colors group">
                  <td className="px-8 py-4 text-slate-400">{row.date}</td>
                  <td className="px-8 py-4">
                    <span className="text-white font-bold">{row.ndvi.toFixed(4)}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getStatusClasses(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    {idx > 0 && data[idx-1].ndvi < row.ndvi ? (
                      <div className="flex items-center justify-end text-emerald-400">
                        <span className="mr-2">POSITIVE</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-end text-slate-600">
                        <span className="mr-2">STABLE</span>
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
