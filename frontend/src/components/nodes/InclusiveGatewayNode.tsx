import React from 'react';
import { Circle } from 'lucide-react';
import { Handle, Position, NodeResizer } from 'reactflow';

interface InclusiveGatewayNodeProps {
  data: {
    label?: string;
  };
  selected?: boolean;
}

export const InclusiveGatewayNode: React.FC<InclusiveGatewayNodeProps> = ({ data, selected }) => {
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
        style={{ background: '#14b8a6' }}
      />

      {/* Diamond Shape for Inclusive Gateway (OR) */}
      <div className={`
        bg-gradient-to-br from-teal-500 to-teal-600 text-white transform rotate-45 w-10 h-10
        flex items-center justify-center shadow-md border transition-all duration-200
        ${selected ? 'border-teal-700 shadow-lg ring-1 ring-teal-300 scale-110' : 'border-teal-600'}
      `}>
        <div className="transform -rotate-45 flex flex-col items-center">
          {/* OR indicator - hollow circle */}
          <Circle className="w-4 h-4" strokeWidth={3} />
          <div className="text-[6px] font-bold mt-0.5 line-clamp-1 max-w-[32px] text-center">
            {data.label || 'OR'}
          </div>
        </div>
      </div>

      {/* Output Handles - Multiple for OR branching */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: '#14b8a6' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ background: '#14b8a6', left: '-4px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: '#14b8a6', right: '-4px' }}
      />
    </>
  );
};
