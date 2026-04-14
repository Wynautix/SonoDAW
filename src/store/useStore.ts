import { create } from 'zustand';
import { Project, Track, PanelConfig } from '../types/project';
import { SynthSettings, ColumnMapping, EffectSettings, EffectType } from '../types/synth';
import { ScaleMode } from '../audio/MusicConstants';
import * as Tone from 'tone';
import Papa from 'papaparse';
import { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import defaultProject from '../data/defaultProject.json';

interface AppState {
  project: Project;
  csvData: any[] | null;
  headers: string[];
  virtualHeaders: string[];
  columnStats: Record<string, { min: number; max: number; mean: number }>;
  isPlaying: boolean;
  activeTrackId: string | null;
  selectedMixerChannel: number | null; // Selected channel index for FX view
  activeEffectId: string | null; // Selected effect ID for VST editor
  viewMode: '3d' | 'synth' | 'data' | 'analytics' | 'nodes' | 'mixer' | 'rack';
  currentRow: number;
  activeNotes: Record<string, string | null>; // TrackID -> NoteName
  
  // Node Editor State
  nodes: Node[];
  edges: Edge[];
  
  // Visualization Builder
  vizConfig: {
    mode: '2d' | '3d',
    xAxis: string,
    yAxis: string,
    zAxis: string,
    colorAxis: string,
    sizeAxis: string,
    colorScale: 'temp' | 'plasma' | 'neon' | 'spectral' | 'blackbody' | 'hr_diagram',
    colorMode: 'scale' | 'intervals',
    colorRules: Array<{ id: string; type: 'range' | 'discrete'; min?: number; max?: number; value?: any; color: string }>;
    invertColor: boolean,
    invertX: boolean,
    invertY: boolean,
    invertZ: boolean,
    logX: boolean,
    logY: boolean,
    logZ: boolean,
    logSize: boolean,
    invertSize: boolean,
    pointShader: 'glow' | 'streamer' | 'hex',
    dotShape: 'circle' | 'square' | 'star' | 'cross',
    brightnessAxis: string,
    logBrightness: boolean,
    invertBrightness: boolean,
    minBrightness: number,
    maxBrightness: number,
    animatePlayhead: boolean,
    cameraMode: 'perspective' | 'ortho',
    navigationMode: 'orbit' | 'fly',
    showOrigin: boolean,
    showSelector: boolean,
    sustainLegato: boolean,
    showGrid: boolean,
    inspectorColumns: string[],
  };

  gridConfig: {
    barMode: 'solid' | 'gradient' | 'rainbow',
    idleGradient: [string, string],
    highlightGradient: [string, string],
    showBackground: boolean,
    backgroundOpacity: number,
    zoom: number,
    autoScroll: boolean,
  };
  
  // New Features State
  sortSettings: { criteria: Array<{ column: string; direction: 'asc' | 'desc' }> };
  scaleSettings: { root: string; mode: ScaleMode };
  formulas: Record<string, string>;
  runtimeOutputs: {
    viz: any;
    synths: Record<string, any>;
  };
  notifications: Array<{ id: string; message: string; type: 'info' | 'success' | 'error' }>;

  // Actions
  setCsvData: (data: any[], headers: string[], columnStats: Record<string, any>) => void;
  updateTrackSynth: (trackId: string, settings: Partial<SynthSettings>) => void;
  updateTrackMapping: (trackId: string, mapping: Partial<ColumnMapping>) => void;
  togglePlayback: () => void;
  setActiveTrack: (id: string | null) => void;
  setSort: (column: string | null, multi?: boolean) => void;
  setScale: (scale: Partial<{ root: string; mode: ScaleMode }>) => void;
  updateFormula: (name: string, formula: string) => void;
  removeFormula: (name: string) => void;
  updateVizConfig: (config: Partial<AppState['vizConfig']>) => void;
  addColorRule: (rule: Omit<AppState['vizConfig']['colorRules'][0], 'id'>) => void;
  removeColorRule: (id: string) => void;
  updateColorRule: (id: string, rule: Partial<AppState['vizConfig']['colorRules'][0]>) => void;
  setCurrentRow: (row: number) => void;
  setActiveNotes: (notes: Record<string, string | null>) => void;
  addTrack: (columnName: string) => void;
  removeTrack: (id: string) => void;
  toggleMute: (trackId: string) => void;
  toggleSolo: (trackId: string) => void;
  updateVelocity: (trackId: string, index: number, value: number) => void;
  resetVelocities: (trackId: string) => void;

  // React Flow Actions
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setRuntimeOutputs: (outputs: AppState['runtimeOutputs']) => void;

  // New Modular Actions
  addEffect: (channelIndex: number | 'master', type: EffectType) => void;
  removeEffect: (channelIndex: number | 'master', effectId: string) => void;
  updateEffectParam: (effectId: string, params: any) => void;
  setSelectedMixerChannel: (index: number | null) => void;
  setActiveEffect: (id: string | null) => void;
  updateLayout: (layout: PanelConfig[]) => void;
  togglePanel: (panelId: string) => void;
  setTheme: (theme: string) => void;
  addNotification: (message: string, type?: 'info' | 'success' | 'error') => void;
  removeNotification: (id: string) => void;
  updateProject: (project: Partial<Project>) => void;
  setViewMode: (mode: AppState['viewMode']) => void;
  updateGridConfig: (config: Partial<AppState['gridConfig']>) => void;
}

export const useStore = create<AppState>((set, get) => ({
  project: (defaultProject as any).project,
  csvData: (defaultProject as any).csvData,
  headers: (defaultProject as any).headers,
  virtualHeaders: (defaultProject as any).virtualHeaders || [],
  columnStats: (defaultProject as any).columnStats || {},
  isPlaying: false,
  activeTrackId: (defaultProject as any).activeTrackId || null,
  selectedMixerChannel: null,
  activeEffectId: null,
  viewMode: 'analytics',
  currentRow: 0,
  activeNotes: {},
  sortSettings: { criteria: [] },
  scaleSettings: (defaultProject as any).scaleSettings || { root: 'C', mode: 'major' },
  formulas: (defaultProject as any).formulas || {},
  runtimeOutputs: { viz: {}, synths: {} },

  nodes: (defaultProject as any).nodes || [],
  edges: (defaultProject as any).edges || [],
  notifications: [],

  addNotification: (message, type = 'info') => set((state) => {
    const id = Math.random().toString(36).substr(2, 9);
    // Auto-remove after 5s
    setTimeout(() => {
        get().removeNotification(id);
    }, 5000);
    return { notifications: [...state.notifications, { id, message, type }] };
  }),

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  vizConfig: {
    mode: '3d',
    xAxis: '', yAxis: '', zAxis: '',
    colorAxis: '', sizeAxis: '',
    colorScale: 'plasma', colorMode: 'scale',
    colorRules: [], invertColor: false,
    invertX: false, invertY: false, invertZ: false,
    logX: false, logY: false, logZ: false,
    logSize: false, invertSize: false,
    pointShader: 'glow', dotShape: 'circle',
    brightnessAxis: '', logBrightness: false,
    invertBrightness: false, minBrightness: 0.1,
    maxBrightness: 1.0, animatePlayhead: true,
    cameraMode: 'perspective', navigationMode: 'orbit',
    showOrigin: true, showSelector: true,
    sustainLegato: false, showGrid: true,
    inspectorColumns: [],
    ...(defaultProject as any).vizConfig
  },

  gridConfig: {
    barMode: 'rainbow',
    idleGradient: ['#00f2ff', '#0066ff'],
    highlightGradient: ['#fff', '#00f2ff'],
    showBackground: true,
    backgroundOpacity: 0.1,
    zoom: 1.0,
    autoScroll: true,
  },

  setCsvData: (data, headers, stats) => set((state) => {
    let combinedData = data.map(row => ({ ...row }));
    
    // Apply existing formulas to new data
    Object.entries(state.formulas).forEach(([name, formula]) => {
      combinedData = combinedData.map(row => {
        try {
          const keys = Object.keys(row);
          const values = Object.values(row);
          // Use .apply pattern if spread is causing issues in some build environments
          const args = keys.concat([`return ${formula}`]);
          const fn = new (Function as any)(...args);
          const result = fn.apply(null, values);
          return { ...row, [name]: result };
        } catch (e) {
          console.error(`Error calculating virtual column ${name}:`, e);
          return { ...row, [name]: 0 };
        }
      });
    });

    return { 
      csvData: combinedData, 
      headers, 
      columnStats: stats 
    };
  }),

  updateTrackSynth: (trackId, settings) => set((state) => ({
    project: {
      ...state.project,
      tracks: state.project.tracks.map(t => 
        t.id === trackId ? { ...t, synthSettings: { ...t.synthSettings, ...settings } } : t
      )
    }
  })),

  updateTrackMapping: (trackId, mapping) => set((state) => ({
    project: {
      ...state.project,
      tracks: state.project.tracks.map(t => 
        t.id === trackId ? { ...t, mapping: { ...t.mapping, ...mapping } } : t
      )
    }
  })),

  togglePlayback: () => set((state) => {
    if (!state.isPlaying) {
      Tone.start();
      Tone.Transport.start();
    } else {
      Tone.Transport.pause();
    }
    return { isPlaying: !state.isPlaying };
  }),

  setActiveTrack: (id) => set({ activeTrackId: id }),

  setSort: (columnName, multi = false) => set((state) => {
    if (!columnName) return { sortSettings: { criteria: [] } };

    let newCriteria = [...state.sortSettings.criteria];
    const existingIndex = newCriteria.findIndex(c => c.column === columnName);

    if (multi) {
      if (existingIndex > -1) {
        // Toggle direction
        newCriteria[existingIndex] = {
          ...newCriteria[existingIndex],
          direction: newCriteria[existingIndex].direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        // Add new criteria
        newCriteria.push({ column: columnName, direction: 'asc' });
      }
    } else {
      // Single column sort
      const direction = (existingIndex > -1 && newCriteria.length === 1 && newCriteria[0].direction === 'asc') ? 'desc' : 'asc';
      newCriteria = [{ column: columnName, direction }];
    }

    // Perform multi-column sort
    const sortedData = [...(state.csvData || [])].sort((a, b) => {
      for (const criterion of newCriteria) {
        const valA = a[criterion.column];
        const valB = b[criterion.column];
        
        if (valA === valB) continue;

        const comparison = valA > valB ? 1 : -1;
        return criterion.direction === 'asc' ? comparison : -comparison;
      }
      return 0;
    });

    return { 
      sortSettings: { criteria: newCriteria },
      csvData: sortedData
    };
  }),

  setScale: (scale) => set((state) => ({
    scaleSettings: { ...state.scaleSettings, ...scale }
  })),

  updateFormula: (name, formula) => set((state) => {
    const newFormulas = { ...state.formulas, [name]: formula };
    const updatedData = state.csvData?.map(row => {
      try {
        const keys = Object.keys(row);
        const values = Object.values(row);
        const args = keys.concat([`return ${formula}`]);
        const fn = new (Function as any)(...args);
        const result = fn.apply(null, values);
        return { ...row, [name]: result };
      } catch (e) {
        console.error(`Error calculating virtual column ${name}:`, e);
        return { ...row, [name]: 0 };
      }
    });

    const virtualHeaders = Object.keys(newFormulas);

    return { 
      formulas: newFormulas, 
      csvData: updatedData || null,
      virtualHeaders 
    };
  }),

  removeFormula: (name) => set((state) => {
    const { [name]: _, ...remaining } = state.formulas;
    const updatedData = state.csvData?.map(row => {
      const { [name]: __, ...rest } = row;
      return rest;
    });
    return { 
      formulas: remaining, 
      csvData: updatedData || null,
      virtualHeaders: Object.keys(remaining)
    };
  }),

  setViewMode: (mode) => set({ viewMode: mode }),
  
  updateVizConfig: (config) => set((state) => ({ 
    vizConfig: { ...state.vizConfig, ...config } 
  })),

  updateGridConfig: (config) => set((state) => ({ 
    gridConfig: { ...state.gridConfig, ...config } 
  })),

  setActiveNotes: (notes) => set((state) => ({ 
    activeNotes: { ...state.activeNotes, ...notes } 
  })),

  addColorRule: (rule) => set((state) => ({
    vizConfig: {
      ...state.vizConfig,
      colorRules: [...state.vizConfig.colorRules, { ...rule, id: Math.random().toString(36).substring(7) }]
    }
  })),

  removeColorRule: (id) => set((state) => ({
    vizConfig: {
      ...state.vizConfig,
      colorRules: state.vizConfig.colorRules.filter(r => r.id !== id)
    }
  })),

  updateColorRule: (id, rule) => set((state) => ({
    vizConfig: {
      ...state.vizConfig,
      colorRules: state.vizConfig.colorRules.map(r => r.id === id ? { ...r, ...rule } : r)
    }
  })),

  setCurrentRow: (row) => set({ currentRow: row }),

  addTrack: (columnName) => set((state) => {
    const id = Math.random().toString(36).substring(7);
    const stats = state.columnStats[columnName] || { min: 0, max: 100 };
    const newTrack: Track = {
      id,
      name: columnName,
      mixerChannel: 0,
      velocities: new Array(state.csvData?.length || 0).fill(0.8),
      synthSettings: {
        id: `synth-${id}`,
        name: `Synth for ${columnName}`,
        oscillator: 'sine',
        adsr: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1 },
        filter: { frequency: 1000, resonance: 1, type: 'lowpass' },
        lfo: { enabled: false, frequency: 1, amount: 0, target: 'filter' },
        arp: { enabled: false, pattern: 'up', rate: '16n', chord: 'maj', octaves: 1 },
        gliss: 0,
        volume: -12,
        muted: false,
        soloed: false
      },
      mapping: {
        columnName,
        synthId: `synth-${id}`,
        active: true,
        minVal: stats.min,
        maxVal: stats.max,
        minNote: 'C3',
        maxNote: 'C5',
        binning: false,
        sustain: false,
        curve: 'linear',
        scaleOverrideEnabled: false,
        rootOverride: 'C',
        modeOverride: 'major'
      }
    };
    return {
      project: {
        ...state.project,
        tracks: [...state.project.tracks, newTrack]
      }
    };
  }),

  removeTrack: (id) => set((state) => ({
    project: {
      ...state.project,
      tracks: state.project.tracks.filter(t => t.id !== id)
    }
  })),

  toggleMute: (trackId) => set((state) => ({
    project: {
      ...state.project,
      tracks: state.project.tracks.map(t =>
        t.id === trackId ? { ...t, synthSettings: { ...t.synthSettings, muted: !t.synthSettings.muted } } : t
      )
    }
  })),

  toggleSolo: (trackId) => set((state) => {
    const isSoloed = state.project.tracks.find(t => t.id === trackId)?.synthSettings.soloed;
    return {
      project: {
        ...state.project,
        tracks: state.project.tracks.map(t => ({
          ...t,
          synthSettings: { ...t.synthSettings, soloed: t.id === trackId ? !isSoloed : false }
        }))
      }
    };
  }),

  updateVelocity: (trackId, index, value) => set((state) => ({
    project: {
      ...state.project,
      tracks: state.project.tracks.map(t => {
        if (t.id === trackId) {
          const newVels = [...t.velocities];
          newVels[index] = value;
          return { ...t, velocities: newVels };
        }
        return t;
      })
    }
  })),

  resetVelocities: (trackId) => set((state) => ({
    project: {
      ...state.project,
      tracks: state.project.tracks.map(t =>
        t.id === trackId ? { ...t, velocities: new Array(state.csvData?.length || 0).fill(0.8) } : t
      )
    }
  })),

  onNodesChange: (changes) => set((state) => ({
    nodes: applyNodeChanges(changes, state.nodes),
  })),
  onEdgesChange: (changes) => set((state) => ({
    edges: applyEdgeChanges(changes, state.edges),
  })),
  onConnect: (connection) => set((state) => ({
    edges: addEdge(connection, state.edges),
  })),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setRuntimeOutputs: (outputs) => set({ runtimeOutputs: outputs }),

  addEffect: (channelIndex, type) => set((state) => {
    const id = `fx-${Math.random().toString(36).substring(7)}`;
    const newEffect: EffectSettings = {
      id,
      type,
      enabled: true,
      params: getDefaultParams(type)
    };
    
    const chains = { ...state.project.mixerEffectChains };
    if (channelIndex === 'master') {
      return {
        project: {
          ...state.project,
          masterEffectChain: [...state.project.masterEffectChain, newEffect]
        }
      };
    } else {
      const channelIdx = channelIndex as number;
      chains[channelIdx] = [...(chains[channelIdx] || []), newEffect];
      return {
        project: { ...state.project, mixerEffectChains: chains }
      };
    }
  }),

  removeEffect: (channelIndex, effectId) => set((state) => {
    if (channelIndex === 'master') {
      return {
        project: {
          ...state.project,
          masterEffectChain: state.project.masterEffectChain.filter(fx => fx.id !== effectId)
        }
      };
    } else {
      const chains = { ...state.project.mixerEffectChains };
      const channelIdx = channelIndex as number;
      chains[channelIdx] = chains[channelIdx].filter(fx => fx.id !== effectId);
      return {
        project: { ...state.project, mixerEffectChains: chains }
      };
    }
  }),

  updateEffectParam: (effectId, params) => set((state) => ({
    project: {
      ...state.project,
      mixerEffectChains: Object.fromEntries(
        Object.entries(state.project.mixerEffectChains).map(([idx, chain]) => [
          idx,
          chain.map(fx => fx.id === effectId ? { ...fx, params: { ...fx.params, ...params } } : fx)
        ])
      ),
      masterEffectChain: state.project.masterEffectChain.map(fx => 
        fx.id === effectId ? { ...fx, params: { ...fx.params, ...params } } : fx
      )
    }
  })),

  setSelectedMixerChannel: (index) => set({ selectedMixerChannel: index }),
  setActiveEffect: (id) => set({ activeEffectId: id }),
  updateLayout: (layout) => set((state) => ({
    project: { ...state.project, layout }
  })),
  togglePanel: (id) => set((state) => ({
    project: {
      ...state.project,
      layout: state.project.layout.map(p => p.id === id ? { ...p, visible: !p.visible } : p)
    }
  })),
  setTheme: (theme) => set((state) => ({
    project: { ...state.project, theme }
  })),
  updateProject: (updates) => set((state) => ({
    project: { ...state.project, ...updates }
  })),
}));

function getDefaultParams(type: EffectType): any {
  switch (type) {
    case 'Reverb': return { roomSize: 0.7, dampening: 3000, wet: 0.5 };
    case 'Delay': return { delayTime: '8n', feedback: 0.5, wet: 0.3 };
    case 'Limiter': return { threshold: -12 };
    case 'Bitcrusher': return { bits: 4, wet: 0.5 };
    case 'EQ': return { low: 0, mid: 0, high: 0 };
    case 'Phaser': return { frequency: 0.5, octaves: 3, baseFrequency: 350 };
    case 'Tremolo': return { frequency: 10, depth: 0.5 };
    case 'HPF': return { frequency: 1000, Q: 1 };
    case 'LPF': return { frequency: 1000, Q: 1 };
    case 'Notch': return { frequency: 1000, Q: 10 };
    default: return {};
  }
}

