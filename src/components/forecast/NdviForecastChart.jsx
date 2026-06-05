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

export default function NdviForecastChart({ ndviSeries, prediction, forecastStart }) {
  const lastHist = ndviSeries[ndviSeries.length - 1];
  const chartData = ndviSeries.map((p) => ({
    date: p.date,
    historical: p.value,
    forecast: null,
  }));

  if (lastHist && prediction) {
    chartData.push({
      date: lastHist.date,
      historical: lastHist.value,
      forecast: lastHist.value,
    });
    chartData.push({
      date: prediction.date,
      historical: null,
      forecast: prediction.predicted_ndvi,
    });
  }

  return (
    <div className="glass rounded-3xl border border-white/10 p-6 h-[380px]">
      <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-4">
        NDVI Forecast
      </h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis domain={[-0.1, 1]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
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
          <Line
            type="monotone"
            dataKey="historical"
            name="Historical NDVI"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            name="Predicted NDVI"
            stroke="#34d399"
            strokeWidth={2.5}
            strokeDasharray="8 6"
            dot={{ r: 4, fill: '#34d399' }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
