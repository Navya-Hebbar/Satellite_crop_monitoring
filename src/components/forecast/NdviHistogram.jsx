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

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function NdviHistogram({ regionForecasts, printWidth, printHeight }) {
  const chartData = useMemo(() => {
    if (!regionForecasts || regionForecasts.length === 0) return [];
    
    // Define bins
    const bins = [
      { range: '-1 to 0', min: -1, max: 0 },
      { range: '0 to 0.2', min: 0, max: 0.2 },
      { range: '0.2 to 0.4', min: 0.2, max: 0.4 },
      { range: '0.4 to 0.6', min: 0.4, max: 0.6 },
      { range: '0.6 to 0.8', min: 0.6, max: 0.8 },
      { range: '0.8 to 1.0', min: 0.8, max: 1.0 },
    ];
    
    // Initialize bin counts for each region
    const data = bins.map(b => {
      const binData = { range: b.range, min: b.min, max: b.max };
      regionForecasts.forEach(rf => {
        binData[rf.region] = 0;
      });
      return binData;
    });

    regionForecasts.forEach(rf => {
      if (rf.ndvi) {
        rf.ndvi.forEach(d => {
          const val = d.value;
          for (let b of data) {
            if (val >= b.min && val <= b.max) {
              b[rf.region] += 1;
              break;
            }
          }
        });
      }
    });

    return data.filter(b => regionForecasts.some(rf => b[rf.region] > 0)); // Only show bins with data
  }, [regionForecasts]);

  const chart = (
    <BarChart data={chartData} width={printWidth} height={printHeight} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
      <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 10 }} />
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
          name={rf.region}
          fill={COLORS[idx % COLORS.length]}
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
      ))}
    </BarChart>
  );

  if (printWidth && printHeight) {
    return (
      <div style={{ width: printWidth, height: printHeight + 30 }}>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">
          NDVI Distribution
        </h3>
        {chart}
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl border border-white/10 p-6 h-[350px]">
      <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-4">
        NDVI Distribution
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        {chart}
      </ResponsiveContainer>
    </div>
  );
}
