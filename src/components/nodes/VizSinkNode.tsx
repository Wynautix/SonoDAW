import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Eye } from 'lucide-react';

export const VizSinkNode = memo(({ data, id }: any) => {
  return (
    <div className="custom-node sink-node viz-sink">
      <div className="node-header">
        <Eye size={12} />
        <span>VIZ SINK (3D/2D)</span>
      </div>
      <div className="node-content">
        <div className="sink-ports">
          <div className="port">
            <Handle type="target" position={Position.Left} id="xAxis" />
            <span>X AXIS</span>
          </div>
          <div className="port">
            <Handle type="target" position={Position.Left} id="yAxis" />
            <span>Y AXIS</span>
          </div>
          <div className="port">
            <Handle type="target" position={Position.Left} id="zAxis" />
            <span>Z AXIS</span>
          </div>
          <div className="port">
            <Handle type="target" position={Position.Left} id="color" />
            <span>COLOR</span>
          </div>
          <div className="port">
            <Handle type="target" position={Position.Left} id="size" />
            <span>SIZE</span>
          </div>
        </div>
      </div>
    </div>
  );
});
