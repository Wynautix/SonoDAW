import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Plus, Minus, X, Divide, ChevronRight } from 'lucide-react';

export const MathNode = memo(({ data, id }: any) => {
  return (
    <div className="custom-node math-node">
      <div className="node-header">
        <div className="math-icon">
          {data.op === 'add' && <Plus size={12} />}
          {data.op === 'sub' && <Minus size={12} />}
          {data.op === 'mul' && <X size={12} />}
          {data.op === 'div' && <Divide size={12} />}
        </div>
        <span>MATH ({data.op?.toUpperCase()})</span>
      </div>
      <div className="node-content">
        <select 
          value={data.op} 
          onChange={(e) => data.onChange(id, { op: e.target.value })}
        >
          <option value="add">Add</option>
          <option value="sub">Subtract</option>
          <option value="mul">Multiply</option>
          <option value="div">Divide</option>
          <option value="pow">Power</option>
        </select>
        <div className="input-row">
          <div className="input-half">
            <Handle type="target" position={Position.Left} id="a" style={{ top: '65%' }} />
            <span>A</span>
          </div>
          <div className="input-half">
            <Handle type="target" position={Position.Left} id="b" style={{ top: '85%' }} />
            <span>B</span>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="result" />
    </div>
  );
});
