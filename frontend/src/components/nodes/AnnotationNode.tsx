import React from 'react';
import { MessageSquare } from 'lucide-react';
import { NodeResizer } from 'reactflow';

interface AnnotationNodeProps {
  data: {
    label?: string;
  };
  selected?: boolean;
}

export const AnnotationNode: React.FC<AnnotationNodeProps> = ({ data, selected }) => {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={40}
        handleStyle={{
          width: '4px',
          height: '4px',
          borderRadius: '1px',
        }}
      />

      {/* Annotation Box - No handles, it's just a note */}
      <div className={`
        bg-gradient-to-br from-yellow-50 to-yellow-100 text-gray-800 rounded-lg p-2 shadow-sm min-w-[80px] min-h-[40px]
        border-2 border-l-4 transition-all duration-200
        ${selected ? 'border-yellow-400 border-l-yellow-500 shadow-md ring-1 ring-yellow-300' : 'border-yellow-300 border-l-yellow-400'}
      `}>
        <div className="flex items-start gap-1">
          <MessageSquare className="w-3 h-3 flex-shrink-0 text-yellow-600 mt-0.5" />
          <div className="text-[9px] leading-tight flex-1">
            {data.label || 'Add note...'}
          </div>
        </div>
      </div>
    </>
  );
};
