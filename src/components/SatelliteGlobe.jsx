import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, PerspectiveCamera, Trail } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

const SatelliteGlobe = () => {
  const globeRef = useRef();
  const atmosphereRef = useRef();
  const ringRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (globeRef.current) {
      globeRef.current.rotation.y = t * 0.1;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y = -t * 0.05;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.2;
    }
  });

  return (
    <group>
      <PerspectiveCamera makeDefault position={[0, 0, 5.5]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={2.5} color="#10b981" />
      <pointLight position={[-10, -10, -10]} intensity={1.5} color="#0ea5e9" />

      {/* Post Processing Effects */}
      <EffectComposer multisampling={4}>
        <Bloom 
          intensity={1.5} 
          luminanceThreshold={0.2} 
          luminanceSmoothing={0.9} 
          blendFunction={BlendFunction.SCREEN} 
        />
        <ChromaticAberration 
          offset={[0.002, 0.002]} 
          blendFunction={BlendFunction.NORMAL} 
        />
      </EffectComposer>

      <group>
        {/* Core Globe */}
        <mesh ref={globeRef}>
          <sphereGeometry args={[2, 64, 64]} />
          <meshStandardMaterial
            color="#064e3b"
            wireframe
            transparent
            opacity={0.4}
            emissive="#10b981"
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Inner Solid Globe */}
        <mesh>
          <sphereGeometry args={[1.9, 64, 64]} />
          <meshStandardMaterial
            color="#020617"
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Atmosphere/Clouds */}
        <mesh ref={atmosphereRef}>
          <sphereGeometry args={[2.2, 64, 64]} />
          <meshStandardMaterial
            color="#10b981"
            wireframe
            transparent
            opacity={0.1}
          />
        </mesh>

        {/* Orbital Ring */}
        <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[3, 0.01, 16, 100]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2} />
        </mesh>

        {/* Satellites */}
        {[0, 1, 2].map((i) => (
          <SatelliteMarker key={i} index={i} />
        ))}
      </group>
    </group>
  );
};

const SatelliteMarker = ({ index }) => {
  const satRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime() + (index * 10);
    const radius = 3;
    satRef.current.position.x = Math.cos(t * 0.5) * radius;
    satRef.current.position.z = Math.sin(t * 0.5) * radius;
    satRef.current.position.y = Math.sin(t * 0.3) * (radius / 2);
  });

  return (
    <Trail
      width={1.5}
      length={15}
      color={new THREE.Color(2, 10, 2)}
      attenuation={(t) => t * t}
    >
      <mesh ref={satRef}>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={5} />
        <pointLight intensity={3} distance={2} color="#fbbf24" />
      </mesh>
    </Trail>
  );
};

export default SatelliteGlobe;