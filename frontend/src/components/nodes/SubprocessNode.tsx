import React from 'react';
import { Layers } from 'lucide-react';
import { Handle, Position, NodeResizer } from 'reactflow';

interface SubprocessNodeProps {
  data: {
    label?: string;
  };
  selected?: boolean;
}

export const SubprocessNode: React.FC<SubprocessNodeProps> = ({ data, selected }) => {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={60}
        minHeight={30}
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
        style={{ background: '#06b6d4' }}
      />

      {/* Subprocess Box with distinctive styling */}
      <div className={`
        bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg p-1.5 shadow-md min-w-[60px]
        border-2 transition-all duration-200
        ${selected ? 'border-cyan-700 shadow-lg ring-1 ring-cyan-300' : 'border-cyan-600'}
      `}>
        <div className="flex items-center gap-1 justify-center">
          <Layers className="w-3 h-3 flex-shrink-0" />
          <div className="font-bold text-[8px] text-center truncate flex-1">
            {data.label || 'Subprocess'}
          </div>
        </div>
        {/* Subprocess indicator - small plus at bottom */}
        <div className="flex justify-center mt-0.5">
          <div className="w-2 h-2 border border-white rounded-sm flex items-center justify-center text-[6px] font-bold">
            +
          </div>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#06b6d4' }}
      />
    </>
  );
};
