import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];

export default function NdviRainfallScatter({ regionForecasts, printWidth, printHeight }) {
  const scatterDataByRegion = useMemo(() => {
    if (!regionForecasts || regionForecasts.length === 0) return [];

    return regionForecasts.map(rf => {
      const dataPoints = [];
      if (rf.ndvi && rf.rainfall) {
        rf.ndvi.forEach(n => {
          const r = rf.rainfall.find(r => r.date === n.date);
          if (r) {
            dataPoints.push({
              ndvi: n.value,
              rainfall: r.value,
              date: n.date,
            });
          }
        });
      }
      return {
        region: rf.region,
        data: dataPoints
      };
    });
  }, [regionForecasts]);

  const chart = (
    <ScatterChart width={printWidth} height={printHeight} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
      <XAxis
        type="number"
        dataKey="rainfall"
        name="Rainfall"
        unit="mm"
        tick={{ fill: '#94a3b8', fontSize: 10 }}
        domain={['auto', 'auto']}
      />
      <YAxis
        type="number"
        dataKey="ndvi"
        name="NDVI"
        tick={{ fill: '#94a3b8', fontSize: 10 }}
        domain={[0, 1]}
        width={40}
      />
      <Tooltip
        cursor={{ strokeDasharray: '3 3' }}
        contentStyle={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: 12,
        }}
      />
      <Legend />
      {scatterDataByRegion.map((regionData, idx) => (
        <Scatter
          key={regionData.region}
          name={regionData.region}
          data={regionData.data}
          fill={COLORS[idx % COLORS.length]}
          isAnimationActive={false}
        />
      ))}
    </ScatterChart>
  );

  if (printWidth && printHeight) {
    return (
      <div style={{ width: printWidth, height: printHeight + 30 }}>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-2">
          NDVI vs Rainfall
        </h3>
        {chart}
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl border border-white/10 p-6 h-[350px]">
      <h3 className="text-sm font-black uppercase tracking-widest text-purple-400 mb-4">
        NDVI vs Rainfall
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        {chart}
      </ResponsiveContainer>
    </div>
  );
}
