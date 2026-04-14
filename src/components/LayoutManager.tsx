import React from 'react';
import { useStore } from '../store/useStore';
import { ColumnsSidebar } from './ColumnsSidebar';
import { SynthRack } from './SynthRack';
import { Mixer } from './Mixer';
import { VSTView } from './VSTView';
import { EffectStack } from './EffectStack';
import { motion, AnimatePresence } from 'framer-motion';
import './LayoutManager.css';

export const LayoutManager: React.FC = () => {
  const { project, viewMode, updateProject } = useStore();
  const { layout } = project;

  const handleResize = (id: string, dir: 'w' | 'h', delta: number) => {
    const newLayout = layout.map(p => {
      if (p.id === id) {
        return {
          ...p,
          [dir]: Math.max(1, Math.min(10, p[dir] + delta))
        };
      }
      return p;
    });
    updateProject({ layout: newLayout });
  };

  const renderPanelContent = (type: string) => {
    switch (type) {
      case 'columns': return <ColumnsSidebar />;
      case 'rack-mixer': 
        return viewMode === 'mixer' ? <Mixer /> : <SynthRack />;
      case 'vst': return <VSTView />;
      case 'fx-stack': return <EffectStack />;
      default: return null;
    }
  };

  return (
    <div className="layout-manager">
      <AnimatePresence>
        {layout.filter(p => p.visible).map(panel => (
          <motion.div
            key={panel.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`panel-container panel-${panel.id}`}
            style={{
              gridColumn: `span ${panel.w}`,
              gridRow: `span ${panel.h}`,
            }}
          >
            <div className="panel-header">
              <span className="panel-title">{panel.id.toUpperCase()}</span>
              <div className="panel-actions">
                <button className="panel-btn">_</button>
              </div>
            </div>
            <div className="panel-content">
              {/* Corner Greeble Screws */}
              <div className="greeble-screw" style={{ top: '6px', left: '6px' }}></div>
              <div className="greeble-screw" style={{ top: '6px', right: '6px' }}></div>
              <div className="greeble-screw" style={{ bottom: '6px', left: '6px' }}></div>
              <div className="greeble-screw" style={{ bottom: '6px', right: '6px' }}></div>

              {/* Decorative Brackets (Theme specific visibility via CSS) */}
              <div className="greeble-bracket top-left"></div>
              <div className="greeble-bracket top-right"></div>
              <div className="greeble-bracket bottom-left"></div>
              <div className="greeble-bracket bottom-right"></div>

              {/* Technical Labels */}
              <div className="greeble-label" style={{ position: 'absolute', top: '4px', right: '30px' }}>
                MK-VII // SYS:{panel.id.toUpperCase()}
              </div>
              <div className="greeble-label" style={{ position: 'absolute', bottom: '4px', left: '30px' }}>
                NODE_STB: {Math.floor(Math.random() * 9999).toString(16).toUpperCase()}
              </div>

              {/* Barcode/Pattern */}
              <div className="greeble-barcode" style={{ position: 'absolute', bottom: '6px', right: '30px' }}></div>

              <div className="panel-resize horizontal" onClick={(e) => { e.stopPropagation(); handleResize(panel.id, 'w', 1); }}>+</div>
              <div className="panel-resize vertical" onClick={(e) => { e.stopPropagation(); handleResize(panel.id, 'h', 1); }}>+</div>
              <div className="panel-resize horizontal-dec" onClick={(e) => { e.stopPropagation(); handleResize(panel.id, 'w', -1); }}>-</div>
              <div className="panel-resize vertical-dec" onClick={(e) => { e.stopPropagation(); handleResize(panel.id, 'h', -1); }}>-</div>

              {renderPanelContent(panel.type)}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
