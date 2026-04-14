import React from 'react';
import './ColumnStat.css';

interface ColumnStatProps {
  value: number;
  min: number;
  max: number;
  mode?: 'solid' | 'gradient' | 'rainbow';
  idleStops?: [string, string];
  highlightStops?: [string, string];
  isHighlighted?: boolean;
}

export const ColumnStat: React.FC<ColumnStatProps> = ({ 
  value, min, max, 
  mode = 'solid', 
  idleStops = ['var(--accent-primary)', 'var(--accent-primary)'],
  highlightStops = ['#fff', 'var(--accent-primary)'],
  isHighlighted = false
}) => {
  const percentage = ((value - min) / (max - min)) * 100;
  const clamped = Math.max(0, Math.min(100, percentage));

  const stops = isHighlighted ? highlightStops : idleStops;
  
  const getBackground = () => {
    if (mode === 'rainbow') {
      // Dynamic rainbow shift based on percentage
      const hue = (clamped * 2.8); // 0-280 range for nice spectrum
      return `linear-gradient(90deg, hsl(${hue}, 80%, 50%), hsl(${hue + 40}, 80%, 40%))`;
    }
    if (mode === 'gradient') {
      return `linear-gradient(90deg, ${stops[0]}, ${stops[1]})`;
    }
    return stops[0];
  };

  return (
    <div className={`column-stat ${isHighlighted ? 'highlighted' : ''} mode-${mode}`}>
      <div className="stat-track">
        <div 
          className="stat-fill" 
          style={{ 
            width: `${clamped}%`,
            background: getBackground(),
            boxShadow: mode !== 'solid' ? `0 0 12px ${stops[0]}33` : `0 0 8px ${stops[0]}44`
          }} 
        />
      </div>
      <span className="stat-val">{value.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
    </div>
  );
};
