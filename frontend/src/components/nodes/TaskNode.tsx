import React from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import { PainPointBadge } from '../PainPointBadge';
import { Clock } from 'lucide-react';

export const TaskNode = React.memo(({ data, selected }: any) => {
  return (
    <div className="relative">
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={40}
        handleStyle={{
          width: '6px',
          height: '6px',
          borderRadius: '1px',
        }}
      />
      <div className={`
        bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-2 shadow-md min-w-[80px]
        border transition-all duration-200
        ${selected ? 'border-blue-700 shadow-lg ring-1 ring-blue-300' : 'border-blue-600'}
      `}>
        <div className="font-bold text-[10px] flex items-center justify-center">
          <span className="text-center truncate">{data.label || 'Task'}</span>
        </div>
        {data.duration && (
          <div className="text-[8px] flex items-center justify-center gap-0.5 opacity-90 mt-0.5">
            <Clock className="w-2 h-2" />
            <span>{data.duration}m</span>
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
        className="w-2 h-2 !bg-blue-700 border border-white hover:!bg-blue-800 transition-colors"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 !bg-blue-700 border border-white hover:!bg-blue-800 transition-colors"
      />
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
