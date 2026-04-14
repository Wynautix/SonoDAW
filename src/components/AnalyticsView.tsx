import React, { useMemo, Suspense } from 'react';
import { useStore } from '../store/useStore';
import { 
  ScatterChart, Scatter, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  ScatterChart as ScatterIcon, Activity, Settings2, Box, Layout, 
  Palette, Plus, Trash2, ChevronRight, Database, Maximize2, X
} from 'lucide-react';
import { Scatter3D } from './Scatter3D';
import { xrStore } from '../store/xrStore';
import { FlightPanel } from './FlightPanel';
import { FlowEngine } from '../data/FlowEngine';
import { getColorFromScale, normalizeValue, getColorFromRules } from '../data/ColorScales';
import './AnalyticsView.css';

export const AnalyticsView: React.FC<{ renderOnly?: boolean }> = ({ renderOnly }) => {
  const { 
    csvData, headers, currentRow, vizConfig, updateVizConfig, 
    columnStats, addColorRule, removeColorRule, updateColorRule,
    nodes, edges
  } = useStore();
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [dismissedRow, setDismissedRow] = React.useState(-1);

  // Re-show card if selection changes
  React.useEffect(() => {
    if (currentRow !== dismissedRow) {
      setDismissedRow(-1);
    }
  }, [currentRow]);

  // Sync fullscreen state
  React.useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      
      // Auto-revert navigation mode on exit
      if (!isFs && vizConfig.navigationMode === 'fly') {
        updateVizConfig({ navigationMode: 'orbit' });
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [vizConfig.navigationMode]);

  // Auto-initialize config if not set
  React.useEffect(() => {
    if (!vizConfig.xAxis && headers.length > 0) {
      updateVizConfig({
        xAxis: headers.find(h => h.toLowerCase().includes('temp')) || headers[0],
        yAxis: headers.find(h => h.toLowerCase().includes('lum')) || headers[1],
        zAxis: headers[2] || headers[0],
        colorAxis: headers.find(h => h.toLowerCase().includes('temp')) || headers[0],
        sizeAxis: headers.find(h => h.toLowerCase().includes('rad')) || headers[0],
      });
    }
  }, [headers]);

  const flowMappings = useMemo(() => FlowEngine.getStaticMappings(nodes, edges), [nodes, edges]);
  const activeConfig = useMemo(() => ({
    ...vizConfig,
    xAxis: flowMappings.xAxis || vizConfig.xAxis,
    yAxis: flowMappings.yAxis || vizConfig.yAxis,
    zAxis: flowMappings.zAxis || vizConfig.zAxis,
    colorAxis: flowMappings.color || vizConfig.colorAxis,
    sizeAxis: flowMappings.size || vizConfig.sizeAxis,
  }), [vizConfig, flowMappings]);

  const chartData2D = useMemo(() => {
    if (!csvData) return [];
    return csvData.map((row, idx) => {
      const rowX = row[activeConfig.xAxis];
      const rowY = row[activeConfig.yAxis];
      const cAxisVal = row[activeConfig.colorAxis];
      
      let color;
      if (vizConfig.colorMode === 'intervals') {
        color = getColorFromRules(cAxisVal, vizConfig.colorRules) || '#444';
      } else {
        const cAxisVal = row[activeConfig.colorAxis];
        const cNormalized = normalizeValue(
          cAxisVal || rowX, 
          columnStats[activeConfig.colorAxis || activeConfig.xAxis]?.min || 0, 
          columnStats[activeConfig.colorAxis || activeConfig.xAxis]?.max || 1
        );
        const cAdjusted = vizConfig.invertColor ? 1 - cNormalized : cNormalized;
        color = getColorFromScale(cAdjusted, vizConfig.colorScale);
      }
      
      const x = typeof rowX === 'number' && isFinite(rowX) ? rowX : 0;
      const y = typeof rowY === 'number' && isFinite(rowY) ? rowY : 0;
      
      const sAxisVal = row[activeConfig.sizeAxis];
      const sizeNormal = sAxisVal !== undefined ? normalizeValue(
        sAxisVal,
        columnStats[activeConfig.sizeAxis]?.min || 0,
        columnStats[activeConfig.sizeAxis]?.max || 1
      ) : 0.5;
      
      const sizeAdjusted = vizConfig.invertSize ? 1 - sizeNormal : sizeNormal;
      const size = vizConfig.logSize ? Math.log10(sizeAdjusted + 0.1) + 1 : sizeAdjusted;

      const bAxisVal = row[activeConfig.brightnessAxis];
      const bNormalized = bAxisVal !== undefined ? normalizeValue(
        bAxisVal,
        columnStats[activeConfig.brightnessAxis]?.min || 0,
        columnStats[activeConfig.brightnessAxis]?.max || 1
      ) : 0.5;

      const brightness = vizConfig.minBrightness + bNormalized * (vizConfig.maxBrightness - vizConfig.minBrightness);

      return {
        x,
        y,
        color,
        size: size,
        brightness: vizConfig.invertBrightness ? vizConfig.maxBrightness - (brightness - vizConfig.minBrightness) : brightness,
        name: row[headers[0]],
        index: idx,
        isCurrent: idx === currentRow
      };
    });
  }, [csvData, vizConfig, activeConfig, columnStats, currentRow]);

  if (!csvData) return (
    <div className="analytics-empty">
      <Database size={48} />
      <p>Please load a CSV file to begin analysis.</p>
    </div>
  );

  return (
    <div className={`analytics-view ${renderOnly ? 'render-only' : ''}`}>
      {!renderOnly && (
        <aside className="viz-builder-sidebar">
          <div className="sidebar-header">
            <Settings2 size={18} />
            <h2>VIZ BUILDER</h2>
          </div>

          <div className="sidebar-scroll">
            {/* Global Aesthetics / Performance Toggles */}
            <section className="builder-section">
              <div className="section-label"><Activity size={12} /> Visualization Settings</div>
              <div className="builder-group">
                <div className="setting-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-dim)' }}>
                    <input type="checkbox" checked={vizConfig.animatePlayhead} onChange={(e) => updateVizConfig({ animatePlayhead: e.target.checked })} />
                    Animate Transitions
                  </label>
                  <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-dim)' }}>
                    <input type="checkbox" checked={vizConfig.sustainLegato} onChange={(e) => updateVizConfig({ sustainLegato: e.target.checked })} />
                    Sustain Note Legato
                  </label>
                  <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-dim)' }}>
                    <input type="checkbox" checked={vizConfig.showOrigin} onChange={(e) => updateVizConfig({ showOrigin: e.target.checked })} />
                    Show Origin Point
                  </label>
                  <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-dim)' }}>
                    <input type="checkbox" checked={vizConfig.showSelector} onChange={(e) => updateVizConfig({ showSelector: e.target.checked })} />
                    Show Playhead Selector
                  </label>
                  <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-dim)' }}>
                    <input type="checkbox" checked={vizConfig.showGrid} onChange={(e) => updateVizConfig({ showGrid: e.target.checked })} />
                    Show 3D Helper Grid
                  </label>
                </div>
              </div>
            </section>

            {/* Geometry Block */}
            <section className="builder-section">
              <div className="section-label"><Layout size={12} /> Geometry</div>
              
              <div className="builder-group">
                <label>X-Axis {flowMappings.xAxis && <span className="locked-badge">LOCKED</span>}</label>
                <select value={activeConfig.xAxis} onChange={(e) => updateVizConfig({ xAxis: e.target.value })} disabled={!!flowMappings.xAxis}>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <div className="opt-row">
                  <label><input type="checkbox" checked={vizConfig.invertX} onChange={e => updateVizConfig({ invertX: e.target.checked })} /> Inv</label>
                  <label><input type="checkbox" checked={vizConfig.logX} onChange={e => updateVizConfig({ logX: e.target.checked })} /> Log</label>
                </div>
              </div>

              <div className="builder-group">
                <label>Y-Axis {flowMappings.yAxis && <span className="locked-badge">LOCKED</span>}</label>
                <select value={activeConfig.yAxis} onChange={(e) => updateVizConfig({ yAxis: e.target.value })} disabled={!!flowMappings.yAxis}>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <div className="opt-row">
                  <label><input type="checkbox" checked={vizConfig.invertY} onChange={e => updateVizConfig({ invertY: e.target.checked })} /> Inv</label>
                  <label><input type="checkbox" checked={vizConfig.logY} onChange={e => updateVizConfig({ logY: e.target.checked })} /> Log</label>
                </div>
              </div>

              {vizConfig.mode === '3d' && (
                <div className="builder-group">
                  <label>Z-Axis {flowMappings.zAxis && <span className="locked-badge">LOCKED</span>}</label>
                  <select value={activeConfig.zAxis} onChange={(e) => updateVizConfig({ zAxis: e.target.value })} disabled={!!flowMappings.zAxis}>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <div className="opt-row">
                    <label><input type="checkbox" checked={vizConfig.invertZ} onChange={e => updateVizConfig({ invertZ: e.target.checked })} /> Inv</label>
                    <label><input type="checkbox" checked={vizConfig.logZ} onChange={e => updateVizConfig({ logZ: e.target.checked })} /> Log</label>
                  </div>
                </div>
              )}
            </section>

            {/* Aesthetics Block */}
            <section className="builder-section">
              <div className="section-label"><Palette size={12} /> Aesthetics</div>
              
              <div className="builder-group">
                <label>Drive Color By {flowMappings.color && <span className="locked-badge">LOCKED</span>}</label>
                <select value={activeConfig.colorAxis} onChange={(e) => updateVizConfig({ colorAxis: e.target.value })} disabled={!!flowMappings.color}>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="builder-group">
                <label>Color Scale</label>
                <select value={vizConfig.colorScale} onChange={(e) => updateVizConfig({ colorScale: e.target.value as any })}>
                  <option value="temp">Thermal (Stellar)</option>
                  <option value="plasma">Plasma Blue-Purple</option>
                  <option value="spectral">Spectral Rainbow</option>
                  <option value="blackbody">White-Hot Glare</option>
                </select>
              </div>

              <div className="builder-group">
                <label>Point Shader (3D)</label>
                <div className="mode-toggle">
                  <button className={vizConfig.pointShader === 'glow' ? 'active' : ''} onClick={() => updateVizConfig({ pointShader: 'glow' })}>Glow</button>
                  <button className={vizConfig.pointShader === 'streamer' ? 'active' : ''} onClick={() => updateVizConfig({ pointShader: 'streamer' })}>Streamer</button>
                  <button className={vizConfig.pointShader === 'hex' ? 'active' : ''} onClick={() => updateVizConfig({ pointShader: 'hex' })}>Hex</button>
                </div>
              </div>

              <div className="builder-group">
                <label>Dot Shape</label>
                <div className="mode-toggle shapes">
                   <button className={vizConfig.dotShape === 'circle' ? 'active' : ''} onClick={() => updateVizConfig({ dotShape: 'circle' })}>●</button>
                   <button className={vizConfig.dotShape === 'square' ? 'active' : ''} onClick={() => updateVizConfig({ dotShape: 'square' })}>■</button>
                   <button className={vizConfig.dotShape === 'star' ? 'active' : ''} onClick={() => updateVizConfig({ dotShape: 'star' })}>★</button>
                   <button className={vizConfig.dotShape === 'cross' ? 'active' : ''} onClick={() => updateVizConfig({ dotShape: 'cross' })}>✚</button>
                </div>
              </div>
            </section>

            {/* Data Inspector Selection */}
            <section className="builder-section">
              <div className="section-label"><Database size={12} /> Data Inspector Fields</div>
              <div className="builder-group">
                <div className="inspector-fields">
                  {headers.map(h => (
                    <label key={h} className="checkbox-label" style={{ fontSize: '10px' }}>
                      <input 
                        type="checkbox" 
                        checked={vizConfig.inspectorColumns.includes(h)} 
                        onChange={(e) => {
                          const cols = e.target.checked 
                            ? [...vizConfig.inspectorColumns, h]
                            : vizConfig.inspectorColumns.filter(c => c !== h);
                          updateVizConfig({ inspectorColumns: cols });
                        }}
                      />
                      {h}
                    </label>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </aside>
      )}

      <main className="viz-viewport" id="viz-viewport">
        {/* Centralized Flight HUD with safety wrapper */}
        <Suspense fallback={null}>
          <FlightPanel />
        </Suspense>

        {/* Dynamic Data Inspector Card */}
        {vizConfig.inspectorColumns.length > 0 && csvData && csvData[currentRow] && dismissedRow !== currentRow && (
          <div className="data-inspector-card fade-in">
            <div className="card-header">
              <Activity size={14} />
              <span>STELLAR INSPECTOR</span>
              <button className="card-close" onClick={() => setDismissedRow(currentRow)}><X size={12} /></button>
            </div>
            <div className="card-content">
              {vizConfig.inspectorColumns.map(col => (
                <div key={col} className="data-row">
                  <span className="col-name">{col}</span>
                  <span className="col-value">
                    {csvData[currentRow][col] !== undefined
                      ? (typeof csvData[currentRow][col] === 'number' 
                          ? csvData[currentRow][col].toLocaleString(undefined, { maximumFractionDigits: 3 }) 
                          : csvData[currentRow][col])
                      : 'N/A'
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="viewport-overlay-controls">
           <button 
             className="viewport-btn" 
             onClick={() => {
               const elem = document.getElementById('viz-viewport');
               if (!document.fullscreenElement) {
                 elem?.requestFullscreen().catch(err => {
                   console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                 });
               } else {
                 document.exitFullscreen();
               }
             }}
             title="Toggle Fullscreen"
           >
             <Maximize2 size={16} />
           </button>
        </div>

        {vizConfig.mode === '2d' ? (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
                <defs>
                  <filter id="starGlow" x="-200%" y="-200%" width="500%" height="500%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur5" />
                    <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur15" />
                    <feColorMatrix in="blur15" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0" result="haze" />
                    <feMerge>
                      <feMergeNode in="haze" />
                      <feMergeNode in="blur5" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  type="number" dataKey="x" name={vizConfig.xAxis} stroke="var(--text-dim)" fontSize={10}
                  reversed={vizConfig.invertX} scale={vizConfig.logX ? 'log' : 'auto'} domain={['auto', 'auto']}
                  label={{ value: vizConfig.xAxis, position: 'bottom', offset: 0, fill: 'var(--text-dim)', fontSize: 10 }}
                />
                <YAxis 
                  type="number" dataKey="y" name={vizConfig.yAxis} stroke="var(--text-dim)" fontSize={10}
                  reversed={vizConfig.invertY} scale={vizConfig.logY ? 'log' : 'auto'} domain={['auto', 'auto']}
                  label={{ value: vizConfig.yAxis, angle: -90, position: 'left', fill: 'var(--text-dim)', fontSize: 10 }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ background: '#16161c', border: '1px solid var(--accent-primary)', borderRadius: '8px', fontSize: '10px' }}
                />
                <Scatter 
                  data={chartData2D}
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    const b = 0.4 + (payload.brightness || 0.5) * 0.6;
                    const baseSize = 3 + (payload.size || 0.5) * 20; 
                    const size = payload.isCurrent ? baseSize * 1.5 : baseSize;
                    
                    const renderShape = (s: number, color: string, glow: boolean, opacity: number) => {
                      const shapeProps = {
                        cx, cy, r: s, fill: color, opacity,
                        style: glow ? { filter: 'url(#starGlow)' } : {}
                      };
                      
                      switch (vizConfig.dotShape) {
                        case 'square': return <rect x={cx - s} y={cy - s} width={s * 2} height={s * 2} {...shapeProps} />;
                        case 'star': return <path d={`M ${cx} ${cy - s * 1.5} L ${cx + s * 0.4} ${cy - s * 0.4} L ${cx + s * 1.5} ${cy} L ${cx + s * 0.4} ${cy + s * 0.4} L ${cx} ${cy + s * 1.5} L ${cx - s * 0.4} ${cy + s * 0.4} L ${cx - s * 1.5} ${cy} L ${cx - s * 0.4} ${cy - s * 0.4} Z`} {...shapeProps} />;
                        case 'cross': return <path d={`M ${cx - s} ${cy - s * 0.2} L ${cx - s * 0.2} ${cy - s * 0.2} L ${cx - s * 0.2} ${cy - s} L ${cx + s * 0.2} ${cy - s} L ${cx + s * 0.2} ${cy - s * 0.2} L ${cx + s} ${cy - s * 0.2} L ${cx + s} ${cy + s * 0.2} L ${cx + s * 0.2} ${cy + s * 0.2} L ${cx + s * 0.2} ${cy + s} L ${cx - s * 0.2} ${cy + s} L ${cx - s * 0.2} ${cy + s * 0.2} L ${cx - s} ${cy + s * 0.2} Z`} {...shapeProps} />;
                        default: return <circle {...shapeProps} />;
                      }
                    };

                    return (
                      <g style={{ pointerEvents: 'none' }}>
                        {renderShape(size * 1.4, payload.color, true, b * 0.5)}
                        {renderShape(size * 0.8, payload.color, true, b * 0.8)}
                        {renderShape(size * 0.4, '#fff', false, 1.0)}
                      </g>
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Scatter3D />
        )}
      </main>
    </div>
  );
};
