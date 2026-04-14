import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { RefreshCcw, Maximize2, MousePointer2 } from 'lucide-react';
import './PianoRoll.css';

export const PianoRoll: React.FC = () => {
  const { project, activeTrackId, csvData, updateVelocity, resetVelocities } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const activeTrack = project.tracks.find(t => t.id === activeTrackId);

  useEffect(() => {
    if (!canvasRef.current || !activeTrack || !csvData) return;
    draw();
  }, [activeTrack, csvData, activeTrack?.velocities]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeTrack) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const dataCount = csvData?.length || 0;
    const stepX = width / dataCount;

    ctx.clearRect(0, 0, width, height);

    // Draw Grid
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const y = (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Velocities
    ctx.fillStyle = 'var(--accent-primary)';
    activeTrack.velocities.forEach((vel, i) => {
      const x = i * stepX;
      const h = vel * height;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(x, height - h, stepX - 1, h);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'var(--accent-primary)';
      ctx.fillRect(x, height - h, stepX - 1, 2); // Velocity cap
    });
  };

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !activeTrack || !csvData) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const index = Math.floor((x / rect.width) * csvData.length);
    const value = Math.max(0, Math.min(1, 1 - (y / rect.height)));

    if (index >= 0 && index < csvData.length) {
      updateVelocity(activeTrack.id, index, value);
    }
  };

  if (!activeTrack) {
    return (
      <div className="piano-roll-empty text-dim">
        Select a track in the Synth Rack to edit velocities
      </div>
    );
  }

  return (
    <div className="piano-roll">
      <div className="piano-roll-controls">
        <div className="control-group">
          <MousePointer2 size={14} />
          <span>Velocity Editor: {activeTrack.name}</span>
        </div>
        <button className="reset-btn" onClick={() => resetVelocities(activeTrack.id)}>
          <RefreshCcw size={14} />
          Reset
        </button>
      </div>

      <div className="canvas-wrapper">
        <canvas 
          ref={canvasRef}
          width={800}
          height={200}
          onPointerDown={(e) => {
            setIsDragging(true);
            handlePointer(e);
          }}
          onPointerMove={(e) => {
            if (isDragging) handlePointer(e);
          }}
          onPointerUp={() => setIsDragging(false)}
          onPointerLeave={() => setIsDragging(false)}
        />
      </div>
      
      <div className="piano-roll-legend">
        <span>Row index (Time)</span>
        <span>Velocity (0.0 - 1.0)</span>
      </div>
    </div>
  );
};
