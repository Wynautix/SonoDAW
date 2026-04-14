import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Volume2 } from 'lucide-react';

export const SynthSinkNode = memo(({ data, id }: any) => {
  return (
    <div className="custom-node sink-node synth-sink">
      <div className="node-header">
        <Volume2 size={12} />
        <span>SYNTH OUTPUT: {data.trackName}</span>
      </div>
      <div className="node-content">
        <div className="sink-ports">
          <div className="port">
            <Handle type="target" position={Position.Left} id="pitch" />
            <span>PITCH</span>
          </div>
          <div className="port">
            <Handle type="target" position={Position.Left} id="cutoff" />
            <span>CUTOFF</span>
          </div>
          <div className="port">
            <Handle type="target" position={Position.Left} id="resonance" />
            <span>RESONANCE</span>
          </div>
          <div className="port">
            <Handle type="target" position={Position.Left} id="volume" />
            <span>VOLUME</span>
          </div>
        </div>
      </div>
    </div>
  );
});
