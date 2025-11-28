import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const DecisionNode = React.memo(({ data }: NodeProps) => {
  return (
    <div className="relative">
      <div className="bg-yellow-500 text-white transform rotate-45 w-28 h-28 flex items-center justify-center shadow-lg border-2 border-yellow-600">
        <div className="transform -rotate-45 text-xs font-bold text-center px-2">
          {data.label || 'Decision'}
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-yellow-600 border-2 border-white -left-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        className="w-3 h-3 bg-yellow-600 border-2 border-white -right-1.5"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        className="w-3 h-3 bg-yellow-600 border-2 border-white -bottom-1.5"
      />
    </div>
  );
});

DecisionNode.displayName = 'DecisionNode';
