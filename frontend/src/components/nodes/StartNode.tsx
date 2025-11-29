import React from 'react';
import { Handle, Position } from 'reactflow';
import { PainPointBadge } from '../PainPointBadge';
import { Play } from 'lucide-react';

export const StartNode = React.memo(({ data, selected }: any) => {
  return (
    <div className="relative">
      <div className={`
        bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full w-8 h-8
        flex flex-col items-center justify-center font-bold shadow-md border transition-all duration-200
        ${selected ? 'border-green-700 shadow-lg ring-1 ring-green-300 scale-110' : 'border-green-600'}
      `}>
        <Play className="w-3 h-3" fill="white" />
        <span className="text-[6px]">START</span>
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
        className="w-2 h-2 !bg-green-700 border border-white hover:!bg-green-800 transition-colors"
      />
    </div>
  );
});

StartNode.displayName = 'StartNode';
