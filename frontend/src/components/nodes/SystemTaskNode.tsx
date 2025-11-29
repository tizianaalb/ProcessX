import React from 'react';
import { Cpu } from 'lucide-react';
import { Handle, Position, NodeResizer } from 'reactflow';

interface SystemTaskNodeProps {
  data: {
    label?: string;
  };
  selected?: boolean;
}

export const SystemTaskNode: React.FC<SystemTaskNodeProps> = ({ data, selected }) => {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={50}
        minHeight={25}
        handleStyle={{
          width: '4px',
          height: '4px',
          borderRadius: '1px',
        }}
      />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#6366f1' }}
      />

      {/* System Task Box with gear icon */}
      <div className={`
        bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg p-1.5 shadow-md min-w-[50px]
        border transition-all duration-200
        ${selected ? 'border-indigo-700 shadow-lg ring-1 ring-indigo-300' : 'border-indigo-600'}
      `}>
        <div className="flex items-center gap-1 justify-center">
          <Cpu className="w-3 h-3 flex-shrink-0" />
          <div className="font-bold text-[8px] text-center truncate flex-1">
            {data.label || 'System'}
          </div>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#6366f1' }}
      />
    </>
  );
};
