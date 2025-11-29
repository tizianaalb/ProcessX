import React from 'react';
import { Radio } from 'lucide-react';
import { Handle, Position, NodeResizer } from 'reactflow';

interface SignalEventNodeProps {
  data: {
    label?: string;
    eventType?: 'throw' | 'catch' | 'intermediate';
  };
  selected?: boolean;
}

export const SignalEventNode: React.FC<SignalEventNodeProps> = ({ data, selected }) => {
  const eventType = data.eventType || 'intermediate';
  const isFilled = eventType === 'throw';

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={35}
        minHeight={35}
        handleStyle={{
          width: '4px',
          height: '4px',
          borderRadius: '1px',
        }}
      />

      {/* Input Handle */}
      {eventType !== 'throw' && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: '#a855f7' }}
        />
      )}

      {/* Signal Event Circle */}
      <div className={`
        ${isFilled ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-white border-4 border-purple-500'}
        text-${isFilled ? 'white' : 'purple-600'} rounded-full w-9 h-9
        flex flex-col items-center justify-center font-bold shadow-md transition-all duration-200
        ${selected ? 'shadow-lg ring-2 ring-purple-300 scale-110' : ''}
      `}>
        <Radio className="w-3 h-3" fill={isFilled ? 'white' : 'none'} />
        <span className="text-[6px] mt-0.5 truncate max-w-[28px]">{data.label || 'Signal'}</span>
      </div>

      {/* Output Handle */}
      {eventType !== 'catch' && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: '#a855f7' }}
        />
      )}
    </>
  );
};
