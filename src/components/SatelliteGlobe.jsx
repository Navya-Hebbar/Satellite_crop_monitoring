import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, PerspectiveCamera } from '@react-three/drei';
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
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#10b981" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0ea5e9" />

      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
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
      </Float>
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
    <mesh ref={satRef}>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={5} />
      <pointLight intensity={2} distance={1} color="#fbbf24" />
    </mesh>
  );
};

export default SatelliteGlobe;
