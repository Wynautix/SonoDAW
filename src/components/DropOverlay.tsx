import React from 'react';
import { FileUp } from 'lucide-react';
import './DropOverlay.css';

interface DropOverlayProps {
  isVisible: boolean;
}

export const DropOverlay: React.FC<DropOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="drop-overlay">
      <div className="drop-content">
        <div className="drop-icon-container">
          <FileUp size={64} className="drop-icon" />
          <div className="drop-ring" />
          <div className="drop-ring delay" />
        </div>
        <h2>DROP TO LOAD PROJECT</h2>
        <p>Release to import your .sndw file</p>
        <div className="binary-decoration">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.1}s` }}>
              {(i % 2 === 0) ? '0' : '1'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
