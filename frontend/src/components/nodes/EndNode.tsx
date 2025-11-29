import React from 'react';
import { Handle, Position } from 'reactflow';
import { PainPointBadge } from '../PainPointBadge';
import { StopCircle } from 'lucide-react';

export const EndNode = React.memo(({ data, selected }: any) => {
  return (
    <div className="relative">
      <div className={`
        bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full w-16 h-16
        flex flex-col items-center justify-center font-bold shadow-md border transition-all duration-200
        ${selected ? 'border-red-700 shadow-lg ring-1 ring-red-300 scale-110' : 'border-red-600'}
      `}>
        <StopCircle className="w-4 h-4" fill="white" />
        <span className="text-[8px] mt-0.5">END</span>
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
        className="w-2 h-2 !bg-red-700 border border-white hover:!bg-red-800 transition-colors"
      />
    </div>
  );
});

EndNode.displayName = 'EndNode';
