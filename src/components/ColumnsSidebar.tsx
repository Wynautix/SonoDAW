import React from 'react';
import { useStore } from '../store/useStore';
import { Database, Search, ArrowUp, ArrowDown, ChevronRight, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import './ColumnsSidebar.css';

export const ColumnsSidebar: React.FC = () => {
  const { headers, sortSettings, setSort, addTrack, project } = useStore();

  const onDragStart = (e: React.DragEvent, columnName: string) => {
    e.dataTransfer.setData('columnName', columnName);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="columns-sidebar">
      <div className="sidebar-search">
        <Search size={14} />
        <input type="text" placeholder="Search fields..." />
      </div>
      
      <div className="column-list">
        {headers.map(h => {
          const isTrack = project.tracks.some(t => t.name === h);
          return (
            <motion.div 
              key={h} 
              className={`column-item ${isTrack ? 'is-track' : ''}`}
              draggable
              onDragStart={(e) => onDragStart(e as any, h)}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <div className="grip">
                <GripVertical size={12} />
              </div>
              <div className="column-info" onClick={() => setSort(h)}>
                <span className="h-name">{h}</span>
                {(() => {
                  const criterion = sortSettings.criteria.find(c => c.column === h);
                  if (!criterion) return null;
                  return (
                    <span className="sort-icon">
                      {criterion.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                    </span>
                  );
                })()}
              </div>
              <button 
                className="add-btn" 
                onClick={() => addTrack(h)}
                disabled={isTrack}
              >
                <ChevronRight size={14} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
