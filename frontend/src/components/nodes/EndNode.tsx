import React from 'react';
import { Handle, Position } from 'reactflow';
import { PainPointBadge } from '../PainPointBadge';
import { StopCircle } from 'lucide-react';

export const EndNode = React.memo(({ data, selected }: any) => {
  return (
    <div className="relative">
      <div className={`
        bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full w-24 h-24
        flex flex-col items-center justify-center font-bold shadow-lg border-2 transition-all duration-200
        ${selected ? 'border-red-700 shadow-xl ring-2 ring-red-300 scale-105' : 'border-red-600'}
      `}>
        <StopCircle className="w-6 h-6 mb-1" fill="white" />
        <span className="text-sm">END</span>
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
        className="w-3 h-3 !bg-red-700 border-2 border-white hover:!bg-red-800 transition-colors"
      />
    </div>
  );
});

EndNode.displayName = 'EndNode';
