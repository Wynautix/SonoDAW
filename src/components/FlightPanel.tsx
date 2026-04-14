import React from 'react';
import { useStore } from '../store/useStore';
import { 
  Box, Activity, Maximize2, Compass, Cpu, 
  Settings2, ChevronRight, X
} from 'lucide-react';
import { xrStore } from '../store/xrStore';
import './FlightPanel.css';

export const FlightPanel: React.FC = () => {
  const { vizConfig, updateVizConfig } = useStore();
  const [isVisible, setIsVisible] = React.useState(true);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isVisible) {
    return isMounted ? (
      <button className="flight-panel-toggle" onClick={() => setIsVisible(true)}>
        <Compass size={18} />
      </button>
    ) : null;
  }

  return (
    <div className="flight-panel-hud fade-in">
      <div className="hud-header">
        <div className="hud-title">
           <Compass size={14} />
           <span>FLIGHT DECK // MK-IX</span>
        </div>
        <button className="hud-close" onClick={() => setIsVisible(false)}><X size={14} /></button>
      </div>

      <div className="hud-content">
        {/* Projection Controls */}
        <div className="hud-section">
          <label>PROJECTION MODE</label>
          <div className="hud-btn-group">
            <button 
              className={vizConfig.mode === '2d' ? 'active' : ''} 
              onClick={() => updateVizConfig({ mode: '2d' })}
            >
              2D
            </button>
            <button 
              className={vizConfig.mode === '3d' ? 'active' : ''} 
              onClick={() => updateVizConfig({ mode: '3d' })}
            >
              3D
            </button>
          </div>
        </div>

        {vizConfig.mode === '3d' && (
          <>
            <div className="hud-section">
              <label>CAMERA TYPE</label>
              <div className="hud-btn-group">
                <button className={vizConfig.cameraMode === 'perspective' ? 'active' : ''} onClick={() => updateVizConfig({ cameraMode: 'perspective' })}>PERSPECTIVE</button>
                <button className={vizConfig.cameraMode === 'ortho' ? 'active' : ''} onClick={() => updateVizConfig({ cameraMode: 'ortho' })}>ORTHO</button>
              </div>
            </div>

            <div className="hud-section">
              <label>NAVIGATION STYLE</label>
              <div className="hud-btn-group">
                <button className={vizConfig.navigationMode === 'orbit' ? 'active' : ''} onClick={() => updateVizConfig({ navigationMode: 'orbit' })}>ORBIT</button>
                <button 
                  className={vizConfig.navigationMode === 'fly' ? 'active' : ''} 
                  onClick={() => {
                    updateVizConfig({ navigationMode: 'fly' });
                    const elem = document.getElementById('viz-viewport');
                    if (!document.fullscreenElement) {
                      elem?.requestFullscreen().catch(err => console.error(err));
                    }
                  }}
                >
                  SPACESHIP
                </button>
              </div>
            </div>

            <div className="hud-section">
              <label>X-PLANE / REALITY MAPPING</label>
              <div className="hud-btn-row">
                <button className="hud-action-btn" onClick={() => xrStore.enterVR()}>
                  <Box size={14} /> ENTER VR
                </button>
                <button className="hud-action-btn" onClick={() => xrStore.enterAR()}>
                  <Activity size={14} /> ENTER AR
                </button>
              </div>
            </div>

            <div className="hud-section">
              <label>SCENE OVERLAYS</label>
              <div className="hud-checkbox-row">
                 <label className="hud-checkbox">
                   <input 
                     type="checkbox" 
                     checked={vizConfig.showGrid} 
                     onChange={(e) => updateVizConfig({ showGrid: e.target.checked })} 
                   />
                   <span>SHOW 3D HELPER GRID</span>
                 </label>
              </div>
            </div>

            <button 
              className="hud-start-flight-btn"
              onClick={() => {
                updateVizConfig({ navigationMode: 'fly' });
                const elem = document.getElementById('viz-viewport');
                if (!document.fullscreenElement) {
                  elem?.requestFullscreen().catch(err => console.error(err));
                }
              }}
            >
              <Maximize2 size={16} /> INITIALIZE FLIGHT
            </button>
          </>
        )}
      </div>

      <div className="hud-footer">
        <div className="hud-status">
          <div className="status-dot pulsing"></div>
          <span>SYSTEM READY</span>
        </div>
        <div className="hud-version">v1.5.0-FLIGHT</div>
      </div>
    </div>
  );
};
