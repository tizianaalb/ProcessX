import React from 'react';
import { Mail } from 'lucide-react';
import { Handle, Position, NodeResizer } from 'reactflow';

interface MessageEventNodeProps {
  data: {
    label?: string;
    eventType?: 'send' | 'receive' | 'intermediate';
  };
  selected?: boolean;
}

export const MessageEventNode: React.FC<MessageEventNodeProps> = ({ data, selected }) => {
  const eventType = data.eventType || 'intermediate';
  const isFilled = eventType === 'send';

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
      {eventType !== 'send' && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: '#3b82f6' }}
        />
      )}

      {/* Message Event Circle */}
      <div className={`
        ${isFilled ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-white border-4 border-blue-500'}
        text-${isFilled ? 'white' : 'blue-600'} rounded-full w-9 h-9
        flex flex-col items-center justify-center font-bold shadow-md transition-all duration-200
        ${selected ? 'shadow-lg ring-2 ring-blue-300 scale-110' : ''}
      `}>
        <Mail className="w-3 h-3" fill={isFilled ? 'white' : 'none'} />
        <span className="text-[6px] mt-0.5 truncate max-w-[28px]">{data.label || 'Msg'}</span>
      </div>

      {/* Output Handle */}
      {eventType !== 'receive' && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: '#3b82f6' }}
        />
      )}
    </>
  );
};
