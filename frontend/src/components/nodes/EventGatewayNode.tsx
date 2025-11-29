import React from 'react';
import { Pentagon } from 'lucide-react';
import { Handle, Position, NodeResizer } from 'reactflow';

interface EventGatewayNodeProps {
  data: {
    label?: string;
  };
  selected?: boolean;
}

export const EventGatewayNode: React.FC<EventGatewayNodeProps> = ({ data, selected }) => {
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
        style={{ background: '#ec4899' }}
      />

      {/* Diamond Shape for Event Gateway */}
      <div className={`
        bg-gradient-to-br from-pink-500 to-pink-600 text-white transform rotate-45 w-10 h-10
        flex items-center justify-center shadow-md border-2 border-dashed transition-all duration-200
        ${selected ? 'border-pink-700 shadow-lg ring-1 ring-pink-300 scale-110' : 'border-pink-400'}
      `}>
        <div className="transform -rotate-45 flex flex-col items-center">
          {/* Event indicator - pentagon/star shape */}
          <Pentagon className="w-4 h-4" strokeWidth={2.5} />
          <div className="text-[6px] font-bold mt-0.5 line-clamp-1 max-w-[32px] text-center">
            {data.label || 'Event'}
          </div>
        </div>
      </div>

      {/* Output Handles - Multiple for event branching */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: '#ec4899' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ background: '#ec4899', left: '-4px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: '#ec4899', right: '-4px' }}
      />
    </>
  );
};
