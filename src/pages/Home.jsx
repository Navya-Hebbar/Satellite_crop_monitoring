import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Map as MapIcon, Upload, Info, Satellite } from 'lucide-react';

const Home = () => {
  const features = [
    { name: 'Analytics Dashboard', icon: BarChart3, path: '/dashboard', desc: 'Real-time NDVI trends and data analytics.' },
    { name: 'Map Visualization', icon: MapIcon, path: '/map', desc: 'Satellite imagery and spatial NDVI mapping.' },
    { name: 'Data Management', icon: Upload, path: '/upload', desc: 'Upload and process custom CSV datasets.' },
    { name: 'Scientific Method', icon: Info, path: '/about', desc: 'Learn about our methodology and NDVI science.' },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
              <Satellite className="w-4 h-4 mr-2" />
              Satellite Intelligence for Agriculture
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              Satellite-Based <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
                Crop Monitoring System
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-10">
              This system monitors vegetation health using satellite NDVI data, providing actionable insights for precision agriculture and sustainable crop management.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/dashboard"
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/map"
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold transition-all duration-300 flex items-center"
              >
                View Map
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating cards decoration */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Link
                to={feature.path}
                className="block p-6 glass rounded-2xl glow-card hover:translate-y-[-5px]"
              >
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20">
                  <feature.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.name}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Visual Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="glass rounded-[2.5rem] overflow-hidden border border-white/10 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />
          <div className="relative z-10 grid md:grid-cols-2 gap-12 p-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Revolutionizing Farm Management</h2>
              <ul className="space-y-4">
                {[
                  'Real-time vegetation health index tracking',
                  'Historical data analysis for seasonal trends',
                  'Geospatial visualization of crop stress',
                  'Automated insights and health classification'
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3 border border-emerald-500/40">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-video bg-slate-900 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden group">
                {/* Mockup visual */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-40 group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="p-4 bg-black/40 backdrop-blur-md rounded-full border border-white/20 mb-4">
                    <Satellite className="w-12 h-12 text-emerald-400 animate-pulse" />
                  </div>
                  <span className="text-sm font-mono text-emerald-400 uppercase tracking-widest">Satellite Active</span>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 p-4 glass rounded-xl border border-emerald-500/30 animate-bounce">
                <span className="text-emerald-400 font-bold">98% Accuracy</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
