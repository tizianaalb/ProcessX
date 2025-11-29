import React from 'react';
import { Handle, Position } from 'reactflow';
import { PainPointBadge } from '../PainPointBadge';
import { HelpCircle } from 'lucide-react';

export const DecisionNode = React.memo(({ data, selected }: any) => {
  return (
    <div className="relative">
      <div className={`
        bg-gradient-to-br from-yellow-500 to-yellow-600 text-white transform rotate-45 w-32 h-32
        flex items-center justify-center shadow-lg border-2 transition-all duration-200
        ${selected ? 'border-yellow-700 shadow-xl ring-2 ring-yellow-300 scale-105' : 'border-yellow-600'}
      `}>
        <div className="transform -rotate-45 text-xs font-bold text-center px-2">
          <HelpCircle className="w-5 h-5 mx-auto mb-1" />
          <div className="line-clamp-2">{data.label || 'Decision'}</div>
        </div>
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
        className="w-3 h-3 !bg-yellow-700 border-2 border-white hover:!bg-yellow-800 transition-colors -left-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        className="w-3 h-3 !bg-yellow-700 border-2 border-white hover:!bg-yellow-800 transition-colors -right-1.5"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        className="w-3 h-3 !bg-yellow-700 border-2 border-white hover:!bg-yellow-800 transition-colors -bottom-1.5"
      />
    </div>
  );
});

DecisionNode.displayName = 'DecisionNode';
