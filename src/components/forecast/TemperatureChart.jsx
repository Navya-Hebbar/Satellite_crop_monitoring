import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const COLORS = ['#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'];

export default function TemperatureChart({ regionForecasts, printWidth, printHeight }) {
  const chartData = useMemo(() => {
    if (!regionForecasts || regionForecasts.length === 0) return [];
    
    let allDates = new Set();
    regionForecasts.forEach(rf => {
      if (rf.temperature) rf.temperature.forEach(d => allDates.add(d.date));
    });
    
    const sortedDates = Array.from(allDates).sort();
    
    return sortedDates.map(date => {
      let dataPoint = { date };
      regionForecasts.forEach(rf => {
        const point = rf.temperature?.find(d => d.date === date);
        if (point) {
          dataPoint[rf.region] = point.value;
        }
      });
      return dataPoint;
    });
  }, [regionForecasts]);

  const chart = (
    <AreaChart width={printWidth} height={printHeight} data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short' })} />
      <YAxis domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 10 }} width={40} />
      <Tooltip
        contentStyle={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: 12,
        }}
      />
      <Legend />
      {(regionForecasts || []).map((rf, idx) => (
        <Area
          key={rf.region}
          type="monotone"
          dataKey={rf.region}
          name={`${rf.region} (°C)`}
          stroke={COLORS[idx % COLORS.length]}
          fill={COLORS[idx % COLORS.length]}
          fillOpacity={0.15}
          strokeWidth={2}
          dot={false}
          connectNulls
          isAnimationActive={false}
        />
      ))}
    </AreaChart>
  );

  if (printWidth && printHeight) {
    return (
      <div style={{ width: printWidth, height: printHeight + 30 }}>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">
          Temperature (Historical)
        </h3>
        {chart}
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl border border-white/10 p-6 h-[350px]">
      <h3 className="text-sm font-black uppercase tracking-widest text-amber-400 mb-4">
        Temperature (Historical)
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        {chart}
      </ResponsiveContainer>
    </div>
  );
}
