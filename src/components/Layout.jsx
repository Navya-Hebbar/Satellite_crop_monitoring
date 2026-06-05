import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import DataParticles from './DataParticles';

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-transparent relative">
      {/* Background glow effects are handled globally in index.css now, but we can keep these as ambient lighting */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full -z-10 pointer-events-none" />
      
      {/* Global 3D Particle Background */}
      <div className="fixed inset-0 -z-20 opacity-40 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 50], fov: 75 }}>
          <Suspense fallback={null}>
            <DataParticles count={600} />
          </Suspense>
        </Canvas>
      </div>
      
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;