import React from 'react';
import { Handle, Position } from 'reactflow';
import { PainPointBadge } from '../PainPointBadge';
import { Play } from 'lucide-react';

export const StartNode = React.memo(({ data, selected }: any) => {
  return (
    <div className="relative">
      <div className={`
        bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full w-24 h-24
        flex flex-col items-center justify-center font-bold shadow-lg border-2 transition-all duration-200
        ${selected ? 'border-green-700 shadow-xl ring-2 ring-green-300 scale-105' : 'border-green-600'}
      `}>
        <Play className="w-6 h-6 mb-1" fill="white" />
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
        className="w-3 h-3 !bg-green-700 border-2 border-white hover:!bg-green-800 transition-colors"
      />
    </div>
  );
});

StartNode.displayName = 'StartNode';
