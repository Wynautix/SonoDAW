import React from 'react';
import { useStore } from '../store/useStore';
import { Knob } from './Knob';
import { Activity, Wind, Waves, Disc, Repeat } from 'lucide-react';
import { ROOTS, ROOT_DISPLAY_NAMES, SCALES, ScaleMode } from '../audio/MusicConstants';
import './SynthEditor.css';

export const SynthEditor: React.FC = () => {
  const { project, activeTrackId, updateTrackSynth, updateTrackMapping } = useStore();
  const activeTrack = project.tracks.find(t => t.id === activeTrackId);

  if (!activeTrack) {
    return (
      <div className="synth-editor panel empty">
        <Disc size={48} className="icon-dim" />
        <p>Select a track to edit synthesizer settings</p>
      </div>
    );
  }

  const { synthSettings, mapping } = activeTrack;

  return (
    <div className="synth-editor panel">
      <header className="synth-header">
        <h3>{activeTrack.name} <span className="text-dim">Synthesizer</span></h3>
        <div className="osc-selector">
          {(['sine', 'square', 'sawtooth', 'triangle'] as const).map(type => (
            <button 
              key={type}
              className={synthSettings.oscillator === type ? 'active' : ''}
              onClick={() => updateTrackSynth(activeTrack.id, { oscillator: type })}
            >
              {type}
            </button>
          ))}
        </div>
      </header>

      <div className="editor-grid">
        {/* ENVELOPE */}
        <section className="editor-section">
          <div className="section-title"><Activity size={14} /> Envelope (ADSR)</div>
          <div className="knobs-row">
            <Knob 
              label="Attack" 
              value={synthSettings.adsr.attack} 
              min={0.001} max={2} 
              onChange={(v) => updateTrackSynth(activeTrack.id, { adsr: { ...synthSettings.adsr, attack: v } })} 
            />
            <Knob 
              label="Decay" 
              value={synthSettings.adsr.decay} 
              min={0.01} max={2} 
              onChange={(v) => updateTrackSynth(activeTrack.id, { adsr: { ...synthSettings.adsr, decay: v } })} 
            />
            <Knob 
              label="Sustain" 
              value={synthSettings.adsr.sustain} 
              min={0} max={1} 
              onChange={(v) => updateTrackSynth(activeTrack.id, { adsr: { ...synthSettings.adsr, sustain: v } })} 
            />
            <Knob 
              label="Release" 
              value={synthSettings.adsr.release} 
              min={0.01} max={4} 
              onChange={(v) => updateTrackSynth(activeTrack.id, { adsr: { ...synthSettings.adsr, release: v } })} 
            />
            <Knob 
              label="Gliss" 
              value={synthSettings.gliss || 0} 
              min={0} max={2} 
              onChange={(v) => updateTrackSynth(activeTrack.id, { gliss: v })} 
            />
          </div>
        </section>

        {/* FILTER */}
        <section className="editor-section">
          <div className="section-title"><Wind size={14} /> Filter</div>
          <div className="knobs-row">
            <Knob 
              label="Cutoff" 
              value={synthSettings.filter.frequency} 
              min={20} max={10000} 
              suffix="Hz"
              onChange={(v) => updateTrackSynth(activeTrack.id, { filter: { ...synthSettings.filter, frequency: v } })} 
            />
            <Knob 
              label="Res" 
              value={synthSettings.filter.resonance} 
              min={0} max={20} 
              onChange={(v) => updateTrackSynth(activeTrack.id, { filter: { ...synthSettings.filter, resonance: v } })} 
            />
          </div>
        </section>

        {/* LFO */}
        <section className="editor-section">
          <div className="section-title"><Waves size={14} /> LFO</div>
          <div className="knobs-row">
             <button 
              className={`toggle-btn ${synthSettings.lfo.enabled ? 'active' : ''}`}
              onClick={() => updateTrackSynth(activeTrack.id, { lfo: { ...synthSettings.lfo, enabled: !synthSettings.lfo.enabled } })}
            >
              {synthSettings.lfo.enabled ? 'ON' : 'OFF'}
            </button>
            <Knob 
              label="Rate" 
              value={synthSettings.lfo.frequency} 
              min={0.1} max={20} 
              suffix="Hz"
              onChange={(v) => updateTrackSynth(activeTrack.id, { lfo: { ...synthSettings.lfo, frequency: v } })} 
            />
            <Knob 
              label="Amount" 
              value={synthSettings.lfo.amount} 
              min={0} max={1000} 
              onChange={(v) => updateTrackSynth(activeTrack.id, { lfo: { ...synthSettings.lfo, amount: v } })} 
            />
          </div>
        </section>

        {/* ARPEGGIATOR */}
        <section className="editor-section arp-section">
          <div className="section-title"><Repeat size={14} /> Arpeggiator</div>
          <div className="knobs-row">
             <button 
              className={`toggle-btn ${synthSettings.arp?.enabled ? 'active' : ''}`}
              onClick={() => updateTrackSynth(activeTrack.id, { arp: { ...synthSettings.arp, enabled: !synthSettings.arp?.enabled } })}
            >
              {synthSettings.arp?.enabled ? 'ON' : 'OFF'}
            </button>
            <div className="input-group">
               <label>Chord</label>
               <select value={synthSettings.arp?.chord || 'maj'} onChange={e => updateTrackSynth(activeTrack.id, { arp: { ...synthSettings.arp, chord: e.target.value }})}>
                 <option value="maj">Major</option>
                 <option value="min">Minor</option>
                 <option value="maj7">Maj7</option>
                 <option value="min7">Min7</option>
                 <option value="dom7">Dom7</option>
                 <option value="sus4">Sus4</option>
                 <option value="dim">Dim</option>
                 <option value="aug">Aug</option>
               </select>
            </div>
            <div className="input-group">
               <label>Rate</label>
               <select value={synthSettings.arp?.rate || '16n'} onChange={e => updateTrackSynth(activeTrack.id, { arp: { ...synthSettings.arp, rate: e.target.value as any }})}>
                 <option value="8n">1/8</option>
                 <option value="16n">1/16</option>
                 <option value="32n">1/32</option>
                 <option value="64n">1/64</option>
               </select>
            </div>
            <div className="input-group">
               <label>Pattern</label>
               <select value={synthSettings.arp?.pattern || 'up'} onChange={e => updateTrackSynth(activeTrack.id, { arp: { ...synthSettings.arp, pattern: e.target.value as any }})}>
                 <option value="up">Up</option>
                 <option value="down">Down</option>
                 <option value="updown">Up & Down</option>
                 <option value="random">Random</option>
               </select>
            </div>
            <Knob 
              label="Octaves" 
              value={synthSettings.arp?.octaves || 1} 
              min={1} max={4} 
              onChange={(v) => updateTrackSynth(activeTrack.id, { arp: { ...synthSettings.arp, octaves: Math.round(v) } })} 
            />
          </div>
        </section>

        {/* MAPPING */}
        <section className="editor-section mapping-section">
          <div className="section-title">Data Mapping</div>
          <div className="mapping-controls">
            <div className="input-group">
              <label>Min Note</label>
              <input 
                type="text" 
                value={mapping.minNote} 
                onChange={(e) => updateTrackMapping(activeTrack.id, { minNote: e.target.value })} 
              />
            </div>
            <div className="input-group">
              <label>Max Note</label>
              <input 
                type="text" 
                value={mapping.maxNote} 
                onChange={(e) => updateTrackMapping(activeTrack.id, { maxNote: e.target.value })} 
              />
            </div>
            <div className="input-group">
              <label>Mapping Curve</label>
              <select 
                value={mapping.curve} 
                onChange={(e) => updateTrackMapping(activeTrack.id, { curve: e.target.value as any })}
                className="curve-select"
              >
                <option value="linear">Linear</option>
                <option value="square">Square (x²)</option>
                <option value="log">Logarithmic</option>
                <option value="exp">Exponential</option>
              </select>
            </div>
              <label className="tech-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={mapping.sustain} 
                  onChange={(e) => updateTrackMapping(activeTrack.id, { sustain: e.target.checked })} 
                />
                <span className="tech-checkbox-mark"></span>
                Sustain Identical
              </label>
              <label className="tech-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={mapping.binning} 
                  onChange={(e) => updateTrackMapping(activeTrack.id, { binning: e.target.checked })} 
                />
                <span className="tech-checkbox-mark"></span>
                Snap to Notes
              </label>
              <label className="tech-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={mapping.scaleOverrideEnabled || false} 
                  onChange={(e) => updateTrackMapping(activeTrack.id, { scaleOverrideEnabled: e.target.checked })} 
                />
                <span className="tech-checkbox-mark"></span>
                Tuning Override
              </label>
            
            {mapping.scaleOverrideEnabled && (
                <div className="input-group" style={{ flexDirection: 'row', gap: '8px', gridColumn: '1 / -1' }}>
                  <select 
                    value={mapping.rootOverride || 'C'} 
                    onChange={(e) => updateTrackMapping(activeTrack.id, { rootOverride: e.target.value })}
                  >
                    {ROOTS.map(root => (
                      <option key={root} value={root}>{ROOT_DISPLAY_NAMES[root] || root}</option>
                    ))}
                  </select>
                  <select 
                    value={mapping.modeOverride || 'major'} 
                    onChange={(e) => updateTrackMapping(activeTrack.id, { modeOverride: e.target.value as ScaleMode })}
                  >
                    {Object.keys(SCALES).map(mode => (
                      <option key={mode} value={mode}>{mode.charAt(0).toUpperCase() + mode.slice(1).replace(/([A-Z])/g, ' $1')}</option>
                    ))}
                  </select>
                </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
