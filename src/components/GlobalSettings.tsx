import React from 'react';
import { useStore } from '../store/useStore';
import { ROOTS, ROOT_DISPLAY_NAMES, SCALES, ScaleMode } from '../audio/MusicConstants';
import { Music, Filter } from 'lucide-react';
import './GlobalSettings.css';

export const GlobalSettings: React.FC = () => {
  const { scaleSettings, setScale } = useStore();

  return (
    <div className="global-settings">
      <div className="settings-group">
        <label><Music size={12} /> Key</label>
        <select 
          value={scaleSettings.root} 
          onChange={(e) => setScale({ root: e.target.value })}
        >
          {ROOTS.map(root => (
            <option key={root} value={root}>
              {ROOT_DISPLAY_NAMES[root] || root}
            </option>
          ))}
        </select>
      </div>

      <div className="settings-group">
        <label><Filter size={12} /> Mode</label>
        <select 
          value={scaleSettings.mode} 
          onChange={(e) => setScale({ mode: e.target.value as ScaleMode })}
        >
          {Object.keys(SCALES).map(mode => (
            <option key={mode} value={mode}>
              {mode.charAt(0).toUpperCase() + mode.slice(1).replace(/([A-Z])/g, ' $1')}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
