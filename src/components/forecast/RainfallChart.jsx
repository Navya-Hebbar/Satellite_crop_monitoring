import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function RainfallChart({ data }) {
  return (
    <div className="glass rounded-3xl border border-white/10 p-6 h-[280px]">
      <h3 className="text-sm font-black uppercase tracking-widest text-sky-400 mb-4">
        Rainfall (Historical)
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            name="Rainfall (mm)"
            stroke="#38bdf8"
            fill="url(#rainGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
