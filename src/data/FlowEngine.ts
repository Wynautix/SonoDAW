import { Node, Edge } from 'reactflow';

export class FlowEngine {
  static evaluate(nodes: Node[], edges: Edge[], row: any, stats: any): any {
    const outputs: any = {
      viz: {},
      synths: {}
    };

    // Find all sink nodes
    const sinks = nodes.filter(n => n.type === 'synthSink' || n.type === 'vizSink');

    sinks.forEach(sink => {
      const visited = new Set<string>();
      if (sink.type === 'synthSink') {
        const trackId = sink.data.trackId;
        outputs.synths[trackId] = {
          pitch: this.resolveValue(sink.id, 'pitch', nodes, edges, row, stats, visited),
          cutoff: this.resolveValue(sink.id, 'cutoff', nodes, edges, row, stats, visited),
          resonance: this.resolveValue(sink.id, 'resonance', nodes, edges, row, stats, visited),
          volume: this.resolveValue(sink.id, 'volume', nodes, edges, row, stats, visited),
        };
      } else if (sink.type === 'vizSink') {
        outputs.viz = {
          xAxis: this.resolveValue(sink.id, 'xAxis', nodes, edges, row, stats, visited),
          yAxis: this.resolveValue(sink.id, 'yAxis', nodes, edges, row, stats, visited),
          zAxis: this.resolveValue(sink.id, 'zAxis', nodes, edges, row, stats, visited),
          color: this.resolveValue(sink.id, 'color', nodes, edges, row, stats, visited),
          size: this.resolveValue(sink.id, 'size', nodes, edges, row, stats, visited),
        };
      }
    });

    return outputs;
  }

  static getStaticMappings(nodes: Node[], edges: Edge[]): any {
    const mappings: any = {
      xAxis: '', yAxis: '', zAxis: '', color: '', size: ''
    };

    const vizSink = nodes.find(n => n.type === 'vizSink');
    if (!vizSink) return mappings;

    ['xAxis', 'yAxis', 'zAxis', 'color', 'size'].forEach(handle => {
      const edge = edges.find(e => e.target === vizSink.id && e.targetHandle === handle);
      if (edge) {
        const source = nodes.find(n => n.id === edge.source);
        if (source?.type === 'dataNode') {
          mappings[handle] = source.data.column;
        }
      }
    });

    return mappings;
  }

  private static resolveValue(nodeId: string, handleId: string, nodes: Node[], edges: Edge[], row: any, stats: any, visited: Set<string>): any {
    const edge = edges.find(e => e.target === nodeId && e.targetHandle === handleId);
    if (!edge) return null;

    const sourceNode = nodes.find(n => n.id === edge.source);
    if (!sourceNode || visited.has(sourceNode.id)) return null;

    visited.add(sourceNode.id);

    if (sourceNode.type === 'dataNode') {
      const col = sourceNode.data.column;
      const val = row[col];
      visited.delete(sourceNode.id); // backtrack
      return val;
    }

    if (sourceNode.type === 'mathNode') {
      const a = this.resolveValue(sourceNode.id, 'a', nodes, edges, row, stats, visited) || 0;
      const b = this.resolveValue(sourceNode.id, 'b', nodes, edges, row, stats, visited) || 0;
      const op = sourceNode.data.op || 'add';

      visited.delete(sourceNode.id); // backtrack
      switch (op) {
        case 'add': return a + b;
        case 'sub': return a - b;
        case 'mul': return a * b;
        case 'div': return b !== 0 ? a / b : 0;
        case 'pow': return Math.pow(a, b);
        default: return a;
      }
    }

    visited.delete(sourceNode.id);
    return null;
  }
}
