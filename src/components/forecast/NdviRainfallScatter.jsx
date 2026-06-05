import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function NdviRainfallScatter({ ndviSeries, rainfallSeries }) {
  const rainfallByDate = new Map(rainfallSeries.map((row) => [row.date, row.value]));

  const chartData = ndviSeries
    .map((row) => {
      const rainfall = rainfallByDate.get(row.date);
      return rainfall != null
        ? { date: row.date, ndvi: row.value, rainfall }
        : null;
    })
    .filter(Boolean);

  return (
    <div className="glass rounded-3xl border border-white/10 p-6 h-[360px]">
      <h3 className="text-sm font-black uppercase tracking-widest text-sky-400 mb-4">
        NDVI vs Rainfall
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
          <XAxis dataKey="rainfall" tick={{ fill: '#94a3b8', fontSize: 10 }} name="Rainfall" unit="mm" />
          <YAxis dataKey="ndvi" tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[-0.1, 1]} name="NDVI" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 12,
            }}
            formatter={(value, name) => [value, name === 'ndvi' ? 'NDVI' : 'Rainfall']}
          />
          <Legend />
          <Scatter name="Data points" data={chartData} fill="#38bdf8" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
