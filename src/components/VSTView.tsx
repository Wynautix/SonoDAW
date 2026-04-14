import React from 'react';
import { useStore } from '../store/useStore';
import { Settings, Sliders, X, Square } from 'lucide-react';
import { SynthEditor } from './SynthEditor';
import './VSTView.css';

export const VSTView: React.FC = () => {
  const { 
    activeEffectId, 
    activeTrackId, 
    project, 
    updateEffectParam,
    setActiveEffect
  } = useStore();

  const selectedTrack = project.tracks.find(t => t.id === activeTrackId);
  
  // Find active effect in all chains
  let activeEffect = project.masterEffectChain.find(fx => fx.id === activeEffectId);
  if (!activeEffect) {
    Object.values(project.mixerEffectChains).forEach(chain => {
      const found = chain.find(fx => fx.id === activeEffectId);
      if (found) activeEffect = found;
    });
  }

  if (activeEffect) {
    return (
      <div className="vst-view">
        <div className="vst-header">
          <div className="vst-info">
            <Sliders size={14} />
            <span className="vst-name">{activeEffect.type}</span>
          </div>
          <button className="vst-close" onClick={() => setActiveEffect(null)}>
            <X size={14} />
          </button>
        </div>
        <div className="vst-body fx-params">
          {Object.entries(activeEffect.params).map(([key, value]) => (
            <div key={key} className="param-row">
              <label>{key}</label>
              <input 
                type="range" 
                min={key === 'threshold' ? -60 : 0} 
                max={key === 'threshold' ? 0 : (key === 'Q' ? 20 : (key === 'decay' ? 10 : 1))} 
                step="0.01"
                value={value as number}
                onChange={(e) => updateEffectParam(activeEffect!.id, { [key]: parseFloat(e.target.value) })}
              />
              <span className="param-value">
                {typeof value === 'number' ? value.toFixed(2) : value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (selectedTrack) {
    return (
      <div className="vst-view">
        <div className="vst-header">
          <div className="vst-info">
            <Settings size={14} />
            <span className="vst-name">{selectedTrack.name} (SYNTH)</span>
          </div>
        </div>
        <div className="vst-body">
          <SynthEditor />
        </div>
      </div>
    );
  }

  return (
    <div className="vst-view empty">
      <div className="vst-placeholder">
        <Square size={48} className="placeholder-icon" />
        <p>NO VST SELECTED</p>
        <span>Click a track or an effect slot to edit parameters</span>
      </div>
    </div>
  );
};
