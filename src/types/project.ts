import { SynthSettings, ColumnMapping, EffectSettings } from './synth';

export interface Track {
  id: string;
  name: string;
  synthSettings: SynthSettings;
  mapping: ColumnMapping;
  mixerChannel: number;
  velocities: number[];
  volume: number;
  pan: number;
}

export interface PanelConfig {
  id: string;
  type: string;
  visible: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  pinned: boolean;
}

export interface Project {
  name: string;
  tracks: Track[];
  bpm: number;
  mixerEffectChains: Record<number, EffectSettings[]>;
  masterEffectChain: EffectSettings[];
  masterVolume: number;
  layout: PanelConfig[];
  theme: string;
}
