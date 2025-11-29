import React from 'react';
import { AlertOctagon } from 'lucide-react';
import { Handle, Position, NodeResizer } from 'reactflow';

interface ErrorEventNodeProps {
  data: {
    label?: string;
  };
  selected?: boolean;
}

export const ErrorEventNode: React.FC<ErrorEventNodeProps> = ({ data, selected }) => {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={35}
        minHeight={35}
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
        style={{ background: '#ef4444' }}
      />

      {/* Error Event Circle with lightning bolt */}
      <div className={`
        bg-white border-4 border-red-500 text-red-600 rounded-full w-9 h-9
        flex flex-col items-center justify-center font-bold shadow-md transition-all duration-200
        ${selected ? 'shadow-lg ring-2 ring-red-300 scale-110' : ''}
      `}>
        <AlertOctagon className="w-3 h-3" strokeWidth={3} />
        <span className="text-[6px] mt-0.5 truncate max-w-[28px]">{data.label || 'Error'}</span>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#ef4444' }}
      />
    </>
  );
};
