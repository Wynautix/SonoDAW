import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useStore } from '../store/useStore';

const WaveformLine = ({ index, total, trackId, active }: { index: number, total: number, trackId: string, active: boolean }) => {
  const lineRef = useRef<THREE.Line>(null);
  const zPosition = (index - total/2) * 5; // Spread across Z axis
  const pointsCount = 64;
  
  const positions = useMemo(() => new Float32Array(pointsCount * 3), []);
  
  useFrame(() => {
    if (!lineRef.current) return;
    const synth = (window as any).__SYNTHS__?.[trackId];
    let values;
    if (synth && synth.waveform) {
      values = synth.waveform.getValue();
    }
    
    const positionsAttr = lineRef.current.geometry.attributes.position;
    for (let i = 0; i < pointsCount; i++) {
       const x = (i / pointsCount) * 60 - 30; // Spread across X (-30 to 30)
       const val = values ? (values[i] as number) : 0;
       
       // Dampen towards edges to create a nice spindle shape
       const edgeDampen = Math.sin((i / pointsCount) * Math.PI);
       const y = val * 8 * edgeDampen; // Amplitude
       
       positionsAttr.setXYZ(i, x, y + 1, zPosition);
    }
    positionsAttr.needsUpdate = true;
  });

  return (
    <line ref={lineRef as any}>
      <bufferGeometry>
         <bufferAttribute 
            attach="attributes-position"
            args={[positions, 3]}
         />
      </bufferGeometry>
      <lineBasicMaterial color={new THREE.Color().setHSL(index / total, 0.8, active ? 0.8 : 0.4)} transparent opacity={active ? 1 : 0.4} />
    </line>
  );
};

export const Visualization: React.FC = () => {
  const { project, csvData, activeTrackId } = useStore();
  
  return (
    <div className="visualization-container" style={{ height: '100%', width: '100%' }}>
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 15, 25]} fov={50} />
        <color attach="background" args={['#050508']} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#00f2ff" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#7000ff" />
        
        {project.tracks.map((track, i) => (
          <WaveformLine 
            key={track.id} 
            index={i} 
            total={project.tracks.length} 
            trackId={track.id}
            active={activeTrackId === track.id}
          />
        ))}

        <OrbitControls 
          enableZoom={true} 
          enablePan={false}
          autoRotate 
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2.1}
          makeDefault 
        />

        {/* Cyber Grid */}
        <gridHelper args={[60, 60, '#00f2ff', '#16161c']} position={[0, -4, 0]} />
        
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={2.0} radius={0.5} />
        </EffectComposer>

        {/* Fog for depth */}
        <fog attach="fog" args={['#050508', 10, 45]} />
      </Canvas>
    </div>
  );
};

