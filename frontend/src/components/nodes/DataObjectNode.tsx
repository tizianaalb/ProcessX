import React from 'react';
import { Database } from 'lucide-react';
import { NodeResizer } from 'reactflow';

interface DataObjectNodeProps {
  data: {
    label?: string;
    dataType?: 'input' | 'output' | 'store';
  };
  selected?: boolean;
}

export const DataObjectNode: React.FC<DataObjectNodeProps> = ({ data, selected }) => {
  const dataType = data.dataType || 'store';

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={50}
        minHeight={60}
        handleStyle={{
          width: '4px',
          height: '4px',
          borderRadius: '1px',
        }}
      />

      {/* Data Object - Document/Page shape */}
      <div className={`
        bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 rounded-t-lg min-w-[50px] min-h-[60px]
        border-2 transition-all duration-200 relative
        ${selected ? 'border-slate-500 shadow-lg ring-2 ring-slate-300' : 'border-slate-400'}
      `}>
        {/* Folded corner effect */}
        <div className="absolute top-0 right-0 w-3 h-3 bg-slate-300 border-l-2 border-b-2 border-slate-400"></div>

        <div className="p-2 flex flex-col items-center justify-center h-full">
          <Database className="w-4 h-4 mb-1 text-slate-600" strokeWidth={2.5} />
          <div className="text-[8px] font-bold text-center truncate w-full px-1">
            {data.label || 'Data'}
          </div>
          <div className="text-[6px] text-slate-500 mt-0.5">
            {dataType === 'input' ? '📥' : dataType === 'output' ? '📤' : '💾'}
          </div>
        </div>
      </div>
    </>
  );
};
