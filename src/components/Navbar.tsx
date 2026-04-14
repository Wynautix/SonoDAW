import React from 'react';
import { useStore } from '../store/useStore';
import { Layout, Sliders, Settings2, BarChart2, GitBranch, Database, Plus, PanelLeft, PanelTop, PanelRight, Table as TableIcon, Activity, Box, Disc } from 'lucide-react';
import { exportProject, importProject } from '../utils/export/projectExport';
import { exportMidi } from '../utils/export/midiExport';
import { exportWav } from '../utils/export/wavExport';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const { viewMode, setViewMode, project, togglePanel, setTheme, vizConfig, updateVizConfig } = useStore();

  const themes = [
    { id: 'dark', name: 'Dark Mode' },
    { id: 'light', name: 'Light Mode' },
    { id: 'skeudark', name: 'Skeudark' },
    { id: 'skeulight', name: 'Skeulight' },
    { id: 'unicorn', name: 'Unicorn RGB Tron' },
    { id: 'monastic-dark', name: 'Monastic Dark' },
    { id: 'monastic-light', name: 'Monastic Light' },
    { id: 'geometry-dark', name: 'Sacred Geometry Dark' },
    { id: 'geometry-light', name: 'Sacred Geometry Light' },
    { id: 'hacker-green', name: 'Hacker Green' },
    { id: 'hacker-blue', name: 'Hacker Blue' },
    { id: 'ricebright', name: 'Ricebright' },
    { id: 'mogue', name: 'Mogue Vogue' },
    { id: 'pipboy', name: 'Pip-Boy' },
    { id: 'twinkly', name: 'Twinkly Bowbear' },
    { id: 'transitive', name: 'Transitive Property' },
  ];

  return (
    <nav className="navbar">
      <div className="nav-left">
        <div className="brand">
          <div className="logo-icon">🔊</div>
          <h1>SONODAW <span className="version">PRO</span></h1>
        </div>
        
        <div className="menu-group">
          <div className="menu-item has-dropdown">
            File
            <div className="dropdown">
              <button onClick={() => {
                const name = prompt('Project Name:', project.name);
                if (name) useStore.getState().updateProject({ name });
              }}>Project Settings</button>
              <button onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.sndw';
                input.onchange = (e: any) => {
                  const file = e.target.files[0];
                  if (file) importProject(file);
                };
                input.click();
              }}>Import Project (.sndw)</button>
              <button onClick={exportProject}>Export Project (.sndw)</button>
              <div className="divider" />
              <button onClick={exportMidi}>Export MIDI (.mid)</button>
              <button onClick={() => exportWav()}>Export Audio (.wav)</button>
            </div>
          </div>
          <div className="menu-item has-dropdown">
            Edit
            <div className="dropdown">
              <button>Undo</button>
              <button>Redo</button>
              <button>Scale Settings</button>
            </div>
          </div>
          <div className="menu-item has-dropdown">
            View
            <div className="dropdown">
              <button onClick={() => setViewMode('rack')}>Channel Rack</button>
              <button onClick={() => setViewMode('mixer')}>Mixer Console</button>
              <button onClick={() => setViewMode('3d')}>3D Visualizer</button>
              <div className="divider" />
              {project.layout.map(panel => (
                <button key={panel.id} onClick={() => togglePanel(panel.id)}>
                  {panel.visible ? '✓' : ''} Show {panel.id.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="menu-item has-dropdown">
            Skins
            <div className="dropdown">
              {themes.map(t => (
                <button key={t.id} onClick={() => setTheme(t.id)}>
                  {t.name}
                  {project.theme === t.id ? ' ✓' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="nav-center">
        <div className="view-selector-btns">
          <button 
            className={viewMode === 'rack' ? 'active' : ''} 
            onClick={() => setViewMode('rack')}
            title="Channel Rack"
          >
            <Sliders size={18} />
          </button>
          <button 
            className={`tool-btn ${viewMode === 'mixer' ? 'active' : ''}`}
            onClick={() => setViewMode('mixer')}
            title="Mixer"
          >
            <Disc size={16} />
          </button>
          
          <div className="v-divider" />

          <button 
            className={`tool-btn ${vizConfig.sustainLegato ? 'active' : ''}`}
            onClick={() => updateVizConfig({ sustainLegato: !vizConfig.sustainLegato })}
            title="Global Legato (Sustain Identical)"
          >
            <Activity size={16} className={vizConfig.sustainLegato ? 'pulse' : ''} />
          </button>

          <button 
            className={viewMode === 'data' ? 'active' : ''} 
            onClick={() => setViewMode('data')}
            title="Data Grid"
          >
            <TableIcon size={18} />
          </button>
          <button 
            className={viewMode === 'analytics' ? 'active' : ''} 
            onClick={() => setViewMode('analytics')}
            title="Analytics & Viz Builder"
          >
            <Activity size={18} />
          </button>
          <button 
            className={viewMode === '3d' ? 'active' : ''} 
            onClick={() => setViewMode('3d')}
            title="3D Cinematic Viz"
          >
            <Box size={18} />
          </button>
          <button 
            className={viewMode === 'nodes' ? 'active' : ''} 
            onClick={() => setViewMode('nodes')}
            title="Flow Editor"
          >
            <GitBranch size={18} />
          </button>
        </div>
      </div>

      <div className="nav-right">
        <button className="add-tool-btn">
          <Plus size={16} /> 
          ADD TOOL
        </button>
        <div className="layout-controls">
          <button onClick={() => togglePanel('columns')}><PanelLeft size={16} /></button>
          <button onClick={() => togglePanel('rack-mixer')}><PanelTop size={16} /></button>
          <button onClick={() => togglePanel('fx-stack')}><PanelRight size={16} /></button>
        </div>
      </div>
    </nav>
  );
};
