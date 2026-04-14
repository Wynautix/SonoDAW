import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, OrthographicCamera, Stars, Text, FlyControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { xrStore } from '../store/xrStore';
import { getColorFromScale, normalizeValue, getColorFromRules } from '../data/ColorScales';
import { FlowEngine } from '../data/FlowEngine';

const Points = ({ data, config, columnStats, currentRow }: any) => {
  const meshRef = useRef<THREE.Points>(null);
  // Static attributes calculation (only when data or config axes change)
  const { positions, colors, baseSizes, baseBrightness } = useMemo(() => {
    const pos = new Float32Array(data.length * 3);
    const col = new Float32Array(data.length * 3);
    const size = new Float32Array(data.length);
    const brightness = new Float32Array(data.length);

    const cAxis = config.colorAxis;
    const isCategorical = data.length > 0 && typeof data[0][cAxis] !== 'number';
    let categoricalMap: Map<any, number> = new Map();
    
    if (isCategorical) {
      const uniqueValues = Array.from(new Set(data.map((r: any) => r[cAxis]))).sort();
      uniqueValues.forEach((val, idx) => {
        categoricalMap.set(val, idx / Math.max(1, uniqueValues.length - 1));
      });
    }

    const getNormalized = (v: any, colName: string, useLog: boolean, invert: boolean) => {
      if (!colName) return 0.5;
      let val = typeof v === 'number' ? v : parseFloat(v) || 0;
      let min = columnStats[colName]?.min || 0;
      let max = columnStats[colName]?.max || 1;
      if (useLog && val > 0 && min > 0) {
        val = Math.log10(val);
        min = Math.log10(min);
        max = Math.log10(max);
      }
      let normalized = (min === max) ? 0.5 : (val - min) / (max - min);
      return invert ? 1 - normalized : normalized;
    };

    data.forEach((row: any, idx: number) => {
      pos[idx * 3] = getNormalized(row[config.xAxis], config.xAxis, config.logX, config.invertX) * 10 - 5;
      pos[idx * 3 + 1] = getNormalized(row[config.yAxis], config.yAxis, config.logY, config.invertY) * 10 - 5;
      pos[idx * 3 + 2] = getNormalized(row[config.zAxis], config.zAxis, config.logZ, config.invertZ) * 10 - 5;

      const cNormalized = isCategorical ? (categoricalMap.get(row[cAxis]) || 0) : getNormalized(row[cAxis], cAxis, false, false);
      const cAdjusted = config.invertColor ? 1 - cNormalized : cNormalized;
      const c = new THREE.Color(getColorFromScale(cAdjusted, config.colorScale));
      col[idx * 3] = c.r;
      col[idx * 3 + 1] = c.g;
      col[idx * 3 + 2] = c.b;

      size[idx] = 0.05 + getNormalized(row[config.sizeAxis], config.sizeAxis, config.logSize, config.invertSize) * 2.5;
      const bNormalized = getNormalized(row[config.brightnessAxis], config.brightnessAxis, config.logBrightness, false);
      const bAdjusted = config.invertBrightness ? 1.0 - bNormalized : bNormalized;
      brightness[idx] = config.minBrightness + bAdjusted * (config.maxBrightness - config.minBrightness);
    });

    return { positions: pos, colors: col, baseSizes: size, baseBrightness: brightness };
  }, [data, config, columnStats]);

  const uniforms = useMemo(() => {
    let shape = 0;
    if (config.dotShape === 'square') shape = 1;
    if (config.dotShape === 'star') shape = 2;
    if (config.dotShape === 'cross') shape = 3;

    return {
      uDotShape: { value: shape },
      uPointShader: { value: config.pointShader === 'streamer' ? 1 : (config.pointShader === 'hex' ? 2 : 0) },
      uTime: { value: 0 },
    };
  }, [config.dotShape]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime();
  });

  // Efficient current row indicator (updated every beat)
  const isCurrentArr = useMemo(() => {
    const arr = new Float32Array(data.length);
    if (currentRow >= 0 && currentRow < data.length) {
      arr[currentRow] = 1.0;
    }
    return arr;
  }, [data.length, currentRow]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[baseSizes, 1]} />
        <bufferAttribute attach="attributes-brightness" args={[baseBrightness, 1]} />
        <bufferAttribute attach="attributes-isCurrent" args={[isCurrentArr, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`
          attribute float size;
          attribute float brightness;
          attribute float isCurrent;
          varying vec3 vColor;
          varying float vBrightness;
          varying float vSize;
          varying float vIsCurrent;
          
          void main() {
            vColor = color;
            vBrightness = brightness;
            vSize = size;
            vIsCurrent = isCurrent;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (vIsCurrent > 0.5 ? 2.5 : 1.0) * (600.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          uniform int uDotShape;
          uniform int uPointShader;
          uniform float uTime;
          varying vec3 vColor;
          varying float vBrightness;
          varying float vSize;
          varying float vIsCurrent;
          
          float sdStar(vec2 p, float r, int n, float m) {
            float angle = atan(p.y, p.x);
            float rad = 6.2831853 / float(n);
            float d = length(p);
            return d - r * (m + 0.5 * mix(1.0, 0.0, cos(floor(0.5 + angle/rad) * rad - angle)));
          }

          void main() {
            vec2 pt = gl_PointCoord - vec2(0.5);
            float dist = length(pt);
            
            if (uDotShape == 1) { if (max(abs(pt.x), abs(pt.y)) > 0.45) discard; }
            else if (uDotShape == 2) { if (sdStar(pt, 0.45, 5, 0.5) > 0.0) discard; }
            else if (uDotShape == 3) { if (min(max(abs(pt.x)-0.1, abs(pt.y)-0.45), max(abs(pt.x)-0.45, abs(pt.y)-0.1)) > 0.0) discard; }
            else { if (dist > 0.45) discard; }

            // Point Shader Styles
            vec3 shaderColor = vColor;
            float alpha = 1.0;

            if (uPointShader == 1) { // Streamer
              float streak = exp(-abs(pt.x) * 20.0) * exp(-abs(pt.y) * 2.0);
              alpha *= streak * 2.0;
            } else if (uPointShader == 2) { // Hex
              vec2 p = abs(pt);
              if (max(p.x * 0.866025 + p.y * 0.5, p.y) > 0.45) discard;
              alpha *= 0.9;
            }

            float glow = exp(-dist * (6.0 + 2.0 * sin(uTime * 2.0)));
            float core = smoothstep(0.4, 0.0, dist);
            float whiteCore = smoothstep(0.12, 0.0, dist);
            
            vec3 finalColor = vColor * vBrightness;
            if (vIsCurrent > 0.5) {
               finalColor += vColor * 2.0;
               glow *= 2.0;
            }
            
            gl_FragColor = vec4(finalColor + vec3(whiteCore), (core + glow + whiteCore) * 0.7 * alpha);
          }
        `}
      />
    </points>
  );
};

const SelectionIndicator = ({ positions, currentRow, config }: any) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetPos = useRef(new THREE.Vector3());
  const currentPos = useRef(new THREE.Vector3());

  useFrame((_state, delta) => {
    if (!positions || currentRow < 0 || currentRow * 3 >= positions.length) return;

    targetPos.current.set(
      positions[currentRow * 3],
      positions[currentRow * 3 + 1],
      positions[currentRow * 3 + 2]
    );

    if (config.animatePlayhead) {
      currentPos.current.lerp(targetPos.current, delta * 15);
    } else {
      currentPos.current.copy(targetPos.current);
    }

    if (meshRef.current) {
      meshRef.current.position.copy(currentPos.current);
    }
  });

  if (!config.showSelector) return null;

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
      <mesh position={currentPos.current} rotation={[0, 0, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
};

const OriginMarker = () => {
  return (
    <group>
      <gridHelper args={[2, 2, '#fff', '#666']} rotation={[0, 0, 0]} position={[0, 0, 0]} />
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Small Axis Cross */}
      <line>
         <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)])} />
         <lineBasicMaterial attach="material" color="#ff4444" />
      </line>
      <line>
         <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 1, 0)])} />
         <lineBasicMaterial attach="material" color="#44ff44" />
      </line>
      <line>
         <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 1)])} />
         <lineBasicMaterial attach="material" color="#4444ff" />
      </line>
    </group>
  );
};

const Axes = ({ config }: any) => {
  return (
    <group>
      {/* X Axis */}
      <line>
        <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-5, -5, -5), new THREE.Vector3(5, -5, -5)])} />
        <lineBasicMaterial attach="material" color="#00f2ff" opacity={0.3} transparent />
      </line>
      <Text position={[6, -5, -5]} fontSize={0.3} color="#00f2ff">{config.xAxis}</Text>
      
      {/* Y Axis */}
      <line>
        <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-5, -5, -5), new THREE.Vector3(-5, 5, -5)])} />
        <lineBasicMaterial attach="material" color="#7000ff" opacity={0.3} transparent />
      </line>
      <Text position={[-5, 6, -5]} fontSize={0.3} color="#7000ff">{config.yAxis}</Text>

      {/* Z Axis */}
      <line>
        <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-5, -5, -5), new THREE.Vector3(-5, -5, 5)])} />
        <lineBasicMaterial attach="material" color="#ff00f2" opacity={0.3} transparent />
      </line>
      <Text position={[-5, -5, 6]} fontSize={0.3} color="#ff00f2">{config.zAxis}</Text>
      
      {config.showGrid && (
        <gridHelper args={[10, 10, '#00f2ff', '#333333']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -5]} />
      )}
    </group>
  );
};

const Layout3DView = ({ csvData, vizConfig, columnStats, currentRow, activeConfig }: any) => {
  // Extract positions so we can pass them to the indicator
  const { positions } = useMemo(() => {
    // This redundant calculation is just to extract the final mapped positions array
    // for the selection indicator to use without re-normalizing everything.
    const pos = new Float32Array(csvData.length * 3);
    const getNormalized = (v: any, colName: string, useLog: boolean, invert: boolean) => {
      if (!colName) return 0.5;
      let val = typeof v === 'number' ? v : parseFloat(v) || 0;
      let min = columnStats[colName]?.min || 0;
      let max = columnStats[colName]?.max || 1;
      if (useLog && val > 0 && min > 0) {
        val = Math.log10(val); min = Math.log10(min); max = Math.log10(max);
      }
      let normalized = (min === max) ? 0.5 : (val - min) / (max - min);
      return invert ? 1 - normalized : normalized;
    };

    csvData.forEach((row: any, idx: number) => {
      pos[idx * 3] = getNormalized(row[activeConfig.xAxis], activeConfig.xAxis, activeConfig.logX, activeConfig.invertX) * 10 - 5;
      pos[idx * 3 + 1] = getNormalized(row[activeConfig.yAxis], activeConfig.yAxis, activeConfig.logY, activeConfig.invertY) * 10 - 5;
      pos[idx * 3 + 2] = getNormalized(row[activeConfig.zAxis], activeConfig.zAxis, activeConfig.logZ, activeConfig.invertZ) * 10 - 5;
    });
    return { positions: pos };
  }, [csvData, activeConfig, columnStats]);

  return (
    <>
      <Axes config={activeConfig} />
      {activeConfig.showOrigin && <OriginMarker />}
      <Points data={csvData} config={activeConfig} columnStats={columnStats} currentRow={currentRow} />
      <SelectionIndicator positions={positions} currentRow={currentRow} config={activeConfig} />
    </>
  );
};



export const Scatter3D: React.FC = () => {
  const { csvData, vizConfig, columnStats, nodes, edges, currentRow } = useStore();
  const flowMappings = useMemo(() => FlowEngine.getStaticMappings(nodes, edges), [nodes, edges]);
  const activeConfig = useMemo(() => ({
    ...vizConfig,
    xAxis: flowMappings.xAxis || vizConfig.xAxis,
    yAxis: flowMappings.yAxis || vizConfig.yAxis,
    zAxis: flowMappings.zAxis || vizConfig.zAxis,
    colorAxis: flowMappings.color || vizConfig.colorAxis,
    sizeAxis: flowMappings.size || vizConfig.sizeAxis,
  }), [vizConfig, flowMappings]);

  if (!csvData) return null;

  return (
    <div className="scatter-3d-container" style={{ width: '100%', height: '100%', background: '#050508' }}>
      <Canvas>
        {vizConfig.cameraMode === 'perspective' ? (
          <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />
        ) : (
          <OrthographicCamera makeDefault position={[10, 10, 10]} zoom={80} />
        )}
        
        {vizConfig.navigationMode === 'orbit' ? (
          <OrbitControls enableDamping />
        ) : (
          <FlyControls movementSpeed={5} rollSpeed={0.5} dragToLook={false} />
        )}
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <XR store={xrStore}>
          <Layout3DView 
            csvData={csvData} 
            vizConfig={vizConfig} 
            columnStats={columnStats} 
            currentRow={currentRow} 
            activeConfig={activeConfig} 
          />
        </XR>
        
        <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
        
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['#ff00f2', '#7000ff', '#00f2ff']} labelColor="white" />
        </GizmoHelper>

        <EffectComposer>
          <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} radius={0.4} />
        </EffectComposer>
        
        <fog attach="fog" args={['#050508', 15, 30]} />
      </Canvas>
    </div>
  );
};
