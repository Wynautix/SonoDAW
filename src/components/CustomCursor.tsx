import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import './CustomCursor.css';

export const CustomCursor: React.FC = () => {
  const { project } = useStore();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      const isClickable = target.closest('button, a, input, select, .clickable, label');
      setIsHovering(!!isClickable);
    };

    const handleMouseDown = () => setIsMouseDown(true);
    const handleMouseUp = () => setIsMouseDown(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const theme = project.theme || 'default';

  return (
    <div 
      className={`custom-cursor theme-${theme} ${isHovering ? 'hovering' : ''} ${isMouseDown ? 'active' : ''}`}
      style={{ left: position.x, top: position.y }}
    >
      <div className="cursor-inner">
        {/* Theme-specific cursor details */}
        {theme === 'pipboy' && (
          <div className="pipboy-scanner">
            <div className="crosshair"></div>
            <div className="coords">
              <span>X:{Math.round(position.x)}</span>
              <span>Y:{Math.round(position.y)}</span>
            </div>
            <div className="ring"></div>
          </div>
        )}

        {theme.includes('hacker') && (
          <div className="hacker-glitch">
            <div className="glitch-box"></div>
            <div className="terminal-line"></div>
          </div>
        )}

        {theme === 'unicorn' && (
          <div className="unicorn-sparkle">
            <div className="sparkle-core"></div>
            <div className="particles">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        {theme === 'standard' || theme === 'default' && (
          <div className="tech-bracket">
            <div className="corner tl"></div>
            <div className="corner tr"></div>
            <div className="corner bl"></div>
            <div className="corner br"></div>
            <div className="dot"></div>
          </div>
        )}
      </div>
    </div>
  );
};
