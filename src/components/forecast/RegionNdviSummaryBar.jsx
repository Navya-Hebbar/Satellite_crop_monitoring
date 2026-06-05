import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function RegionNdviSummaryBar({ regionForecasts }) {
  const chartData = regionForecasts.map((region) => ({
    region: region.region,
    current_ndvi: region.prediction.current_ndvi,
    predicted_ndvi: region.prediction.predicted_ndvi,
  }));

  return (
    <div className="glass rounded-3xl border border-white/10 p-6 h-[420px]">
      <h3 className="text-sm font-black uppercase tracking-widest text-sky-400 mb-4">
        Regional NDVI Benchmark
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
          <XAxis dataKey="region" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <YAxis domain={[-0.1, 1]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 12,
            }}
          />
          <Legend wrapperStyle={{ color: '#cbd5e1' }} />
          <Bar dataKey="current_ndvi" name="Current NDVI" fill="#10b981" radius={[6, 6, 0, 0]} />
          <Bar dataKey="predicted_ndvi" name="Predicted NDVI" fill="#38bdf8" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
