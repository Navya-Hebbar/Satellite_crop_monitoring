import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Droplets,
  Thermometer,
  TrendingUp,
  Activity,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { DASHBOARD_LOCATIONS } from '../data/locations';
import { rangeFromPreset, formatDateInput } from '../utils/dateRanges';
import TimeRangeFilter from '../components/forecast/TimeRangeFilter';
import NdviForecastChart from '../components/forecast/NdviForecastChart';
import RainfallChart from '../components/forecast/RainfallChart';
import TemperatureChart from '../components/forecast/TemperatureChart';

const API_BASE = 'http://localhost:3001';

function SummaryCard({ title, value, sub, icon: Icon, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-white/10 p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
          <p className={`text-2xl font-black mt-1 ${accent}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className="p-2 rounded-xl bg-white/5 border border-white/10">
          <Icon className={`w-5 h-5 ${accent}`} />
        </div>
      </div>
    </motion.div>
  );
}

export default function ForecastDashboard() {
  const [location, setLocation] = useState('Bangalore');
  const [preset, setPreset] = useState('12m');
  const [customStart, setCustomStart] = useState('2023-01-01');
  const [customEnd, setCustomEnd] = useState(formatDateInput(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { startDate, endDate } = useMemo(
    () => rangeFromPreset(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        location,
        startDate,
        endDate,
      });
      const res = await fetch(`${API_BASE}/api/dashboard-forecast?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Request failed');
      setData(json);
    } catch (err) {
      setData(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [location, startDate, endDate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const prediction = data?.prediction;
  const summary = data?.summary;

  const statusColor =
    prediction?.status === 'Improving'
      ? 'text-emerald-400'
      : prediction?.status === 'Declining'
        ? 'text-red-400'
        : 'text-amber-400';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-white tracking-tight">
          Crop NDVI <span className="text-emerald-400">Forecast Dashboard</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Historical satellite NDVI, rainfall, and temperature with Random Forest next-month NDVI
          prediction. Weather variables are observations only — not forecast.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 glass rounded-2xl border border-white/10 p-4 space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Location
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
          >
            {DASHBOARD_LOCATIONS.map((loc) => (
              <option key={loc.name} value={loc.name}>
                {loc.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="w-3 h-3" />
            Karnataka, India
          </div>
        </div>
        <div className="lg:col-span-3">
          <TimeRangeFilter
            preset={preset}
            onPresetChange={setPreset}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStart={setCustomStart}
            onCustomEnd={setCustomEnd}
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3 py-20 text-emerald-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading dashboard data &amp; ML forecast…</span>
        </div>
      )}

      {error && !loading && (
        <div className="glass rounded-2xl border border-red-500/30 p-6 flex gap-3 text-red-300">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div>
            <p className="font-semibold">Unable to load forecast</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-xs mt-2 text-slate-500">
              Ensure backend (port 3001) is running, forecast_dataset_extended.csv exists, and
              ml/best_crop_ndvi_model.pkl is trained.
            </p>
          </div>
        </div>
      )}

      {data && !loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <SummaryCard
              title="Current NDVI"
              value={summary?.current_ndvi?.toFixed(3) ?? '—'}
              icon={Activity}
              accent="text-emerald-400"
            />
            <SummaryCard
              title="Predicted NDVI"
              value={summary?.predicted_ndvi?.toFixed(3) ?? '—'}
              sub={prediction?.date ? `Month ${prediction.date}` : ''}
              icon={TrendingUp}
              accent="text-teal-400"
            />
            <SummaryCard
              title="Predicted Change"
              value={
                summary?.change_percent != null
                  ? `${summary.change_percent > 0 ? '+' : ''}${summary.change_percent}%`
                  : '—'
              }
              sub={prediction?.status}
              icon={TrendingUp}
              accent={statusColor}
            />
            <SummaryCard
              title="Avg Rainfall"
              value={summary?.average_rainfall != null ? `${summary.average_rainfall} mm` : '—'}
              sub="Historical only"
              icon={Droplets}
              accent="text-sky-400"
            />
            <SummaryCard
              title="Avg Temperature"
              value={
                summary?.average_temperature != null
                  ? `${summary.average_temperature} °C`
                  : '—'
              }
              sub="Historical only"
              icon={Thermometer}
              accent="text-amber-400"
            />
          </div>

          <NdviForecastChart
            ndviSeries={data.ndvi}
            prediction={data.prediction}
            forecastStart={data.forecast_start}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RainfallChart data={data.rainfall} />
            <TemperatureChart data={data.temperature} />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-3xl border border-white/10 p-6 space-y-4"
          >
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
              Insights
            </h3>
            <ul className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <li>{data.insights?.ndvi_trend}</li>
              <li>{data.insights?.predicted_movement}</li>
              <li>{data.insights?.rainfall_note}</li>
              <li>{data.insights?.temperature_note}</li>
              <li className="text-emerald-400/90 font-medium">{data.insights?.crop_health}</li>
            </ul>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">
              Model: {prediction?.model_used || 'RandomForestRegressor'} — predicts NDVI only
            </p>
          </motion.div>
        </>
      )}
    </div>
  );
}
