import * as Tone from 'tone';
import { ColumnMapping } from '../types/synth';
import { SCALES, ScaleMode, ROOTS } from '../audio/MusicConstants';

export class MappingEngine {
  /**
   * Maps a raw value from a CSV column to a MIDI note based on range and scale settings.
   */
  public static valueToNote(
    value: number,
    mapping: ColumnMapping,
    scaleSettings: { root: string, mode: ScaleMode }
  ): string {
    const { minVal, maxVal, minNote, maxNote, binning } = mapping;

    // 1. Normalize value to 0-1
    let normalized = (value - minVal) / (maxVal - minVal);
    normalized = Math.max(0, Math.min(1, normalized));

    // 2. Apply Custom Curve
    const curve = mapping.curve || 'linear';
    if (curve === 'square') {
      normalized = Math.pow(normalized, 2);
    } else if (curve === 'log') {
      // log(1 + normalized * (e - 1)) - scales 0-1 to 0-1
      normalized = Math.log1p(normalized * (Math.E - 1)) / Math.log(Math.E);
    } else if (curve === 'exp') {
      // (exp(normalized) - 1) / (e - 1) - scales 0-1 to 0-1
      normalized = (Math.exp(normalized) - 1) / (Math.E - 1);
    }

    // 3. MIDI Frequency Range
    const midiMin = Tone.Frequency(minNote).toMidi();
    const midiMax = Tone.Frequency(maxNote).toMidi();

    let midiNote = midiMin + normalized * (midiMax - midiMin);

    if (binning || scaleSettings.mode !== 'chromatic') {
      midiNote = Math.round(midiNote);
    }

    // 3. Quantize to Scale
    if (scaleSettings.mode !== 'chromatic') {
      midiNote = this.quantizeToScale(midiNote, scaleSettings.root, scaleSettings.mode);
    }

    return Tone.Frequency(midiNote, 'midi').toNote();
  }

  private static quantizeToScale(midiNote: number, root: string, mode: ScaleMode): number {
    const rootOffset = ROOTS.indexOf(root);
    if (rootOffset === -1) return midiNote;

    const scaleIntervals = SCALES[mode];
    
    // Convert to relative position from the nearest lower root note
    // We want to find the nearest scale note in absolute terms
    const oct = Math.floor((midiNote - rootOffset) / 12);
    const relativeNote = (midiNote - rootOffset) % 12;
    
    // Find the nearest interval in the scale
    // We check the current octave, one below, and one above to find the true nearest
    let minDiff = Infinity;
    let bestNote = midiNote;

    // Check intervals in -1, 0, and +1 relative octaves to ensure we find the absolute closest
    for (let o = -1; o <= 1; o++) {
      for (const interval of scaleIntervals) {
        const candidateNote = (oct + o) * 12 + rootOffset + interval;
        const diff = Math.abs(candidateNote - midiNote);
        if (diff < minDiff) {
          minDiff = diff;
          bestNote = candidateNote;
        }
      }
    }

    return bestNote;
  }

  public static shouldSustain(
    currentValue: number,
    previousValue: number | null,
    mapping: ColumnMapping
  ): boolean {
    if (!mapping.sustain || previousValue === null) return false;
    return currentValue === previousValue;
  }
}
