import React from 'react';
import { GitBranch } from 'lucide-react';
import { Handle, Position, NodeResizer } from 'reactflow';

interface ParallelGatewayNodeProps {
  data: {
    label?: string;
  };
  selected?: boolean;
}

export const ParallelGatewayNode: React.FC<ParallelGatewayNodeProps> = ({ data, selected }) => {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={40}
        minHeight={40}
        handleStyle={{
          width: '4px',
          height: '4px',
          borderRadius: '1px',
        }}
      />

      {/* Input Handle - Top */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#8b5cf6' }}
      />

      {/* Diamond Shape for Parallel Gateway */}
      <div className={`
        bg-gradient-to-br from-purple-500 to-purple-600 text-white transform rotate-45 w-10 h-10
        flex items-center justify-center shadow-md border transition-all duration-200
        ${selected ? 'border-purple-700 shadow-lg ring-1 ring-purple-300 scale-110' : 'border-purple-600'}
      `}>
        <div className="transform -rotate-45 flex flex-col items-center">
          <GitBranch className="w-4 h-4" strokeWidth={3} />
          <div className="text-[6px] font-bold mt-0.5 line-clamp-1 max-w-[32px] text-center">
            {data.label || 'AND'}
          </div>
        </div>
      </div>

      {/* Output Handles - Bottom, Left, Right for multiple paths */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: '#8b5cf6' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ background: '#8b5cf6', left: '-4px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: '#8b5cf6', right: '-4px' }}
      />
    </>
  );
};
