import { useState, useEffect } from 'react';

export default function ForecastMediaPanel() {
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    // Hide the initial YouTube loading flash by delaying visibility
    const timer = setTimeout(() => {
      setIsVideoReady(true);
    }, 2500); // 2.5 seconds gives YouTube enough time to buffer and start autoplaying
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="glass rounded-3xl border border-white/10 overflow-hidden">
      <div className="relative h-[280px] bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Invisible overlay to absolutely block any clicks or interaction reaching the iframe */}
        <div className="absolute inset-0 z-20 w-full h-full cursor-default"></div>
        
        <iframe
          src="https://www.youtube.com/embed/wwJ3kbwg754?autoplay=1&mute=1&controls=0&loop=1&playlist=wwJ3kbwg754&playsinline=1&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1"
          title="Crop Growth Simulation"
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250%] md:w-[150%] aspect-square max-w-none pointer-events-none select-none transition-opacity duration-1000 ${
            isVideoReady ? 'opacity-100' : 'opacity-0'
          }`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          tabIndex="-1"
        ></iframe>

        {/* Loading state while YouTube prepares the video behind the scenes */}
        {!isVideoReady && (
          <div className="absolute inset-0 bg-slate-950 z-10 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-6 pointer-events-none z-30">
          <div className="text-white space-y-2">
            <span className="inline-block text-[10px] uppercase tracking-[0.3em] text-emerald-300 bg-emerald-500/20 rounded-full px-3 py-1 backdrop-blur-sm">
              Growth Analytics
            </span>
            <h3 className="text-3xl font-black tracking-tight drop-shadow-md">Crop Growth Simulation</h3>
            <p className="text-sm text-slate-200/90 max-w-xl drop-shadow-sm">
              Watch seeds develop into thriving crops as the NDVI model predicts agricultural
              health and vitality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
