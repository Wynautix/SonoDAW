import * as Tone from 'tone';
import { EffectSettings } from '../types/synth';

class EffectChain {
  public input: Tone.Gain;
  public output: Tone.Gain;
  private effects: Tone.ToneAudioNode[] = [];
  private settings: EffectSettings[] = [];

  constructor() {
    this.input = new Tone.Gain();
    this.output = new Tone.Gain();
    this.input.connect(this.output);
  }

  public update(newSettings: EffectSettings[]) {
    // Basic diffing or just rebuild for simplicity
    this.disposeEffects();
    this.settings = newSettings;
    
    let lastNode: Tone.ToneAudioNode = this.input;
    this.input.disconnect();

    newSettings.forEach(s => {
      if (!s.enabled) return;
      
      const fxNode = this.createEffectNode(s);
      if (fxNode) {
        lastNode.connect(fxNode);
        lastNode = fxNode;
        this.effects.push(fxNode);
      }
    });

    lastNode.connect(this.output);
  }

  private createEffectNode(s: EffectSettings): Tone.ToneAudioNode | null {
    const p = s.params as any;
    switch (s.type) {
      case 'Reverb': 
        const reverb = new Tone.Reverb({ decay: p.decay || 1.5, wet: p.wet || 0.5 });
        return reverb;
      case 'Delay': return new Tone.FeedbackDelay(p.delayTime, p.feedback);
      case 'Limiter': return new Tone.Limiter(p.threshold);
      case 'Bitcrusher': return new Tone.BitCrusher(p.bits);
      case 'Phaser': return new Tone.Phaser({ frequency: p.frequency, octaves: p.octaves, baseFrequency: p.baseFrequency });
      case 'Tremolo': return new Tone.Tremolo(p.frequency, p.depth).start();
      case 'EQ': return new Tone.EQ3(p.low, p.mid, p.high);
      case 'HPF': return new Tone.Filter(p.frequency, 'highpass', p.Q);
      case 'LPF': return new Tone.Filter(p.frequency, 'lowpass', p.Q);
      case 'Notch': return new Tone.Filter(p.frequency, 'notch', p.Q);
      default: return null;
    }
  }

  private disposeEffects() {
    this.effects.forEach(fx => fx.dispose());
    this.effects = [];
  }

  public dispose() {
    this.disposeEffects();
    this.input.dispose();
    this.output.dispose();
  }
}

export class MixerEngine {
  public channels: Tone.Channel[] = [];
  public effectChains: EffectChain[] = [];
  public meters: Tone.Meter[] = [];
  public master: Tone.Channel;
  public masterChain: EffectChain;

  constructor() {
    this.master = new Tone.Channel();
    this.masterChain = new EffectChain();
    
    // Master Chain: Master Channel -> Master FX -> Destination
    this.master.connect(this.masterChain.input);
    this.masterChain.output.toDestination();
    
    for (let i = 0; i < 8; i++) {
      const channel = new Tone.Channel();
      const meter = new Tone.Meter();
      const chain = new EffectChain();
      
      // Channel -> FX Chain -> Master
      channel.connect(meter);
      channel.connect(chain.input);
      chain.output.connect(this.master);
      
      this.channels.push(channel);
      this.meters.push(meter);
      this.effectChains.push(chain);
    }
  }

  public updateChains(mixerEffectChains: Record<number, EffectSettings[]>, masterChain: EffectSettings[]) {
    Object.entries(mixerEffectChains).forEach(([idx, settings]) => {
      const i = parseInt(idx);
      if (this.effectChains[i]) {
        this.effectChains[i].update(settings);
      }
    });
    this.masterChain.update(masterChain);
  }

  public getChannel(index: number) {
    return this.channels[index] || this.master;
  }

  public dispose() {
    this.channels.forEach(c => c.dispose());
    this.meters.forEach(m => m.dispose());
    this.effectChains.forEach(ch => ch.dispose());
    this.masterChain.dispose();
    this.master.dispose();
  }
}

export const mixerEngine = new MixerEngine();
