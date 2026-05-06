import { motion } from 'framer-motion';
import { Info, Cpu, Database, TrendingUp, Layers, Satellite } from 'lucide-react';

const About = () => {
  const steps = [
    {
      title: 'Satellite Data Collection',
      icon: Satellite,
      desc: 'Retrieving multi-spectral imagery from Sentinel-2 and Landsat missions via Google Earth Engine.',
    },
    {
      title: 'NDVI Calculation',
      icon: Cpu,
      desc: 'Using Red and Near-Infrared bands to calculate the Normalized Difference Vegetation Index.',
    },
    {
      title: 'Preprocessing & Filtering',
      icon: Database,
      desc: 'Cloud masking, atmospheric correction, and time-series smoothing for accurate analysis.',
    },
    {
      title: 'Time-Series Analysis',
      icon: TrendingUp,
      desc: 'Identifying seasonal patterns and growth anomalies through historical data comparison.',
    },
    {
      title: 'Insights & Visualization',
      icon: Layers,
      desc: 'Generating spatial maps and dashboard visualizations for actionable farm management.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-20"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Scientific Methodology</h1>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto">
          Our system leverages cutting-edge remote sensing technology and data science to provide a comprehensive view of crop health.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-32">
        <div className="space-y-8">
          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-start space-x-4"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                <step.icon className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{step.title}</h3>
                <p className="text-slate-400">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="relative">
          <div className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Info className="w-48 h-48 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-6">Why NDVI Matters?</h2>
            <div className="space-y-4 text-slate-300">
              <p>
                The Normalized Difference Vegetation Index (NDVI) is a standardized index allowing you to generate an image displaying greenness (relative biomass).
              </p>
              <p>
                This index takes advantage of the contrast of the characteristics of two bands from a multispectral raster dataset—the chlorophyll pigment absorptions in the red band and the high reflectivity of plant materials in the near-infrared (NIR) band.
              </p>
              <div className="p-4 bg-white/5 rounded-xl border border-emerald-500/30 font-mono text-emerald-400">
                NDVI = (NIR - RED) / (NIR + RED)
              </div>
              <p>
                Healthy vegetation (chlorophyll-rich) reflects more near-infrared light and less visible light compared to other surfaces.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
