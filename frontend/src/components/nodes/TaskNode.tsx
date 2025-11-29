import React from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import { PainPointBadge } from '../PainPointBadge';
import { Clock } from 'lucide-react';

export const TaskNode = React.memo(({ data, selected }: any) => {
  return (
    <div className="relative">
      <NodeResizer
        isVisible={selected}
        minWidth={40}
        minHeight={20}
        handleStyle={{
          width: '4px',
          height: '4px',
          borderRadius: '1px',
        }}
      />
      <div className={`
        bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-1 shadow-md min-w-[40px]
        border transition-all duration-200
        ${selected ? 'border-blue-700 shadow-lg ring-1 ring-blue-300' : 'border-blue-600'}
      `}>
        <div className="font-bold text-[8px] flex items-center justify-center">
          <span className="text-center truncate">{data.label || 'Task'}</span>
        </div>
        {data.duration && (
          <div className="text-[6px] flex items-center justify-center gap-0.5 opacity-90">
            <Clock className="w-1.5 h-1.5" />
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
