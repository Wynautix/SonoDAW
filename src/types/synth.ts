import { ScaleMode } from '../audio/MusicConstants';

export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface ArpSettings {
  enabled: boolean;
  pattern: 'up' | 'down' | 'updown' | 'random';
  rate: '8n' | '16n' | '32n' | '64n';
  chord: string;
  octaves: number;
}
export interface ADSRSettings {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface FilterSettings {
  frequency: number;
  resonance: number;
  type: 'lowpass' | 'highpass' | 'bandpass';
}

export interface LFOSettings {
  enabled: boolean;
  frequency: number;
  amount: number;
  target: 'pitch' | 'filter';
}

export interface SynthSettings {
  id: string;
  name: string;
  oscillator: OscillatorType;
  adsr: ADSRSettings;
  filter: FilterSettings;
  lfo: LFOSettings;
  arp: ArpSettings;
  gliss: number;
  volume: number;
  muted: boolean;
  soloed: boolean;
}

export interface ColumnMapping {
  columnName: string;
  synthId: string;
  active: boolean;
  minVal: number;
  maxVal: number;
  minNote: string;
  maxNote: string;
  binning: boolean;
  sustain: boolean;
  curve: 'linear' | 'square' | 'log' | 'exp';
  scaleOverrideEnabled: boolean;
  rootOverride: string;
  modeOverride: ScaleMode;
}

export type EffectType = 'Limiter' | 'Delay' | 'Reverb' | 'Phaser' | 'Tremolo' | 'EQ' | 'HPF' | 'LPF' | 'Notch' | 'Bitcrusher';

export interface EffectSettings {
  id: string;
  type: EffectType;
  enabled: boolean;
  params: Record<string, number | string | boolean>;
}

