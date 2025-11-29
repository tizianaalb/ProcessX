import React from 'react';
import { Handle, Position } from 'reactflow';
import { PainPointBadge } from '../PainPointBadge';
import { HelpCircle } from 'lucide-react';

export const DecisionNode = React.memo(({ data, selected }: any) => {
  return (
    <div className="relative">
      <div className={`
        bg-gradient-to-br from-yellow-500 to-yellow-600 text-white transform rotate-45 w-20 h-20
        flex items-center justify-center shadow-md border transition-all duration-200
        ${selected ? 'border-yellow-700 shadow-lg ring-1 ring-yellow-300 scale-110' : 'border-yellow-600'}
      `}>
        <div className="transform -rotate-45 text-[8px] font-bold text-center px-1">
          <HelpCircle className="w-3 h-3 mx-auto" />
          <div className="line-clamp-1 mt-0.5">{data.label || 'Decision'}</div>
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
        className="w-2 h-2 !bg-yellow-700 border border-white hover:!bg-yellow-800 transition-colors -left-1"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        className="w-2 h-2 !bg-yellow-700 border border-white hover:!bg-yellow-800 transition-colors -right-1"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        className="w-2 h-2 !bg-yellow-700 border border-white hover:!bg-yellow-800 transition-colors -bottom-1"
      />
    </div>
  );
});

DecisionNode.displayName = 'DecisionNode';
