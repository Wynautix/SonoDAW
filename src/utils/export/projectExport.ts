import { useStore } from '../../store/useStore';
import { triggerDownload } from './downloadHelper';

const sanitizeProjectData = (state: any) => {
  // Explicitly map all objects to plain data to ensure clean serialization
  return {
    project: {
      name: state.project.name,
      bpm: state.project.bpm,
      theme: state.project.theme,
      layout: state.project.layout,
      masterEffectChain: state.project.masterEffectChain.map((fx: any) => ({
        id: fx.id,
        type: fx.type,
        enabled: fx.enabled,
        params: { ...fx.params }
      })),
      mixerEffectChains: Object.fromEntries(
        Object.entries(state.project.mixerEffectChains).map(([idx, chain]: [string, any]) => [
          idx,
          chain.map((fx: any) => ({
            id: fx.id,
            type: fx.type,
            enabled: fx.enabled,
            params: { ...fx.params }
          }))
        ])
      ),
      tracks: state.project.tracks.map((t: any) => ({
        id: t.id,
        name: t.name,
        mixerChannel: t.mixerChannel,
        velocities: [...t.velocities],
        synthSettings: {
          ...t.synthSettings,
          adsr: { ...t.synthSettings.adsr },
          filter: { ...t.synthSettings.filter },
          lfo: { ...t.synthSettings.lfo }
        },
        mapping: { ...t.mapping }
      }))
    },
    // Contextual UI state
    uiState: {
      activeTrackId: state.activeTrackId,
      viewMode: state.viewMode,
      activeEffectId: state.activeEffectId,
      selectedMixerChannel: state.selectedMixerChannel
    },
    csvData: state.csvData,
    headers: state.headers,
    virtualHeaders: state.virtualHeaders || [],
    columnStats: state.columnStats,
    sortSettings: state.sortSettings,
    scaleSettings: state.scaleSettings,
    formulas: state.formulas || {},
    nodes: (state.nodes || []).map((n: any) => ({
      id: n.id,
      type: n.type,
      position: { ...n.position },
      data: { ...n.data },
      width: n.width,
      height: n.height,
    })),
    edges: (state.edges || []).map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    })),
    vizConfig: JSON.parse(JSON.stringify(state.vizConfig)),
    version: '1.5.0',
    timestamp: new Date().toISOString()
  };
};

export const exportProject = () => {
  const state = useStore.getState();
  const { addNotification } = useStore.getState();
  
  try {
    addNotification('Preparing project data...', 'info');
    const cleanedData = sanitizeProjectData(state);
    const json = JSON.stringify(cleanedData, null, 2);
    const blob = new Blob([json], { type: 'application/octet-stream' });
    const filename = `${state.project.name.replace(/\s+/g, '_')}_${new Date().getTime()}.sndw`;
    
    triggerDownload(blob, filename);
  } catch (err) {
    console.error('Project export failed:', err);
    alert('Failed to export project. Please check the console for details.');
  }
};

export const importProject = async (file: File) => {
  const { addNotification } = useStore.getState();
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    const store = useStore.getState();
    
    // Hydrate store with deep-cloned fallback logic
    useStore.setState({
      project: data.project,
      csvData: data.csvData,
      headers: data.headers,
      virtualHeaders: data.virtualHeaders || [],
      columnStats: data.columnStats,
      sortSettings: data.sortSettings,
      scaleSettings: data.scaleSettings,
      formulas: data.formulas || {},
      nodes: data.nodes || [],
      edges: data.edges || [],
      vizConfig: { ...store.vizConfig, ...(data.vizConfig || {}) },
      currentRow: 0,
      // Restore UI State if available
      activeTrackId: data.uiState?.activeTrackId || null,
      viewMode: data.uiState?.viewMode || 'rack',
      activeEffectId: data.uiState?.activeEffectId || null,
      selectedMixerChannel: data.uiState?.selectedMixerChannel !== undefined ? data.uiState.selectedMixerChannel : null
    });
    
    addNotification(`Project "${data.project.name}" loaded successfully`, 'success');
    return true;
  } catch (e) {
    console.error('Failed to import project:', e);
    addNotification('Failed to open project file', 'error');
    return false;
  }
};
