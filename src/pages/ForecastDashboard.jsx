import { useState, useEffect, useCallback, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { motion } from 'framer-motion';
import {
  MapPin,
  Droplets,
  Thermometer,
  TrendingUp,
  Activity,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine } from 'recharts';
import { DASHBOARD_LOCATIONS } from '../data/locations';
import { rangeFromPreset, formatDateInput } from '../utils/dateRanges';
import TimeRangeFilter from '../components/forecast/TimeRangeFilter';
import NdviForecastChart from '../components/forecast/NdviForecastChart';
import RainfallChart from '../components/forecast/RainfallChart';
import TemperatureChart from '../components/forecast/TemperatureChart';
import NdviHistogram from '../components/forecast/NdviHistogram';
import NdviRainfallScatter from '../components/forecast/NdviRainfallScatter';
import RegionNdviComparisonChart from '../components/forecast/RegionNdviComparisonChart';
import RegionNdviSummaryBar from '../components/forecast/RegionNdviSummaryBar';
import ForecastMediaPanel from '../components/forecast/ForecastMediaPanel';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

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
  const [selectedRegions, setSelectedRegions] = useState(['Bangalore']);
  const [preset, setPreset] = useState('12m');
  const [customStart, setCustomStart] = useState('2023-01-01');
  const [customEnd, setCustomEnd] = useState(formatDateInput(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [printImages, setPrintImages] = useState({ comparison: null });

  const { startDate, endDate } = useMemo(
    () => rangeFromPreset(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  const addRegion = () => {
    const next = DASHBOARD_LOCATIONS.find((loc) => !selectedRegions.includes(loc.name));
    if (next) {
      setSelectedRegions((prev) => [...prev, next.name]);
    }
  };

  const updateRegion = (index, value) => {
    setSelectedRegions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const removeRegion = (index) => {
    setSelectedRegions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await Promise.all(
        selectedRegions.map(async (region) => {
          const params = new URLSearchParams({
            location: region,
            startDate,
            endDate,
          });
          const res = await fetch(`${API_BASE}/api/dashboard-forecast?${params}`);
          const json = await res.json();
          if (!res.ok) {
            throw new Error(`${region}: ${json.error || 'Request failed'}`);
          }
          return { region, ...json };
        })
      );
      setData({ regions: result });
    } catch (err) {
      setData(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedRegions, startDate, endDate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const generateAIReport = async (regionsData) => {
    setIsGeneratingReport(true);
    setAiReport(null);
    try {
      const response = await fetch(`${API_BASE}/api/generate-forecast-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regionsData })
      });
      const result = await response.json();
      if (result.error) {
        setAiReport(`Error: ${result.error}`);
      } else {
        setAiReport(result.report);
      }
    } catch (err) {
      setAiReport('Failed to connect to AI service.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  useEffect(() => {
    if (data && data.regions && data.regions.length > 0) {
      generateAIReport(data.regions);
    }
  }, [data]);

  const primaryRegion = data?.regions?.[0];
  const prediction = primaryRegion?.prediction;
  const summary = primaryRegion?.summary;
  const regionForecasts = data?.regions || [];

  const getMultiRegionChartData = useCallback(() => {
    if (!regionForecasts || regionForecasts.length === 0) return [];

    let allDates = new Set();
    regionForecasts.forEach(rf => {
      if (rf.ndvi) rf.ndvi.forEach(d => allDates.add(d.date));
      if (rf.prediction) allDates.add(rf.prediction.date);
    });

    const sortedDates = Array.from(allDates).sort();

    const chartData = sortedDates.map(date => {
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
        const point = chartData.find(d => d.date === lastHistDate);
        if (point && point[`${rf.region}_hist`] !== undefined) {
          point[`${rf.region}_pred`] = point[`${rf.region}_hist`];
        }
      }
    });

    return chartData;
  }, [regionForecasts]);

  const exportToPDF = async () => {
    const compNode = document.getElementById('render-comp-chart');
    if (compNode) {
      try {
        const compCanvas = await html2canvas(compNode, { scale: 2, backgroundColor: '#ffffff' });
        setPrintImages({ comparison: compCanvas.toDataURL('image/png') });
        setTimeout(() => window.print(), 500);
      } catch (err) {
        console.error('Print capture failed', err);
        window.print();
      }
    } else {
      window.print();
    }
  };

  const statusColor =
    prediction?.status === 'Improving'
      ? 'text-emerald-400'
      : prediction?.status === 'Declining'
        ? 'text-red-400'
        : 'text-amber-400';

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 print:hidden">
        <header className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tight">
              Crop NDVI <span className="text-emerald-400">Forecast Dashboard</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Historical satellite NDVI, rainfall, and temperature with Random Forest next-month NDVI
              prediction. Weather variables are observations only — not forecast.
            </p>
          </div>
          <button onClick={exportToPDF} className="flex items-center space-x-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl text-purple-400 text-sm font-bold transition-all mt-2 print:hidden">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 glass rounded-2xl border border-white/10 p-4 space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Compare Regions
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Choose up to 3 regions to compare NDVI, rainfall, and prediction metrics.
              </p>
            </div>
            <div className="space-y-3">
              {selectedRegions.map((region, index) => (
                <div key={region} className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Region {index + 1}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={region}
                      onChange={(e) => updateRegion(index, e.target.value)}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                    >
                      {DASHBOARD_LOCATIONS.map((loc) => (
                        <option
                          key={loc.name}
                          value={loc.name}
                          disabled={selectedRegions.includes(loc.name) && loc.name !== region}
                        >
                          {loc.name}
                        </option>
                      ))}
                    </select>
                    {selectedRegions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRegion(index)}
                        className="px-3 py-2 rounded-xl bg-red-500/15 text-red-300 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={selectedRegions.length >= 3}
              onClick={addRegion}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add Region
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="w-3 h-3" />
              Karnataka, India
            </div>
          </div>
          <div className="lg:col-span-3 space-y-4">
            <TimeRangeFilter
              preset={preset}
              onPresetChange={setPreset}
              customStart={customStart}
              customEnd={customEnd}
              onCustomStart={setCustomStart}
              onCustomEnd={setCustomEnd}
            />
            <ForecastMediaPanel />
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

            {regionForecasts.length > 1 && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <RegionNdviComparisonChart regionForecasts={regionForecasts} />
                <RegionNdviSummaryBar regionForecasts={regionForecasts} />
              </div>
            )}

            <NdviForecastChart
              regionForecasts={regionForecasts}
              forecastStart={primaryRegion?.forecast_start}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <NdviHistogram regionForecasts={regionForecasts} />
              <NdviRainfallScatter regionForecasts={regionForecasts} />
              <RainfallChart regionForecasts={regionForecasts} />
              <TemperatureChart regionForecasts={regionForecasts} />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-3xl border border-white/10 p-6 space-y-4"
            >
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                <span>AI Predictive Insights</span>
                {isGeneratingReport && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
              </h3>
              {isGeneratingReport ? (
                <p className="text-sm text-slate-400 italic">Generating multi-region predictive analysis...</p>
              ) : aiReport && typeof aiReport === 'object' ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Key Observations</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
                      {aiReport.key_observations?.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Predictive Insights</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-emerald-400/90 font-medium">
                      {aiReport.predictive_insights?.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Recommended Actions</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-amber-300/90">
                      {aiReport.recommended_actions?.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">{aiReport || 'No AI insights available.'}</p>
              )}
              <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-4">
                Model: {prediction?.model_used || 'RandomForestRegressor'} — Multi-Region Analysis via Gemini
              </p>
            </motion.div>
          </>
        )}
      </div>

      {/* --- FORMAL PRINT REPORT VIEW --- */}
      {data && !loading && (
        <>
          <div className="hidden print:block font-serif text-black bg-white min-h-screen relative pt-8 pb-16 px-4">

            {/* Repeating Footer */}
            <div className="fixed bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-400 border-t border-gray-200 pt-3 pb-4 bg-white font-sans z-50">
              <span className="font-semibold">SatCrop Intelligence Platform</span>
              <span>Forecast Generated: {new Date().toLocaleDateString()}</span>
            </div>

            {/* Report Header */}
            <div className="border-b-2 border-black pb-6 mb-8 text-center mt-10">
              <h1 className="text-3xl font-bold uppercase tracking-widest text-black">SatCrop Predictive Analysis</h1>
              <p className="mt-2 text-gray-600 font-sans text-sm">Next-Month NDVI Forecasting & Environmental Indicators</p>
            </div>

            {/* Mission Parameters */}
            <div className="mb-10 font-sans">
              <div className="grid grid-cols-2 gap-4 border border-gray-300 p-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Analysis Period</p>
                  <p className="text-sm font-semibold">{startDate} to {endDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Target Regions</p>
                  <p className="text-sm font-semibold">{selectedRegions.join(', ')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Forecast Model</p>
                  <p className="text-sm font-semibold">{prediction?.model_used || 'RandomForestRegressor'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Primary Location</p>
                  <p className="text-sm font-semibold text-emerald-700">{selectedRegions[0]}</p>
                </div>
              </div>
            </div>

            {/* Executive Summary & AI Report */}
            <div className="mb-12">
              <h2 className="text-xl font-bold mb-4 border-b border-gray-300 pb-1 text-black">1. Regional Forecast Comparison</h2>
              <div className="mb-6 font-sans">
                <table className="w-full text-left border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 text-xs uppercase tracking-wider">
                      <th className="border border-gray-300 p-3">Region</th>
                      <th className="border border-gray-300 p-3">Current NDVI</th>
                      <th className="border border-gray-300 p-3">Predicted NDVI</th>
                      <th className="border border-gray-300 p-3">Change %</th>
                      <th className="border border-gray-300 p-3">Avg Rainfall</th>
                      <th className="border border-gray-300 p-3">Avg Temp</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {regionForecasts.map((rf, idx) => (
                      <tr key={rf.region} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 p-3 font-bold">{rf.region}</td>
                        <td className="border border-gray-300 p-3">{rf.summary?.current_ndvi?.toFixed(3) ?? '—'}</td>
                        <td className="border border-gray-300 p-3 font-bold text-indigo-900">{rf.summary?.predicted_ndvi?.toFixed(3) ?? '—'}</td>
                        <td className={`border border-gray-300 p-3 font-bold ${rf.prediction?.status === 'Improving' ? 'text-emerald-600' : rf.prediction?.status === 'Declining' ? 'text-red-600' : 'text-amber-600'}`}>
                          {rf.summary?.change_percent != null ? `${rf.summary.change_percent > 0 ? '+' : ''}${rf.summary.change_percent}%` : '—'}
                        </td>
                        <td className="border border-gray-300 p-3">{rf.summary?.average_rainfall != null ? `${rf.summary.average_rainfall} mm` : '—'}</td>
                        <td className="border border-gray-300 p-3">{rf.summary?.average_temperature != null ? `${rf.summary.average_temperature} °C` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border border-gray-300 p-5 bg-blue-50/30 text-sm font-sans leading-relaxed break-inside-avoid">
                <h3 className="font-bold text-indigo-900 mb-2 border-b border-indigo-100 pb-2">AI Predictive Insights (Multi-Region)</h3>
                {isGeneratingReport ? (
                  <p className="italic text-gray-500">Generating AI report...</p>
                ) : aiReport && typeof aiReport === 'object' ? (
                  <div className="space-y-4">
                    <div>
                      <p className="font-bold text-indigo-900 mb-1 border-b border-indigo-200 inline-block">Key Observations:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-800">{aiReport.key_observations?.map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </div>
                    <div>
                      <p className="font-bold text-indigo-900 mb-1 border-b border-indigo-200 inline-block">Predictive Insights:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-800">{aiReport.predictive_insights?.map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </div>
                    <div>
                      <p className="font-bold text-indigo-900 mb-1 border-b border-indigo-200 inline-block">Recommended Actions:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-800">{aiReport.recommended_actions?.map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </div>
                  </div>
                ) : (
                  <p className="italic text-gray-500">No AI insights generated yet. View dashboard UI first.</p>
                )}
              </div>
            </div>

            {/* Charts Section */}
            <div className="mb-12 break-inside-avoid">
              <h2 className="text-xl font-bold mb-6 border-b border-gray-300 pb-1 text-black">2. Machine Learning NDVI Projection</h2>
              <div className="mx-auto" style={{ width: '750px', height: '350px' }}>
                {printImages.comparison ? (
                  <img src={printImages.comparison} alt="Projection Chart" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <LineChart data={getMultiRegionChartData()} width={750} height={350} margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" vertical={false} />
                    <XAxis dataKey="date" stroke="#000" fontSize={11} tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })} />
                    <YAxis stroke="#000" fontSize={11} domain={[0.2, 1]} tickFormatter={(val) => Number(val).toFixed(2)} width={35} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }} />
                    {primaryRegion?.forecast_start && (
                      <ReferenceLine x={primaryRegion.forecast_start} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Forecast Start', fill: '#000', fontSize: 11 }} />
                    )}
                    {selectedRegions.map((region, idx) => (
                      <Line key={`${region}-hist`} type="monotone" dataKey={`${region}_hist`} name={`${region} (Historical)`} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={false} isAnimationActive={false} />
                    ))}
                    {selectedRegions.map((region, idx) => (
                      <Line key={`${region}-pred`} type="monotone" dataKey={`${region}_pred`} name={`${region} (Predicted)`} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} strokeDasharray="8 6" dot={{ r: 4, fill: COLORS[idx % COLORS.length] }} connectNulls isAnimationActive={false} />
                    ))}
                  </LineChart>
                )}
              </div>
            </div>

            {/* Supplementary Data Visualizations */}
            <div className="mb-12 break-inside-avoid">
              <h2 className="text-xl font-bold mb-6 border-b border-gray-300 pb-1 text-black">3. Environmental & Distribution Analysis</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-900 rounded-2xl p-2 print:bg-slate-900 print:text-white" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <NdviHistogram regionForecasts={regionForecasts} printWidth={320} printHeight={220} />
                </div>
                <div className="bg-slate-900 rounded-2xl p-2 print:bg-slate-900 print:text-white" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <NdviRainfallScatter regionForecasts={regionForecasts} printWidth={320} printHeight={220} />
                </div>
                <div className="bg-slate-900 rounded-2xl p-2 print:bg-slate-900 print:text-white" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <RainfallChart regionForecasts={regionForecasts} printWidth={320} printHeight={220} />
                </div>
                <div className="bg-slate-900 rounded-2xl p-2 print:bg-slate-900 print:text-white" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <TemperatureChart regionForecasts={regionForecasts} printWidth={320} printHeight={220} />
                </div>
              </div>
            </div>
          </div>

          {/* Off-screen Render Targets for Image Capture */}
          <div className="fixed top-0 left-[-9999px] opacity-0 pointer-events-none bg-white">
            <div id="render-comp-chart" style={{ width: '750px', height: '350px', padding: '10px' }}>
              <LineChart data={getMultiRegionChartData()} width={750} height={350} margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" vertical={false} />
                <XAxis dataKey="date" stroke="#000" fontSize={11} tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })} />
                <YAxis stroke="#000" fontSize={11} domain={[0.2, 1]} tickFormatter={(val) => Number(val).toFixed(2)} width={35} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }} />
                {primaryRegion?.forecast_start && (
                  <ReferenceLine x={primaryRegion.forecast_start} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Forecast Start', fill: '#000', fontSize: 11 }} />
                )}
                {selectedRegions.map((region, idx) => (
                  <Line key={`render-${region}-hist`} type="monotone" dataKey={`${region}_hist`} name={`${region} (Historical)`} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={false} isAnimationActive={false} />
                ))}
                {selectedRegions.map((region, idx) => (
                  <Line key={`render-${region}-pred`} type="monotone" dataKey={`${region}_pred`} name={`${region} (Predicted)`} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} strokeDasharray="8 6" dot={{ r: 4, fill: COLORS[idx % COLORS.length] }} connectNulls isAnimationActive={false} />
                ))}
              </LineChart>
            </div>
          </div>
        </>
      )}
    </>
  );
}
