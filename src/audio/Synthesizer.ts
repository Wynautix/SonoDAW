import * as Tone from 'tone';
import { SynthSettings } from '../types/synth';
import { mixerEngine } from './MixerEngine';

export class Synthesizer {
  public synth: Tone.PolySynth;
  public filter: Tone.Filter;
  public lfo: Tone.LFO;
  public lfoGain: Tone.Gain;
  public waveform: Tone.Waveform;
  public settings: SynthSettings;

  constructor(settings: SynthSettings) {
    this.settings = settings;

    // 1. Initialize Components
    this.filter = new Tone.Filter({
      frequency: settings.filter.frequency,
      Q: settings.filter.resonance,
      type: settings.filter.type,
    });

    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: settings.oscillator },
      envelope: settings.adsr,
      portamento: settings.gliss || 0,
    });

    this.lfo = new Tone.LFO({
      frequency: settings.lfo.frequency,
      min: -settings.lfo.amount,
      max: settings.lfo.amount,
    });

    this.lfoGain = new Tone.Gain(0);
    this.waveform = new Tone.Waveform(64);

    // 2. Routing
    // Synth -> Filter -> Mixer Channel
    this.synth.connect(this.filter);
    this.filter.connect(this.waveform);
    
    // LFO Routing
    if (settings.lfo.enabled) {
      this.setupLFO();
    }

    this.updateVolume(settings.volume);
  }

  private setupLFO() {
    this.lfo.stop();
    this.lfo.disconnect();
    
    if (this.settings.lfo.target === 'pitch') {
      // Connect to the detune parameter for pitch modulation
      this.lfo.connect((this.synth as any).detune); 
    } else {
      this.lfo.connect(this.filter.frequency);
    }
    
    if (this.settings.lfo.enabled) {
      this.lfo.start();
    }
  }

  public triggerAttack(note: string, time?: number, velocity?: number) {
    this.synth.triggerAttack(note, time, velocity);
  }

  public triggerRelease(note: string, time?: number) {
    this.synth.triggerRelease(note, time);
  }

  public triggerAttackRelease(note: string, duration: string | number, time?: number, velocity?: number) {
    this.synth.triggerAttackRelease(note, duration, time, velocity);
  }

  public updateSettings(settings: SynthSettings) {
    this.settings = settings;
    
    // Update Oscillator
    this.synth.set({
      oscillator: { type: settings.oscillator },
      envelope: settings.adsr,
      portamento: settings.gliss || 0,
    });

    // Update Filter
    this.filter.set({
      frequency: settings.filter.frequency,
      Q: settings.filter.resonance,
      type: settings.filter.type,
    });

    // Update LFO
    this.lfo.set({
      frequency: settings.lfo.frequency,
    });
    
    if (settings.lfo.enabled) {
      this.setupLFO();
    } else {
      this.lfo.stop();
    }

    // Apply Mute/Solo logic to volume
    this.updateVolume(settings.volume);
  }

  public updateVolume(volume: number) {
    if (typeof volume !== 'number' || isNaN(volume)) return;
    
    let finalVolume = volume;
    if (this.settings.muted) {
      finalVolume = -100; // Unity mute
    }
    
    // Smoothly transition volume
    this.synth.volume.rampTo(finalVolume, 0.1);
  }

  public connectToMixer(channelIndex: number) {
    this.filter.disconnect();
    this.filter.connect(mixerEngine.getChannel(channelIndex));
  }

  public connect(destination: Tone.ToneAudioNode) {
    this.filter.connect(destination);
  }

  public dispose() {
    this.synth.dispose();
    this.filter.dispose();
    this.lfo.dispose();
    this.lfoGain.dispose();
    this.waveform.dispose();
  }
}
