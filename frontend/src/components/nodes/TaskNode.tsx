import React from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import { PainPointBadge } from '../PainPointBadge';
import { Clock } from 'lucide-react';

export const TaskNode = React.memo(({ data, selected }: any) => {
  return (
    <div className="relative">
      <NodeResizer
        isVisible={selected}
        minWidth={160}
        minHeight={80}
        handleStyle={{
          width: '8px',
          height: '8px',
          borderRadius: '2px',
        }}
      />
      <div className={`
        bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg min-w-[160px]
        border-2 transition-all duration-200
        ${selected ? 'border-blue-700 shadow-xl ring-2 ring-blue-300' : 'border-blue-600'}
      `}>
        <div className="font-bold text-sm mb-1 flex items-center justify-center gap-2">
          <span className="text-center">{data.label || 'Task'}</span>
        </div>
        {data.duration && (
          <div className="text-xs flex items-center justify-center gap-1 opacity-90 mt-1">
            <Clock className="w-3 h-3" />
            <span>{data.duration} min</span>
          </div>
        )}
        {data.description && (
          <div className="text-xs mt-2 opacity-80 text-center line-clamp-2 px-1">
            {data.description}
          </div>
        )}
      </div>
      {data.painPointCount > 0 && (
        <PainPointBadge
          count={data.painPointCount}
          severity={data.painPointSeverity}
        />
      )}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-700 border-2 border-white hover:!bg-blue-800 transition-colors"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-700 border-2 border-white hover:!bg-blue-800 transition-colors"
      />
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
