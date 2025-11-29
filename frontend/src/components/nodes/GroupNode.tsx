import React from 'react';
import { Folder } from 'lucide-react';
import { NodeResizer } from 'reactflow';

interface GroupNodeProps {
  data: {
    label?: string;
  };
  selected?: boolean;
}

export const GroupNode: React.FC<GroupNodeProps> = ({ data, selected }) => {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={100}
        handleStyle={{
          width: '6px',
          height: '6px',
          borderRadius: '2px',
        }}
      />

      {/* Group container - visual grouping for other nodes */}
      <div className={`
        bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl min-w-[120px] min-h-[100px]
        border-2 border-dashed transition-all duration-200 relative
        ${selected ? 'border-gray-500 shadow-lg' : 'border-gray-300'}
      `}>
        {/* Group header */}
        <div className="absolute -top-3 left-2 bg-white px-2 py-0.5 rounded-md border border-gray-300 shadow-sm flex items-center gap-1">
          <Folder className="w-3 h-3 text-gray-500" />
          <span className="text-[9px] font-bold text-gray-700">
            {data.label || 'Group'}
          </span>
        </div>

        {/* Group content area - transparent to allow other nodes to be visible */}
        <div className="w-full h-full p-4 flex items-center justify-center">
          <span className="text-xs text-gray-400 italic">
            Place nodes here
          </span>
        </div>
      </div>
    </>
  );
};
