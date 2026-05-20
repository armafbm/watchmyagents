import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Float } from "@react-three/drei";
import type { Group } from "three";

function Model() {
  const ref = useRef<Group>(null);
  const { scene } = useGLTF("/wma-logo.glb");
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.35;
  });
  return <primitive ref={ref} object={scene} scale={1.6} />;
}

useGLTF.preload("/wma-logo.glb");

export function Logo3D({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute inset-8 rounded-full border border-primary/30 animate-pulse-ring" />
      <div
        className="absolute inset-8 rounded-full border border-accent/30 animate-pulse-ring"
        style={{ animationDelay: "1.2s" }}
      />
      {mounted && (
        <Canvas
          camera={{ position: [0, 0, 5], fov: 38 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          className="!absolute inset-0"
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1.4} color="#7fd4ff" />
          <directionalLight position={[-5, -3, -2]} intensity={0.8} color="#8a6cff" />
          <Suspense fallback={null}>
            <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.8}>
              <Model />
            </Float>
            <Environment preset="city" />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
