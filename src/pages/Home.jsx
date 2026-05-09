import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Map as MapIcon, Upload, Info, Satellite, Zap } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import SatelliteGlobe from '../components/SatelliteGlobe';
import DataParticles from '../components/DataParticles';
import ScannerHUD from '../components/ScannerHUD';

const Home = () => {
  const features = [
    { name: 'Analytics Dashboard', icon: BarChart3, path: '/dashboard', desc: 'Real-time NDVI trends and data analytics.' },
    { name: 'Map Visualization', icon: MapIcon, path: '/map', desc: 'Satellite imagery and spatial NDVI mapping.' },
    { name: 'Data Management', icon: Upload, path: '/upload', desc: 'Upload and process custom CSV datasets.' },
    { name: 'Scientific Method', icon: Info, path: '/about', desc: 'Learn about our methodology and NDVI science.' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617]">
      {/* Background 3D Particles */}
      <div className="fixed inset-0 z-0 opacity-40">
        <Canvas camera={{ position: [0, 0, 50], fov: 75 }}>
          <Suspense fallback={null}>
            <DataParticles count={500} />
          </Suspense>
        </Canvas>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                <Zap className="w-4 h-4 mr-2 animate-pulse" />
                Next-Gen Precision Agriculture
              </div>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 text-white leading-tight">
                MONITOR <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
                  EVERY PIXEL
                </span>
              </h1>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
                Harnessing high-resolution satellite imagery to provide real-time crop health diagnostics and yield optimization.
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <Link
                  to="/dashboard"
                  className="px-10 py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black transition-all duration-300 transform hover:scale-105 flex items-center shadow-[0_0_40px_rgba(16,185,129,0.3)] group"
                >
                  Enter Dashboard
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Link>
                <Link
                  to="/map"
                  className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold transition-all duration-300 flex items-center backdrop-blur-xl"
                >
                  Live Satellite View
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Floating cards decoration */}
          <div className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Link
                  to={feature.path}
                  className="block p-8 glass rounded-[2rem] glow-card hover:translate-y-[-10px] border border-white/5 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{feature.name}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 3D Visual Experience Section */}
        <section className="py-20 px-4 max-w-7xl mx-auto">
          <div className="glass rounded-[3rem] overflow-hidden border border-white/10 relative min-h-[850px] flex flex-col justify-center shadow-2xl transition-all duration-500">
            <ScannerHUD />
            
            <div className="absolute inset-0 z-0">
              <Canvas camera={{ position: [0, 0, 4.5] }}>
                <Suspense fallback={null}>
                  <SatelliteGlobe />
                </Suspense>
              </Canvas>
            </div>

            <div className="relative z-20 grid lg:grid-cols-12 gap-12 p-8 md:p-16 lg:p-24 pointer-events-none w-full">
              <div className="pointer-events-auto lg:col-span-7">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-5xl md:text-6xl lg:text-8xl font-black text-white mb-12 tracking-tighter leading-[0.9]">
                    Global <br />
                    <span className="text-emerald-400">Insights,</span> <br />
                    <span className="text-white/50">Local Impact.</span>
                  </h2>
                  <div className="space-y-10 max-w-xl">
                    {[
                      { title: 'Full Spectrum Analysis', desc: 'Multi-band processing for early disease detection and soil moisture profiling.' },
                      { title: 'Sub-meter Resolution', desc: 'Precision tracking down to the leaf level with high-frequency revisit cycles.' },
                      { title: 'AI-Powered Forecasting', desc: 'Predictive yield modeling using historical trends and real-time climatic data.' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start space-x-6 group">
                        <div className="mt-1 w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-all duration-300">
                          <Zap className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-white mb-2 tracking-tight">{item.title}</h4>
                          <p className="text-slate-400 text-lg leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
              
              <div className="relative hidden lg:block lg:col-span-5 h-full min-h-[500px]">
                {/* Floating Status Cards - Repositioned to far right to avoid any overlap */}
                <motion.div 
                  animate={{ y: [0, -40, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-10 right-0 p-8 glass rounded-3xl border border-emerald-500/20 backdrop-blur-3xl shadow-2xl min-w-[240px]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[10px] font-mono text-emerald-400 tracking-[0.4em] uppercase">Status</div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                  <div className="text-4xl font-black text-white tracking-tighter">OPERATIONAL</div>
                  <div className="mt-4 h-1 w-full bg-emerald-500/10 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: ['0%', '100%'] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    />
                  </div>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 40, 0] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-10 right-10 p-8 glass rounded-3xl border border-teal-500/20 backdrop-blur-3xl shadow-2xl min-w-[240px]"
                >
                  <div className="text-[10px] font-mono text-teal-400 mb-4 tracking-[0.4em] uppercase">Global Feed</div>
                  <div className="text-4xl font-black text-white tracking-tighter">1.2B+ <span className="text-xs text-slate-500">HECTARES</span></div>
                  <div className="text-[10px] text-slate-500 mt-2 font-mono">SCANNING COMPLETED: 94.2%</div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
