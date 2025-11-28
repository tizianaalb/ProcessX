import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const EndNode = React.memo(({ data }: NodeProps) => {
  return (
    <div className="relative">
      <div className="bg-red-500 text-white rounded-full w-20 h-20 flex items-center justify-center font-bold shadow-lg border-2 border-red-600">
        <span className="text-sm">END</span>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-red-600 border-2 border-white"
      />
    </div>
  );
});

EndNode.displayName = 'EndNode';
