import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function NdviForecastChart({ regionForecasts, forecastStart }) {
  const chartData = useMemo(() => {
    if (!regionForecasts || regionForecasts.length === 0) return [];
    
    let allDates = new Set();
    regionForecasts.forEach(rf => {
      if (rf.ndvi) rf.ndvi.forEach(d => allDates.add(d.date));
      if (rf.prediction) allDates.add(rf.prediction.date);
    });
    
    const sortedDates = Array.from(allDates).sort();
    
    const data = sortedDates.map(date => {
      let dataPoint = { date };
      regionForecasts.forEach((rf) => {
        const histPoint = rf.ndvi?.find(d => d.date === date);
        if (histPoint) {
          dataPoint[`${rf.region}_hist`] = histPoint.value;
        }
        if (rf.prediction?.date === date) {
          dataPoint[`${rf.region}_pred`] = rf.prediction.predicted_ndvi;
        }
      });
      return dataPoint;
    });
    
    regionForecasts.forEach(rf => {
      if (rf.ndvi && rf.ndvi.length > 0 && rf.prediction) {
        const lastHistDate = rf.ndvi[rf.ndvi.length - 1].date;
        const point = data.find(d => d.date === lastHistDate);
        if (point && point[`${rf.region}_hist`] !== undefined) {
          point[`${rf.region}_pred`] = point[`${rf.region}_hist`];
        }
      }
    });
    
    return data;
  }, [regionForecasts]);

  return (
    <div className="glass rounded-3xl border border-white/10 p-6 h-[380px]">
      <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-4">
        NDVI Forecast (Multi-Region)
      </h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })} />
          <YAxis domain={[0.1, 1]} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(val) => Number(val).toFixed(2)} width={35} />
          <Tooltip
            contentStyle={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 12,
            }}
          />
          <Legend />
          {forecastStart && (
            <ReferenceLine
              x={forecastStart}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{ value: 'Forecast Start', fill: '#fbbf24', fontSize: 10 }}
            />
          )}
          {(regionForecasts || []).map((rf, idx) => (
            <Line
              key={`${rf.region}_hist`}
              type="monotone"
              dataKey={`${rf.region}_hist`}
              name={`${rf.region} (Hist)`}
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
            />
          ))}
          {(regionForecasts || []).map((rf, idx) => (
            <Line
              key={`${rf.region}_pred`}
              type="monotone"
              dataKey={`${rf.region}_pred`}
              name={`${rf.region} (Pred)`}
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={2.5}
              strokeDasharray="8 6"
              dot={{ r: 4, fill: COLORS[idx % COLORS.length] }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
