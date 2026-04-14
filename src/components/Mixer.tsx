import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Volume2, VolumeX, Headphones, Music, Power } from 'lucide-react';
import { mixerEngine } from '../audio/MixerEngine';
import './Mixer.css';

export const Mixer: React.FC = () => {
  const { project, activeTrackId, setActiveTrack, updateTrackSynth, toggleMute, toggleSolo, updateTrackMapping } = useStore();
  const [levels, setLevels] = useState<number[]>(new Array(8).fill(-Infinity));

  useEffect(() => {
    const interval = setInterval(() => {
      const newLevels = mixerEngine.meters.map(meter => {
        const val = meter.getValue();
        return Array.isArray(val) ? val[0] : val;
      });
      setLevels(newLevels);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mixer panel">
      <div className="mixer-header">
        <div className="header-title">
          <Music size={16} />
          <h3>Studio Mixer</h3>
        </div>
        <div className="master-fader">
          <div className="fader-label">MST</div>
          <input 
            type="range" 
            min="-60" 
            max="6" 
            step="0.5"
            value={mixerEngine.master.volume.value}
            onChange={(e) => {
              mixerEngine.master.volume.value = parseFloat(e.target.value);
            }}
            className="fader-vertical mini"
          />
        </div>
      </div>

      <div className="mixer-channels">
        {[...Array(8)].map((_, i) => {
          const tracksOnChannel = project.tracks.filter(t => t.mixerChannel === i);
          const level = levels[i];
          const height = Math.max(0, Math.min(100, (level + 60) * 1.6)); // Scale -60..6 to 0..100%

          return (
            <div key={i} className="channel-strip">
              <div className="meter-container">
                <div className="meter-bg">
                  <div 
                    className="meter-fill" 
                    style={{ 
                      height: `${height}%`,
                      background: level > 0 ? 'var(--accent-secondary)' : 'var(--accent-primary)'
                    }} 
                  />
                </div>
              </div>

              <div className="fader-area">
                <div className="tracks-mini-list">
                  {tracksOnChannel.map(t => (
                    <div 
                      key={t.id} 
                      className={`track-tag ${activeTrackId === t.id ? 'active' : ''}`}
                      onClick={() => setActiveTrack(t.id)}
                    >
                      {t.name.substring(0, 3)}
                    </div>
                  ))}
                </div>

                <div className="channel-fader-container">
                  <input 
                    type="range" 
                    min="-60" 
                    max="6" 
                    step="0.5"
                    value={mixerEngine.channels[i].volume.value}
                    onChange={(e) => {
                      mixerEngine.channels[i].volume.value = parseFloat(e.target.value);
                    }}
                    className="fader-vertical mini"
                  />
                </div>

                <div className="channel-controls">
                  <button 
                    className={`mixer-btn solo ${tracksOnChannel.some(t => t.synthSettings.soloed) ? 'active' : ''}`}
                    onClick={() => tracksOnChannel.forEach(t => toggleSolo(t.id))}
                  >S</button>
                  <button 
                    className={`mixer-btn mute ${tracksOnChannel.every(t => t.synthSettings.muted) ? 'active' : ''}`}
                    onClick={() => tracksOnChannel.forEach(t => toggleMute(t.id))}
                  >M</button>
                </div>
              </div>

              <div className="channel-id">CH {i + 1}</div>
            </div>
          );
        })}
      </div>
      
      <div className="mixer-sidebar">
        <h4>Track Assignment</h4>
        <div className="assignment-list">
          {project.tracks.map(track => (
            <div key={track.id} className="assignment-row">
              <span className="track-name">{track.name}</span>
              <select 
                value={track.mixerChannel}
                onChange={(e) => updateTrackMapping(track.id, { mixerChannel: parseInt(e.target.value) } as any)}
                className="mixer-select"
              >
                {[...Array(8)].map((_, i) => (
                  <option key={i} value={i}>Channel {i + 1}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
