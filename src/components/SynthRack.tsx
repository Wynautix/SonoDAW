import React from 'react';
import { useStore } from '../store/useStore';
import { Plus, Power, Volume2, Trash2, Sliders } from 'lucide-react';
import { Knob } from './Knob';
import './SynthRack.css';

export const SynthRack: React.FC = () => {
  const { 
    project, updateProject, removeTrack, addTrack, 
    activeTrackId, setActiveTrack, toggleMute, 
    updateTrackMixer, viewMode, currentRow, setCurrentRow,
    nodes, edges, columnStats, setRuntimeOutputs, vizConfig, setActiveNotes,
    updateMasterVolume
  } = useStore();

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const columnName = e.dataTransfer.getData('columnName');
    if (columnName) {
      addTrack(columnName);
    }
  };

  return (
    <div className="synth-rack" onDragOver={onDragOver} onDrop={onDrop}>
      <div className="rack-header-add">
        <Plus size={14} />
        <span>DROP FIELD HERE TO ADD TRACK</span>
      </div>
      
      <div className="track-list">
        {project.tracks.map((track) => (
          <div 
            key={track.id} 
            className={`track-item ${activeTrackId === track.id ? 'active' : ''}`}
            onClick={() => setActiveTrack(track.id)}
          >
            <div className="track-controls">
              <button 
                className={`mute-btn ${track.synthSettings.muted ? 'off' : 'on'}`}
                title="Mute/Unmute"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute(track.id);
                }}
              >
                <Power size={12} />
              </button>
              <div className="led"></div>
            </div>
            
            <div className="track-name-box">
              <span className="track-name">{track.name}</span>
            </div>

            <div className="track-params">
              <Knob 
                label="PAN" 
                value={track.pan} 
                min={-1} max={1} 
                onChange={(val) => updateTrackMixer(track.id, { pan: val })}
                color="var(--accent-secondary)"
              />
              <Knob 
                label="VOL" 
                value={track.volume} 
                min={0} max={1.5} 
                onChange={(val) => updateTrackMixer(track.id, { volume: val })}
                color="var(--accent-primary)"
              />
            </div>

            <div className="track-routing">
              <input 
                type="number" 
                value={track.mixerChannel} 
                min="0" max="7" 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  updateProject({
                    tracks: project.tracks.map(t => t.id === track.id ? { ...t, mixerChannel: val } : t)
                  });
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <button 
              className="delete-track-btn"
              onClick={(e) => {
                e.stopPropagation();
                removeTrack(track.id);
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {project.tracks.length === 0 && (
          <div className="rack-empty">
            <p>No tracks added.</p>
            <span>Drag columns from the left sidebar here.</span>
          </div>
        )}
      </div>
    </div>
  );
};
