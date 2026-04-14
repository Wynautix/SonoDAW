import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../../store/useStore';
import { Database } from 'lucide-react';

export const DataNode = memo(({ data, id }: any) => {
  const { headers, virtualHeaders } = useStore();
  const allHeaders = [...headers, ...virtualHeaders];
  
  return (
    <div className="custom-node data-node">
      <div className="node-header">
        <Database size={12} />
        <span>DATA SOURCE</span>
      </div>
      <div className="node-content">
        <select 
          value={data.column} 
          onChange={(e) => data.onChange(id, { column: e.target.value })}
        >
          <option value="">Select Column</option>
          {allHeaders.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>
      <Handle type="source" position={Position.Right} id="value" />
    </div>
  );
});
