import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ColumnStat } from './ColumnStat';
import { GridStylesOverlay } from './GridStylesOverlay';
import { Plus, Trash2, Download, Table as TableIcon, Sigma, Palette } from 'lucide-react';
import Papa from 'papaparse';
import './DataGrid.css';

export const DataGrid: React.FC = () => {
  const { 
    csvData, headers, virtualHeaders, columnStats, currentRow, 
    gridConfig, updateGridConfig, setSort, sortSettings, formulas, updateFormula, removeFormula,
    project, activeNotes 
  } = useStore();

  const gridRef = React.useRef<HTMLDivElement>(null);
  const playingRowRef = React.useRef<HTMLTableRowElement>(null);

  // Auto-scroll logic (Instant lock for performance)
  React.useEffect(() => {
    if (gridConfig.autoScroll && playingRowRef.current) {
      playingRowRef.current.scrollIntoView({
        behavior: 'auto',
        block: 'center'
      });
    }
  }, [currentRow, gridConfig.autoScroll]);

  // Refined Zoom logic with event listener override
  React.useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const handleWheelRaw = (e: WheelEvent) => {
      if (e.altKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.min(2.0, Math.max(0.1, gridConfig.zoom + delta));
        updateGridConfig({ zoom: newZoom });
      }
    };

    el.addEventListener('wheel', handleWheelRaw, { passive: false });
    return () => el.removeEventListener('wheel', handleWheelRaw);
  }, [gridConfig.zoom, updateGridConfig]);

  const [newColName, setNewColName] = useState('');
  const [newFormula, setNewFormula] = useState('');
  const [showFormulaEditor, setShowFormulaEditor] = useState(false);
  const [showStylesOverlay, setShowStylesOverlay] = useState(false);

  const allHeaders = [...headers, ...virtualHeaders];

  const handleExport = () => {
    if (!csvData) return;
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'sonodaw_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddFormula = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColName && newFormula) {
      updateFormula(newColName, newFormula);
      setNewColName('');
      setNewFormula('');
    }
  };

  if (!csvData) {
    return (
      <div className="data-grid panel empty">
        <TableIcon size={48} className="icon-dim" />
        <p>No data loaded. Please upload a CSV file.</p>
      </div>
    );
  }

  return (
    <div className="data-grid panel">
      <div className="grid-toolbar">
        <div className="toolbar-left">
          <h3><TableIcon size={14} /> Dataset <span className="text-dim">({csvData.length} Rows)</span></h3>
        </div>
        <div className="toolbar-actions">
          <button 
            className={`action-btn ${showFormulaEditor ? 'active' : ''}`}
            onClick={() => setShowFormulaEditor(!showFormulaEditor)}
            title="Create Formula Column"
          >
            <Sigma size={14} /> Formula
          </button>
          <button 
            className={`action-btn ${showStylesOverlay ? 'active' : ''}`}
            onClick={() => setShowStylesOverlay(!showStylesOverlay)}
            title="Grid Aesthetics"
          >
            <Palette size={14} /> Style
          </button>
          <button className="action-btn" onClick={handleExport} title="Export CSV">
            <Download size={14} /> Export
          </button>
        </div>
      </div>
      
      {showStylesOverlay && (
        <GridStylesOverlay onClose={() => setShowStylesOverlay(false)} />
      )}

      {showFormulaEditor && (
        <form className="formula-editor fade-in" onSubmit={handleAddFormula}>
          <div className="formula-inputs">
            <input 
              type="text" 
              placeholder="Column Name" 
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="e.g. TEMPERATURE * 2 / LUMINOSITY" 
              value={newFormula}
              onChange={(e) => setNewFormula(e.target.value)}
              className="formula-input-field"
            />
            <button type="submit" className="add-formula-btn" disabled={!newColName || !newFormula}>
              <Plus size={14} /> Add Column
            </button>
          </div>
          
          {Object.keys(formulas).length > 0 && (
            <div className="active-formulas">
              {Object.entries(formulas).map(([name, formula]) => (
                <div key={name} className="formula-tag">
                  <span className="name">{name}</span>
                  <span className="eq"> = </span>
                  <span className="code">{formula}</span>
                  <button onClick={() => removeFormula(name)} className="remove-tag">
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </form>
      )}

      <div 
        className="grid-wrapper" 
        ref={gridRef}
        style={{ '--grid-zoom': gridConfig.zoom } as any}
      >
        <table className="spreadsheet">
          <thead>
            <tr>
              <th className="row-num">#</th>
              {allHeaders.map(h => {
                const sortIndex = sortSettings.criteria.findIndex(c => c.column === h);
                const criterion = sortIndex > -1 ? sortSettings.criteria[sortIndex] : null;
                
                return (
                  <th 
                    key={h} 
                    onClick={(e) => setSort(h, e.shiftKey)}
                    className={`sortable ${criterion ? 'sorted' : ''} ${virtualHeaders.includes(h) ? 'virtual' : ''}`}
                  >
                    <div className="header-cell">
                      {h}
                      {criterion && (
                        <div className="sort-indicators">
                          <span className="sort-arrow">
                            {criterion.direction === 'asc' ? '↑' : '↓'}
                          </span>
                          {sortSettings.criteria.length > 1 && (
                            <span className="sort-priority" title={`Sort Priority: ${sortIndex + 1}`}>
                              {sortIndex + 1}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {csvData.map((row, idx) => (
              <tr 
                key={idx} 
                className={currentRow === idx ? 'playing' : ''}
                ref={currentRow === idx ? playingRowRef : null}
              >
                <td className="row-num" onClick={() => (window as any).setCurrentRow?.(idx)}>{idx + 1}</td>
                {allHeaders.map(h => (
                  <td key={h} className={virtualHeaders.includes(h) ? 'virtual' : ''}>
                    {typeof row[h] === 'number' ? (
                      <div className="cell-content">
                        <ColumnStat 
                          value={row[h]} 
                          min={columnStats[h]?.min || 0} 
                          max={columnStats[h]?.max || 1} 
                          mode={gridConfig.barMode}
                          idleStops={gridConfig.idleGradient}
                          highlightStops={gridConfig.highlightGradient}
                          isHighlighted={currentRow === idx}
                        />
                        {currentRow === idx && (() => {
                          const track = project.tracks.find(t => t.mapping.columnName === h);
                          const activeNote = track ? activeNotes[track.id] : null;
                          return activeNote ? (
                            <div className="note-indicator fade-in">
                              <span className="note-name">{activeNote}</span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    ) : (
                      String(row[h])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
