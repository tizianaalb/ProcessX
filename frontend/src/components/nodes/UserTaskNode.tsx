import React from 'react';
import { User } from 'lucide-react';
import { Handle, Position, NodeResizer } from 'reactflow';

interface UserTaskNodeProps {
  data: {
    label?: string;
  };
  selected?: boolean;
}

export const UserTaskNode: React.FC<UserTaskNodeProps> = ({ data, selected }) => {
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
        style={{ background: '#10b981' }}
      />

      {/* User Task Box */}
      <div className={`
        bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg p-1.5 shadow-md min-w-[50px]
        border transition-all duration-200
        ${selected ? 'border-emerald-700 shadow-lg ring-1 ring-emerald-300' : 'border-emerald-600'}
      `}>
        <div className="flex items-center gap-1 justify-center">
          <User className="w-3 h-3 flex-shrink-0" />
          <div className="font-bold text-[8px] text-center truncate flex-1">
            {data.label || 'User Task'}
          </div>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#10b981' }}
      />
    </>
  );
};
