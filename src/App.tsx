import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStore } from './store/useStore';
import { CsvProcessor } from './data/CsvProcessor';
import { Synthesizer } from './audio/Synthesizer';
import { MappingEngine } from './data/MappingEngine';
import { FlowEngine } from './data/FlowEngine';
import { mixerEngine } from './audio/MixerEngine';
import { Navbar } from './components/Navbar';
import { LayoutManager } from './components/LayoutManager';
import { Visualization } from './components/Visualization';
import { DataGrid } from './components/DataGrid';
import { AnalyticsView } from './components/AnalyticsView';
import { NodeEditor } from './components/NodeEditor';
import { Mixer } from './components/Mixer';
import { SynthRack } from './components/SynthRack';
import { Knob } from './components/Knob';
import { Toast } from './components/Toast';
import { DropOverlay } from './components/DropOverlay';
import { GlobalSettings } from './components/GlobalSettings';
import { CustomCursor } from './components/CustomCursor';
import { importProject } from './utils/export/projectExport';
import { 
  Upload, Play, Square, Database, Music, 
  ArrowUp, ArrowDown, ChevronRight, LayoutGrid, Box, Sliders, BarChart3,
  GitGraph, Table as TableIcon, Activity
} from 'lucide-react';
import * as Tone from 'tone';
import './App.css';
import './styles/themes.css';

const App: React.FC = () => {
  const { 
    project, csvData, setCsvData, addTrack, 
    isPlaying, togglePlayback,
    scaleSettings,
    viewMode, currentRow, setCurrentRow,
    nodes, edges, columnStats, setRuntimeOutputs, vizConfig, setActiveNotes,
    updateMasterVolume
  } = useStore();
  
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.sndw') || file.name.endsWith('.sonodaw'))) {
      await importProject(file);
    }
  };

  const synthsRef = useRef<Record<string, Synthesizer>>({});
  (window as any).__SYNTHS__ = synthsRef.current;
  const currentRowRef = useRef(0);
  const lastNotesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    project.tracks.forEach(track => {
      if (!synthsRef.current[track.id]) {
        const synth = new Synthesizer(track.synthSettings);
        synth.connectToMixer(track.mixerChannel);
        synthsRef.current[track.id] = synth;
      } else {
        synthsRef.current[track.id].updateSettings(track.synthSettings);
        synthsRef.current[track.id].connectToMixer(track.mixerChannel);
      }
    });

    Object.keys(synthsRef.current).forEach(id => {
      if (!project.tracks.find(t => t.id === id)) {
        synthsRef.current[id].dispose();
        delete synthsRef.current[id];
      }
    });
  }, [project.tracks]);

  useEffect(() => {
    currentRowRef.current = currentRow;
  }, [currentRow]);

  useEffect(() => {
    mixerEngine.updateChains(project.mixerEffectChains, project.masterEffectChain);
  }, [project.mixerEffectChains, project.masterEffectChain]);

  useEffect(() => {
    Tone.Transport.cancel();
    
    if (isPlaying && csvData && csvData.length > 0) {
      const loop = new Tone.Loop((time) => {
        const index = isNaN(currentRowRef.current) ? 0 : currentRowRef.current % csvData.length;
        const row = csvData[index];
        if (!row) return;
        
        const flowResults = FlowEngine.evaluate(nodes, edges, row, columnStats);
        const newActiveNotes: Record<string, string | null> = {};
        
        project.tracks.forEach(track => {
          const synth = synthsRef.current[track.id];
          if (!synth) return;

          const nodeOutput = flowResults.synths[track.id];
          let note: string;
          
          const effectiveScale = track.mapping.scaleOverrideEnabled 
             ? { root: track.mapping.rootOverride, mode: track.mapping.modeOverride }
             : scaleSettings;

          if (nodeOutput && nodeOutput.pitch !== null) {
            note = MappingEngine.valueToNote(nodeOutput.pitch, track.mapping, effectiveScale);
            if (nodeOutput.cutoff !== null) {
              synth.updateSettings({ 
                ...track.synthSettings, 
                filter: { ...track.synthSettings.filter, frequency: nodeOutput.cutoff } 
              });
            }
            if (nodeOutput.volume !== null) {
              synth.updateVolume(nodeOutput.volume);
            }
          } else {
            const val = row[track.name];
            if (typeof val === 'number') {
              note = MappingEngine.valueToNote(val, track.mapping, effectiveScale);
            } else {
              return;
            }
          }

          const velocity = track.velocities[index] ?? 0.8;
          const isNoteSame = note === lastNotesRef.current[track.id];
          const shouldSustain = (track.mapping.sustain || vizConfig.sustainLegato) && isNoteSame;
          
          const arp = track.synthSettings.arp;
          if (arp && arp.enabled) {
            const lastNote = lastNotesRef.current[track.id];
            if (lastNote) {
               synth.triggerRelease(lastNote, time);
               lastNotesRef.current[track.id] = "";
            }

            const getChordNotes = (root: string, type: string, octaves: number) => {
               const intervals: Record<string, number[]> = {
                 'maj': [0, 4, 7], 'min': [0, 3, 7], 'maj7': [0, 4, 7, 11], 'min7': [0, 3, 7, 10],
                 'dom7': [0, 4, 7, 10], 'sus4': [0, 5, 7], 'dim': [0, 3, 6], 'aug': [0, 4, 8]
               };
               const ivs = intervals[type] || [0, 4, 7];
               const rootFreq = Tone.Frequency(root).toMidi();
               const notes: string[] = [];
               for (let oct = 0; oct < octaves; oct++) {
                  ivs.forEach(interval => {
                      notes.push(Tone.Frequency(rootFreq + interval + (oct * 12), "midi").toNote());
                  });
               }
               return notes;
            };

            const sequence = getChordNotes(note, arp.chord, arp.octaves || 1);
            if (arp.pattern === 'down') sequence.reverse();
            if (arp.pattern === 'updown') { sequence.push(...[...sequence].reverse().slice(1, -1)); }
            if (arp.pattern === 'random') sequence.sort(() => Math.random() - 0.5);

            const arpNoteDur = Tone.Time(arp.rate).toSeconds();
            const stepDur = Tone.Time('8n').toSeconds();
            const numNotes = Math.max(1, Math.floor(stepDur / arpNoteDur));

            for (let i = 0; i < numNotes; i++) {
               const arpNote = sequence[(i + (currentRowRef.current * numNotes)) % sequence.length];
               const startTime = time + (i * arpNoteDur);
               synth.triggerAttackRelease(arpNote, arpNoteDur * 0.9, startTime, velocity);
               if (i === 0) newActiveNotes[track.id] = arpNote;
            }
          } else {
            const lastNote = lastNotesRef.current[track.id];
            if (shouldSustain) {
              newActiveNotes[track.id] = note;
            } else {
              if (lastNote) {
                synth.triggerRelease(lastNote, time);
              }
              synth.triggerAttack(note, time, velocity);
              lastNotesRef.current[track.id] = note;
              newActiveNotes[track.id] = note;
            }
          }
        });

        setActiveNotes(newActiveNotes);
        setRuntimeOutputs(flowResults);

        currentRowRef.current++;
        setCurrentRow(currentRowRef.current % csvData.length);
      }, "8n").start(0);
      
      Tone.Transport.bpm.value = project.bpm;
    }

    return () => { 
      Tone.Transport.cancel();
      // Stop all synths on cleanup
      Object.values(synthsRef.current).forEach(s => s.synth.releaseAll());
    };
  }, [isPlaying, csvData, project.tracks, project.bpm, scaleSettings, nodes, edges, columnStats]);

  // Default Data Loader
  useEffect(() => {
    if (!csvData) {
      const loadDefault = async () => {
        try {
          const response = await fetch('/stars.csv');
          const blob = await response.blob();
          const file = new File([blob], 'stars.csv', { type: 'text/csv' });
          const { rows, headers: fetchedHeaders, columnStats: fetchedStats } = await CsvProcessor.parse(file);
          setCsvData(rows, fetchedHeaders, fetchedStats);
        } catch (e) {
          console.log('No default data found yet.');
        }
      };
      loadDefault();
    }
  }, []);

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { rows, headers, columnStats } = await CsvProcessor.parse(file);
      setCsvData(rows, headers, columnStats);
      
      // Auto-add first column as a track if none exists
      if (project.tracks.length === 0 && headers.length > 0) {
        addTrack(headers[0]);
      }
    }
  };

  const handleStart = async () => {
    await Tone.start();
    togglePlayback();
  };

  const isCrtTheme = project.theme === 'pipboy' || project.theme === 'hacker-green' || project.theme === 'hacker-blue';

  return (
    <div 
        className={`daw-layout theme-${project.theme} ${isCrtTheme ? 'fx-crt' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      <CustomCursor />
      <DropOverlay isVisible={isDragging} />
      {isCrtTheme && <div className="fx-scanline" />}
      
      <Navbar />
      <Toast />
      
      <main className="content-area">
        {viewMode === 'rack' || viewMode === 'mixer' ? (
          <LayoutManager />
        ) : viewMode === '3d' ? (
          <AnalyticsView renderOnly />
        ) : viewMode === 'data' ? (
          <DataGrid />
        ) : viewMode === 'nodes' ? (
          <NodeEditor />
        ) : viewMode === 'analytics' ? (
          <AnalyticsView />
        ) : (
          <LayoutManager />
        )}
      </main>
      

      <div className="transport-playbar">
        <button 
          className={`transport-btn ${isPlaying ? 'playing' : ''}`}
          onClick={handleStart}
        >
          {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
        
        <div className="playbar-stats">
          <div className="bpm-display">
            <span className="label">BPM</span>
            <input 
              type="number" 
              value={project.bpm} 
              onChange={(e) => useStore.getState().updateProject({ bpm: parseInt(e.target.value) })}
            />
          </div>

          <div className="row-display">
            <span className="label">ROW</span>
            <span className="value">{currentRow}</span>
          </div>

          <div className="master-vol-box">
             <Knob 
                label="MASTER" 
                value={project.masterVolume} 
                min={0} max={1.5} 
                onChange={updateMasterVolume}
                color="var(--accent-primary)"
             />
          </div>
        </div>

        <GlobalSettings />

        <div className="playbar-right">
          <label className="upload-btn">
            <Upload size={16} /> LOAD CSV
            <input type="file" accept=".csv" onChange={onFileUpload} hidden />
          </label>
        </div>
      </div>

      <footer className="status-bar">
        <div className="status-item">Engine: {Tone.context.state}</div>
        <div className="status-item">Mixer: 8 Ch + Master</div>
        <div className="status-item">CSV: {csvData?.length || 0} rows</div>
        <div className="status-item" style={{ marginLeft: 'auto', opacity: 0.5 }}>Build: 2026-04-13.v1.5.0-STABLE</div>
      </footer>

      {/* Extreme CRT Filters */}
      <svg className="svg-overlay" style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          <filter id="pipboyCurve">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
          <filter id="chromaticAberration">
            <feComponentTransfer in="SourceGraphic" result="red">
              <feFuncR type="linear" slope="1" intercept="0" />
              <feFuncG type="linear" slope="0" intercept="0" />
              <feFuncB type="linear" slope="0" intercept="0" />
            </feComponentTransfer>
            <feOffset in="red" dx="1.5" dy="0" result="redOffset" />
            <feComponentTransfer in="SourceGraphic" result="blue">
              <feFuncR type="linear" slope="0" intercept="0" />
              <feFuncG type="linear" slope="0" intercept="0" />
              <feFuncB type="linear" slope="1" intercept="0" />
            </feComponentTransfer>
            <feOffset in="blue" dx="-1.5" dy="0" result="blueOffset" />
            <feBlend in="redOffset" in2="blueOffset" mode="screen" result="colorShift" />
            <feBlend in="colorShift" in2="SourceGraphic" mode="screen" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

export default App;
