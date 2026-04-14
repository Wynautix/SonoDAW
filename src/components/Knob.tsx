import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './Knob.css';

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  suffix?: string;
  color?: string;
  onClick?: () => void;
}

export const Knob: React.FC<KnobProps> = ({ 
  label, value, min, max, onChange, suffix = '', color = 'var(--accent-primary)', onClick
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const deltaY = startY.current - e.clientY;
    const range = max - min;
    const step = range / 200; // Sensitivity
    const newValue = Math.max(min, Math.min(max, startValue.current + deltaY * step));
    onChange(newValue);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const rotation = ((value - min) / (max - min)) * 270 - 135;

  return (
    <div className="knob-container">
      <div 
        className="knob-outer" 
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <motion.div 
          className="knob-inner"
          animate={{ rotate: rotation }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{ borderTopColor: color }}
        >
          <div className="knob-indicator" style={{ backgroundColor: color }} />
        </motion.div>
      </div>
      <div className="knob-label">{label}</div>
      <div className="knob-value">{value.toFixed(1)}{suffix}</div>
    </div>
  );
};
