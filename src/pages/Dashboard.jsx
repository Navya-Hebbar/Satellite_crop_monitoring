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
  Download
} from 'lucide-react';
import { useData } from '../context/DataContext';

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
      className="glass p-6 rounded-2xl border border-white/10 glow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color] || 'bg-slate-500/10 border-slate-500/20 text-slate-400'} border`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-slate-400 text-sm font-medium">{title}</p>
      <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
    </motion.div>
  );
};

const Dashboard = () => {
  const { data, stats, insights } = useData();
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
          <h1 className="text-3xl font-bold text-white">NDVI Analytics Dashboard</h1>
          <p className="text-slate-400 mt-1">Satellite vegetation indices and health tracking</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Last 30 Days</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard 
          title="Average NDVI" 
          value={Number(stats?.avg || 0).toFixed(3)} 
          icon={Activity} 
          color="emerald" 
          delay={0.1}
        />
        <KPICard 
          title="Maximum NDVI" 
          value={Number(stats?.max || 0).toFixed(3)} 
          icon={TrendingUp} 
          color="teal" 
          delay={0.2}
        />
        <KPICard 
          title="Minimum NDVI" 
          value={Number(stats?.min || 0).toFixed(3)} 
          icon={TrendingDown} 
          color="red" 
          delay={0.3}
        />
        <KPICard 
          title="Total Data Points" 
          value={data?.length || 0} 
          icon={Layers} 
          color="slate" 
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">NDVI Time-Series Trend</h3>
            <div className="flex space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-xs text-slate-400">Vegetation Index</span>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
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
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  domain={[0, 1]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ndvi" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorNdvi)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights Panel */}
        <div className="glass p-6 rounded-2xl border border-white/10">
          <div className="flex items-center space-x-2 mb-6">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">Automated Insights</h3>
          </div>
          <div className="space-y-4">
            {(insights || []).map((insight, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (idx * 0.1) }}
                className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-start space-x-3"
              >
                {insight.type === 'info' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-teal-400 mt-0.5" />
                )}
                <p className="text-sm text-slate-300 leading-relaxed">{insight.text}</p>
              </motion.div>
            ))}
            
            <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Health Score</span>
                <span className="text-lg font-bold text-emerald-400">{(stats.avg * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                  style={{ width: `${(Number(stats?.avg || 0) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <h3 className="text-lg font-bold text-white">Detailed Data Records</h3>
          <span className="text-xs text-slate-500">Showing all records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-slate-400 uppercase bg-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">NDVI Value</th>
                <th className="px-6 py-4 font-semibold">Classification</th>
                <th className="px-6 py-4 font-semibold text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-300">{row.date}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-white">{row.ndvi.toFixed(4)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusClasses(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {idx > 0 && data[idx-1].ndvi < row.ndvi ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-400 ml-auto" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-slate-500 ml-auto" />
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
