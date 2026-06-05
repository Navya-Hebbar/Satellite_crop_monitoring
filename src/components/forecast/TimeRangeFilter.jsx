import { TIME_PRESETS } from '../../utils/dateRanges';

export default function TimeRangeFilter({
  preset,
  onPresetChange,
  customStart,
  customEnd,
  onCustomStart,
  onCustomEnd,
}) {
  return (
    <div className="glass rounded-2xl border border-white/10 p-4 space-y-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Time Range</p>
      <div className="flex flex-wrap gap-2">
        {TIME_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPresetChange(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              preset === p.id
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:border-emerald-500/30'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-xs text-slate-400">
            From
            <input
              type="date"
              value={customStart}
              onChange={(e) => onCustomStart(e.target.value)}
              className="ml-2 bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-white text-sm"
            />
          </label>
          <label className="text-xs text-slate-400">
            To
            <input
              type="date"
              value={customEnd}
              onChange={(e) => onCustomEnd(e.target.value)}
              className="ml-2 bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-white text-sm"
            />
          </label>
        </div>
      )}
    </div>
  );
}
