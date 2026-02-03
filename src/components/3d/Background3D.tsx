import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

// Rotating geometric artifact
function Artifact({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
      <group position={position} ref={meshRef}>
        {/* Wireframe Icosahedron */}
        <mesh>
          <icosahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#7000FF" wireframe />
        </mesh>
        {/* Inner Core */}
        <mesh>
          <icosahedronGeometry args={[0.5, 0]} />
          <meshBasicMaterial color="#00F0FF" />
        </mesh>
      </group>
    </Float>
  );
}

// Camera Movement Component
function MovingSpace() {
  const { camera } = useThree();

  useFrame((state) => {
    // Gentle drift effect simulating space travel
    const time = state.clock.getElapsedTime();
    // Move forward slightly
    camera.position.z = 10 + Math.sin(time * 0.1) * 2;
    // Gentle rotation
    camera.rotation.z = Math.sin(time * 0.05) * 0.2;
  });
  return null;
}

// Moving Starfield (Rotates the universe)
function MovingStars() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05; // Continual rotation
    }
  })
  return (
    <group ref={groupRef}>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={2} />
    </group>
  )
}

const Background3D = () => {
  return (
    <div className="fixed inset-0 -z-10 bg-background">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <fog attach="fog" args={['#050505', 5, 20]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#7000FF" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00F0FF" />

        <MovingSpace />
        <MovingStars />

        {/* Floating Cyber Artifacts */}
        <Artifact position={[-4, 2, -5]} />
        <Artifact position={[4, -2, -6]} />
        <Artifact position={[0, 3, -8]} />

        {/* Not using the grid for now as it can clash with content, sticking to deep space void + artifacts */}
      </Canvas>
    </div>
  );
};

export default Background3D;
