import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function NdviHistogram({ ndviSeries }) {
  const bins = Array.from({ length: 10 }, (_, index) => ({
    bin: `${(index * 0.1).toFixed(1)}-${((index + 1) * 0.1).toFixed(1)}`,
    min: index * 0.1,
    max: (index + 1) * 0.1,
    count: 0,
  }));

  ndviSeries.forEach((point) => {
    const value = point.value;
    if (value == null || Number.isNaN(value)) return;
    const index = Math.min(Math.floor(value / 0.1), bins.length - 1);
    bins[index].count += 1;
  });

  const chartData = bins.map((bin) => ({
    name: bin.bin,
    count: bin.count,
  }));

  return (
    <div className="glass rounded-3xl border border-white/10 p-6 h-[360px]">
      <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-4">
        NDVI Distribution
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 12,
            }}
          />
          <Bar dataKey="count" name="Points" fill="#34d399" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
