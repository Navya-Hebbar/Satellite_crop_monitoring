import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#f472b6', '#a78bfa'];

export default function RegionNdviComparisonChart({ regionForecasts }) {
  const dates = Array.from(
    new Set(regionForecasts.flatMap((region) => region.ndvi.map((row) => row.date)))
  ).sort();

  const chartData = dates.map((date) => {
    const row = { date };
    regionForecasts.forEach((region) => {
      const point = region.ndvi.find((item) => item.date === date);
      row[region.region] = point ? point.value : null;
    });
    return row;
  });

  return (
    <div className="glass rounded-3xl border border-white/10 p-6 h-[420px]">
      <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-4">
        Region NDVI Comparison
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis domain={[-0.1, 1]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 12,
            }}
          />
          <Legend wrapperStyle={{ color: '#cbd5e1' }} />
          {regionForecasts.map((region, idx) => (
            <Line
              key={region.region}
              type="monotone"
              dataKey={region.region}
              name={region.region}
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={2.5}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
