import React from 'react';
import { Clock } from 'lucide-react';
import { Handle, Position, NodeResizer } from 'reactflow';

interface TimerNodeProps {
  data: {
    label?: string;
  };
  selected?: boolean;
}

export const TimerNode: React.FC<TimerNodeProps> = ({ data, selected }) => {
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
        style={{ background: '#f59e0b' }}
      />

      {/* Timer Circle with dashed border */}
      <div className={`
        bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-full w-9 h-9
        flex flex-col items-center justify-center font-bold shadow-md border-2 border-dashed transition-all duration-200
        ${selected ? 'border-amber-700 shadow-lg ring-1 ring-amber-300 scale-110' : 'border-amber-400'}
      `}>
        <Clock className="w-3 h-3" />
        <span className="text-[6px] mt-0.5 truncate max-w-[28px]">{data.label || 'Timer'}</span>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#f59e0b' }}
      />
    </>
  );
};
