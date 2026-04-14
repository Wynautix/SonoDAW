import MidiWriter from 'midi-writer-js';
import { useStore } from '../../store/useStore';
import { FlowEngine } from '../../data/FlowEngine';
import { MappingEngine } from '../../data/MappingEngine';
import { triggerDownload } from './downloadHelper';

export const exportMidi = () => {
  const state = useStore.getState();
  const { csvData, project, nodes, edges, columnStats, scaleSettings } = state;

  if (!csvData || csvData.length === 0) return;

  const tracks: any[] = [];

  project.tracks.forEach(daWtrack => {
    const midiTrack = new MidiWriter.Track();
    midiTrack.setTempo(project.bpm);
    midiTrack.addTrackName(daWtrack.name);
    
    let lastNote: string | null = null;
    let sustainCount = 0;

    const TicksPerRow = 128; // Standard 8th note in many MIDI contexts

    csvData.forEach((row, i) => {
      const flowResults = FlowEngine.evaluate(nodes, edges, row, columnStats);
      const nodeOutput = flowResults.synths[daWtrack.id];
      let note: string | null = null;

      if (nodeOutput && nodeOutput.pitch !== null) {
        note = MappingEngine.valueToNote(nodeOutput.pitch, daWtrack.mapping, scaleSettings);
      } else {
        const val = row[daWtrack.name];
        if (typeof val === 'number') {
          note = MappingEngine.valueToNote(val, daWtrack.mapping, scaleSettings);
        }
      }

      if (!note) return;

      const velocity = Math.floor((daWtrack.velocities[i] ?? 0.8) * 100);

      if (daWtrack.mapping.sustain && note === lastNote) {
        sustainCount++;
      } else {
        if (lastNote) {
            midiTrack.addEvent(new MidiWriter.NoteEvent({
                pitch: [lastNote],
                duration: `T${sustainCount * TicksPerRow + TicksPerRow}`,
                velocity: velocity
            }));
        }
        lastNote = note;
        sustainCount = 0;
      }
    });

    // Add final note
    if (lastNote) {
        midiTrack.addEvent(new MidiWriter.NoteEvent({
            pitch: [lastNote],
            duration: `T${sustainCount * TicksPerRow + TicksPerRow}`,
            velocity: 80
        }));
    }

    tracks.push(midiTrack);
  });

  const write = new MidiWriter.Writer(tracks);
  const blob = new Blob([write.buildFile() as any], { type: 'application/octet-stream' });
  const filename = `${project.name.replace(/\s+/g, '_')}_${new Date().getTime()}.mid`;
  
  triggerDownload(blob, filename);
};
