import React, { useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  ReactFlowProvider,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore } from '../store/useStore';
import { DataNode } from './nodes/DataNode';
import { MathNode } from './nodes/MathNode';
import { SynthSinkNode } from './nodes/SynthSinkNode';
import { VizSinkNode } from './nodes/VizSinkNode';
import { Plus, Zap, Box, Volume2 } from 'lucide-react';
import './NodeEditor.css';

const nodeTypes = {
  dataNode: DataNode,
  mathNode: MathNode,
  synthSink: SynthSinkNode,
  vizSink: VizSinkNode,
};

export const NodeEditor: React.FC = () => {
  const { 
    nodes, edges, 
    onNodesChange, onEdgesChange, onConnect,
    setNodes, setEdges,
    project
  } = useStore();

  const addNode = (type: string) => {
    const id = `${type}-${Date.now()}`;
    const newNode = {
      id,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        label: `${type} node`,
        onChange: (nodeId: string, nodeData: any) => {
          setNodes(nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...nodeData } } : n));
        }
      } as any,
    };

    if (type === 'synthSink') {
      const track = project.tracks[0];
      newNode.data = { ...newNode.data, trackId: track?.id, trackName: track?.name };
    }

    setNodes([...nodes, newNode]);
  };

  return (
    <div className="node-editor-container fade-in">
      <aside className="node-selector">
        <h3>Node Library</h3>
        <button className="node-type-btn" onClick={() => addNode('dataNode')}>
          <Zap size={10} /> Data Source
        </button>
        <button className="node-type-btn" onClick={() => addNode('mathNode')}>
          <Plus size={10} /> Math Operator
        </button>
        <div style={{ marginTop: 'auto' }}>
          <h3>Sinks</h3>
          <button className="node-type-btn" onClick={() => addNode('synthSink')}>
            <Volume2 size={10} /> Synth Output
          </button>
          <button className="node-type-btn" onClick={() => addNode('vizSink')}>
            <Box size={10} /> Viz Sink
          </button>
        </div>
      </aside>
      
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#111" gap={20} />
          <Controls />
          <MiniMap 
            style={{ background: '#111' }} 
            nodeColor={(n) => {
              if (n.type === 'dataNode') return 'var(--accent-primary)';
              if (n.type === 'mathNode') return 'var(--accent-tertiary)';
              return 'var(--accent-secondary)';
            }} 
          />
          <Panel position="top-right" className="node-panel">
            <span className="text-dim" style={{ fontSize: '10px' }}>NODE ENGINE v1.0</span>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};
