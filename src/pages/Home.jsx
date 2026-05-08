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
        <section className="py-32 px-4 max-w-7xl mx-auto">
          <div className="glass rounded-[3rem] overflow-hidden border border-white/10 relative min-h-[600px] flex items-center">
            <ScannerHUD />
            
            <div className="absolute inset-0 z-0">
              <Canvas>
                <Suspense fallback={null}>
                  <SatelliteGlobe />
                </Suspense>
              </Canvas>
            </div>

            <div className="relative z-10 grid md:grid-cols-2 gap-12 p-12 items-center pointer-events-none">
              <div className="pointer-events-auto">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tighter">
                    Global Insights, <br />
                    <span className="text-emerald-400">Local Impact.</span>
                  </h2>
                  <div className="space-y-6">
                    {[
                      { title: 'Full Spectrum Analysis', desc: 'Multi-band processing for early disease detection.' },
                      { title: 'Sub-meter Resolution', desc: 'Precision tracking down to the leaf level.' },
                      { title: 'AI-Powered Forecasting', desc: 'Predictive yield modeling using historical trends.' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start space-x-4">
                        <div className="mt-1 w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">{item.title}</h4>
                          <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
              
              <div className="relative hidden md:block">
                {/* Information cards floating in 3D space */}
                <motion.div 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-20 right-0 p-6 glass rounded-2xl border border-emerald-500/30 backdrop-blur-2xl"
                >
                  <div className="text-xs font-mono text-emerald-400 mb-2 tracking-widest uppercase">System Health</div>
                  <div className="text-2xl font-black text-white">NOMINAL</div>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 20, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-20 left-0 p-6 glass rounded-2xl border border-teal-500/30 backdrop-blur-2xl"
                >
                  <div className="text-xs font-mono text-teal-400 mb-2 tracking-widest uppercase">Coverage</div>
                  <div className="text-2xl font-black text-white">1.2B Hectares</div>
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
