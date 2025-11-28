import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const TaskNode = React.memo(({ data }: NodeProps) => {
  return (
    <div className="relative">
      <div className="bg-blue-500 text-white rounded-lg p-4 shadow-lg min-w-[160px] border-2 border-blue-600">
        <div className="font-bold text-center text-sm mb-1">{data.label || 'Task'}</div>
        {data.duration && (
          <div className="text-xs text-center opacity-90">
            {data.duration} min
          </div>
        )}
        {data.description && (
          <div className="text-xs mt-1 opacity-80 text-center line-clamp-2">
            {data.description}
          </div>
        )}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-600 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-600 border-2 border-white"
      />
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
