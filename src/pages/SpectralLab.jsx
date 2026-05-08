import { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, OrbitControls, Text } from '@react-three/drei';
import { Beaker, Zap, Info, RefreshCw, BarChart } from 'lucide-react';

const SpectralLab = () => {
  const [red, setRed] = useState(0.15);
  const [nir, setNir] = useState(0.75);

  const ndvi = (nir - red) / (nir + red);
  const healthStatus = ndvi > 0.6 ? 'PROLIFIC' : ndvi > 0.3 ? 'MODERATE' : 'STRESSED';
  const healthColor = ndvi > 0.6 ? 'text-emerald-400' : ndvi > 0.3 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white tracking-tighter flex items-center">
          <Beaker className="w-10 h-10 mr-4 text-emerald-400" />
          SPECTRAL ANALYSIS LAB
        </h1>
        <p className="text-slate-400 font-mono text-sm mt-2">Simulate multispectral data and calculate vegetation indices.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Simulator Controls */}
        <div className="space-y-8">
          <div className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <RefreshCw className="w-20 h-20 text-emerald-400 animate-spin-slow" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-8 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-emerald-400" />
              Band Modulation
            </h3>

            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-red-500 uppercase tracking-widest">Red Reflectance (B4)</label>
                  <span className="text-lg font-mono text-white font-bold">{red.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" value={red} 
                  onChange={(e) => setRed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-red-900/30 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-teal-400 uppercase tracking-widest">NIR Reflectance (B8)</label>
                  <span className="text-lg font-mono text-white font-bold">{nir.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" value={nir} 
                  onChange={(e) => setNir(parseFloat(e.target.value))}
                  className="w-full h-2 bg-teal-900/30 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
              </div>
            </div>

            <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-2xl">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 text-center">NDVI Formula Output</div>
              <div className="flex justify-center items-center space-x-4">
                <div className="text-4xl font-black text-white">{ndvi.toFixed(3)}</div>
                <div className={`px-3 py-1 rounded-md text-[10px] font-black border ${healthColor}`}>
                  {healthStatus}
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-white/10">
            <h4 className="text-sm font-bold text-white mb-4 flex items-center">
              <Info className="w-4 h-4 mr-2 text-emerald-400" />
              The Science
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Healthy vegetation absorbs most of the visible light (Red) and reflects a large portion of the Near-Infrared (NIR) light. 
              Unhealthy plants reflect more Red and less NIR.
            </p>
          </div>
        </div>

        {/* 3D Visualizer */}
        <div className="lg:col-span-2 relative min-h-[500px] glass rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
          <div className="absolute top-6 left-6 z-10 flex space-x-4">
             <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
               <div className="w-2 h-2 bg-red-500 rounded-full" />
               <span className="text-[10px] font-mono text-white">B4: RED</span>
             </div>
             <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
               <div className="w-2 h-2 bg-teal-400 rounded-full" />
               <span className="text-[10px] font-mono text-white">B8: NIR</span>
             </div>
          </div>

          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <Suspense fallback={null}>
              <Scene red={red} nir={nir} ndvi={ndvi} />
              <OrbitControls enableZoom={false} autoRotate />
            </Suspense>
          </Canvas>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-3/4 text-center">
            <motion.div
              key={healthStatus}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
            >
              <h2 className={`text-2xl font-black mb-1 ${healthColor}`}>{healthStatus} VEGETATION</h2>
              <p className="text-xs text-slate-300 font-mono uppercase tracking-widest">Simulated Spectral Signature Detected</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Scene = ({ red, nir, ndvi }) => {
  return (
    <group>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#fff" />
      
      {/* Light Beams */}
      <Beam position={[-2, 1, 0]} color="#ef4444" intensity={red} label="RED" />
      <Beam position={[2, 1, 0]} color="#2dd4bf" intensity={nir} label="NIR" />

      {/* Central "Plant" Proxy */}
      <Float speed={5} rotationIntensity={2} floatIntensity={2}>
        <Sphere args={[1, 64, 64]}>
          <MeshDistortMaterial 
            color={ndvi > 0.6 ? "#10b981" : ndvi > 0.3 ? "#eab308" : "#ef4444"}
            speed={2} 
            distort={0.4} 
            radius={1}
            emissive={ndvi > 0.6 ? "#10b981" : "#000"}
            emissiveIntensity={0.5}
          />
        </Sphere>
      </Float>
    </group>
  );
};

const Beam = ({ position, color, intensity, label }) => {
  return (
    <group position={position}>
       <mesh>
         <cylinderGeometry args={[0.05, 0.5, 4, 32]} />
         <meshStandardMaterial 
            color={color} 
            transparent 
            opacity={0.2 + (intensity * 0.5)} 
            emissive={color}
            emissiveIntensity={intensity * 2}
          />
       </mesh>
    </group>
  );
};

export default SpectralLab;
