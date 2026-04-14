import * as Tone from 'tone';
import { triggerDownload } from './downloadHelper';
import { useStore } from '../../store/useStore';
import { FlowEngine } from '../../data/FlowEngine';
import { MappingEngine } from '../../data/MappingEngine';
import { Synthesizer } from '../../audio/Synthesizer';
import { bufferToWav } from './wavEncoder';

export const exportWav = async (progressCallback?: (p: number) => void) => {
  const state = useStore.getState();
  const { csvData, project, nodes, edges, columnStats, scaleSettings } = state;

  const { addNotification } = useStore.getState();

  if (!csvData || csvData.length === 0) {
    addNotification('No data to export', 'error');
    return;
  }
  
  const rowCount = csvData.length;
  addNotification(`Rendering Audio (${rowCount} rows)...`, 'info');
  const bpm = project.bpm;
  const secondsPerRow = 60 / bpm / 2; // 8n = 1/2 of a beat
  const totalDuration = rowCount * secondsPerRow + 2; // +2s for tail

  // Offline rendering
  const buffer = await Tone.Offline(async (Transport) => {
    // Create local nodes for the offline context
    const masterGain = new Tone.Gain(1).toDestination();
    const offlineSynths: Record<string, any> = {};
    
    // Setup tracks
    project.tracks.forEach(track => {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: track.synthSettings.oscillator as any },
        envelope: track.synthSettings.adsr
      }).connect(masterGain);
      
      const filter = new Tone.Filter({
        frequency: track.synthSettings.filter.frequency,
        type: track.synthSettings.filter.type as any,
        Q: track.synthSettings.filter.resonance
      }).connect(masterGain);
      
      synth.disconnect();
      synth.connect(filter);
      
      offlineSynths[track.id] = { synth, filter };
    });

    const lastNotes: Record<string, string> = {};

    // Warm-up time
    const startOffset = 0.1;

    for (let i = 0; i < rowCount; i++) {
        const time = startOffset + (i * secondsPerRow);
        const row = csvData[i];
        
        // Use a try-catch to ensure one failed row doesn't break the whole render
        try {
          const flowResults = FlowEngine.evaluate(nodes, edges, row, columnStats);

          project.tracks.forEach(track => {
              const { synth, filter } = offlineSynths[track.id];
              if (!synth) return;

              const nodeOutput = flowResults.synths[track.id];
              let note: string | null = null;
              
              if (nodeOutput && nodeOutput.pitch !== null) {
                  note = MappingEngine.valueToNote(nodeOutput.pitch, track.mapping, scaleSettings);
                  if (nodeOutput.cutoff !== null) {
                      filter.frequency.setValueAtTime(nodeOutput.cutoff, time);
                  }
              } else {
                  const val = row[track.name];
                  if (typeof val === 'number') {
                      note = MappingEngine.valueToNote(val, track.mapping, scaleSettings);
                  }
              }

              if (!note) return;

              const velocity = track.velocities[i] ?? 0.8;
              const lastNote = lastNotes[track.id];

              if (track.mapping.sustain && note === lastNote) {
                  // Sustain logic: do nothing, let it ring
              } else {
                  if (lastNote) {
                      synth.triggerRelease(lastNote, time);
                  }
                  synth.triggerAttack(note, time, velocity);
                  lastNotes[track.id] = note;
              }
          });
        } catch (err) {
          console.warn(`Error rendering row ${i}:`, err);
        }
    }

    // Release all at the very end
    const endTime = startOffset + (rowCount * secondsPerRow);
    Object.keys(offlineSynths).forEach(trackId => {
      const lastNote = lastNotes[trackId];
      if (lastNote) {
        offlineSynths[trackId].synth.triggerRelease(lastNote, endTime);
      }
    });

  }, totalDuration);

  const wavBlob = bufferToWav(buffer.get()!);
  const filename = `${project.name.replace(/\s+/g, '_')}_${new Date().getTime()}.wav`;
  
  triggerDownload(wavBlob, filename);
};
