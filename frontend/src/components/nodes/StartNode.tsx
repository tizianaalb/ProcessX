import React from 'react';
import { Handle, Position } from 'reactflow';
import { PainPointBadge } from '../PainPointBadge';

export const StartNode = React.memo(({ data }: any) => {
  return (
    <div className="relative">
      <div className="bg-green-500 text-white rounded-full w-20 h-20 flex items-center justify-center font-bold shadow-lg border-2 border-green-600">
        <span className="text-sm">START</span>
      </div>
      {data.painPointCount > 0 && (
        <PainPointBadge
          count={data.painPointCount}
          severity={data.painPointSeverity}
        />
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-600 border-2 border-white"
      />
    </div>
  );
});

StartNode.displayName = 'StartNode';
