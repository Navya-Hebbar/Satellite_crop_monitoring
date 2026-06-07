import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f472b6', '#fbbf24'];

export default function RainfallChart({ regionForecasts, printWidth, printHeight }) {
  const chartData = useMemo(() => {
    if (!regionForecasts || regionForecasts.length === 0) return [];
    
    let allDates = new Set();
    regionForecasts.forEach(rf => {
      if (rf.rainfall) rf.rainfall.forEach(d => allDates.add(d.date));
    });
    
    const sortedDates = Array.from(allDates).sort();
    
    return sortedDates.map(date => {
      let dataPoint = { date };
      regionForecasts.forEach(rf => {
        const point = rf.rainfall?.find(d => d.date === date);
        if (point) {
          dataPoint[rf.region] = point.value;
        }
      });
      return dataPoint;
    });
  }, [regionForecasts]);

  const chart = (
    <BarChart width={printWidth} height={printHeight} data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short' })} />
      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} width={40} />
      <Tooltip
        cursor={{ fill: '#334155', opacity: 0.4 }}
        contentStyle={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: 12,
        }}
      />
      <Legend />
      {(regionForecasts || []).map((rf, idx) => (
        <Bar
          key={rf.region}
          dataKey={rf.region}
          name={`${rf.region} (mm)`}
          fill={COLORS[idx % COLORS.length]}
          radius={[2, 2, 0, 0]}
          isAnimationActive={false}
        />
      ))}
    </BarChart>
  );

  if (printWidth && printHeight) {
    return (
      <div style={{ width: printWidth, height: printHeight + 30 }}>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-sky-400 mb-2">
          Rainfall (Historical)
        </h3>
        {chart}
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl border border-white/10 p-6 h-[350px]">
      <h3 className="text-sm font-black uppercase tracking-widest text-sky-400 mb-4">
        Rainfall (Historical)
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        {chart}
      </ResponsiveContainer>
    </div>
  );
}
