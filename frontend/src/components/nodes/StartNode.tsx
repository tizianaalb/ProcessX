import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const StartNode = React.memo(({ data }: NodeProps) => {
  return (
    <div className="relative">
      <div className="bg-green-500 text-white rounded-full w-20 h-20 flex items-center justify-center font-bold shadow-lg border-2 border-green-600">
        <span className="text-sm">START</span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-600 border-2 border-white"
      />
    </div>
  );
});

StartNode.displayName = 'StartNode';
