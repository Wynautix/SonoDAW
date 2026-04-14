import React from 'react';
import { useStore } from '../store/useStore';
import { Palette, X, Box, Zap, Sparkles } from 'lucide-react';
import './GridStylesOverlay.css';

interface GridStylesOverlayProps {
  onClose: () => void;
}

export const GridStylesOverlay: React.FC<GridStylesOverlayProps> = ({ onClose }) => {
  const { gridConfig, updateGridConfig } = useStore();

  const handleUpdate = (updates: Partial<typeof gridConfig>) => {
    updateGridConfig(updates);
  };

  return (
    <div className="grid-styles-overlay fade-in">
      <div className="overlay-header">
        <div className="title">
          <Palette size={16} />
          <span>GRID AESTHETICS</span>
        </div>
        <button className="close-btn" onClick={onClose}><X size={14} /></button>
      </div>

      <div className="overlay-content">
        <div className="style-section">
          <label>VISUAL MODE</label>
          <div className="mode-selector">
            <button 
              className={gridConfig.barMode === 'solid' ? 'active' : ''}
              onClick={() => handleUpdate({ barMode: 'solid' })}
            >
              <Box size={14} /> Solid
            </button>
            <button 
              className={gridConfig.barMode === 'gradient' ? 'active' : ''}
              onClick={() => handleUpdate({ barMode: 'gradient' })}
            >
              <Zap size={14} /> Gradient
            </button>
            <button 
              className={gridConfig.barMode === 'rainbow' ? 'active' : ''}
              onClick={() => handleUpdate({ barMode: 'rainbow' })}
            >
              <Sparkles size={14} /> Rainbow
            </button>
          </div>
        </div>

        <div className="style-section">
          <label>IDLE COLORS (FOREGROUND / BACKGROUND)</label>
          <div className="color-pair">
            <input 
              type="color" 
              value={gridConfig.idleGradient[0]} 
              onChange={(e) => handleUpdate({ idleGradient: [e.target.value, gridConfig.idleGradient[1]] })}
            />
            <input 
              type="color" 
              value={gridConfig.idleGradient[1]} 
              onChange={(e) => handleUpdate({ idleGradient: [gridConfig.idleGradient[0], e.target.value] })}
            />
          </div>
        </div>

        <div className="style-section">
          <label>HIGHLIGHT COLORS</label>
          <div className="color-pair">
            <input 
              type="color" 
              value={gridConfig.highlightGradient[0]} 
              onChange={(e) => handleUpdate({ highlightGradient: [e.target.value, gridConfig.highlightGradient[1]] })}
            />
            <input 
              type="color" 
              value={gridConfig.highlightGradient[1]} 
              onChange={(e) => handleUpdate({ highlightGradient: [gridConfig.highlightGradient[0], e.target.value] })}
            />
          </div>
        </div>

        <div className="style-section">
          <label>DATA TRACK VISIBILITY</label>
          <div className="toggle-row">
            <span>Show Background Track</span>
            <input 
              type="checkbox" 
              checked={gridConfig.showBackground}
              onChange={(e) => handleUpdate({ showBackground: e.target.checked })}
            />
          </div>
          <div className="slider-row">
            <span>Opacity</span>
            <input 
              type="range" min="0" max="1" step="0.05"
              value={gridConfig.backgroundOpacity}
              onChange={(e) => handleUpdate({ backgroundOpacity: parseFloat(e.target.value) })}
            />
          </div>
        </div>

        <div className="style-section">
          <label>OPTICAL ZOOM</label>
          <div className="slider-row">
            <div className="slider-header">
              <span>Scale Factor</span>
              <span>{(gridConfig.zoom * 100).toFixed(0)}%</span>
            </div>
            <input 
              type="range" min="0.1" max="2.0" step="0.05"
              value={gridConfig.zoom}
              onChange={(e) => handleUpdate({ zoom: parseFloat(e.target.value) })}
            />
          </div>
          <div className="toggle-row">
            <span>Auto-Focus Playhead</span>
            <input 
              type="checkbox" 
              checked={gridConfig.autoScroll}
              onChange={(e) => handleUpdate({ autoScroll: e.target.checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
