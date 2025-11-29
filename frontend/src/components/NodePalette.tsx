import React from 'react';
import { Play, Square, Diamond, StopCircle } from 'lucide-react';

interface NodePaletteItem {
  type: 'start' | 'task' | 'decision' | 'end';
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const paletteItems: NodePaletteItem[] = [
  {
    type: 'start',
    label: 'Start',
    icon: <Play className="w-5 h-5" />,
    color: 'bg-green-500',
    description: 'Process start point',
  },
  {
    type: 'task',
    label: 'Task',
    icon: <Square className="w-5 h-5" />,
    color: 'bg-blue-500',
    description: 'Activity or step',
  },
  {
    type: 'decision',
    label: 'Decision',
    icon: <Diamond className="w-5 h-5" />,
    color: 'bg-yellow-500',
    description: 'Decision point',
  },
  {
    type: 'end',
    label: 'End',
    icon: <StopCircle className="w-5 h-5" />,
    color: 'bg-red-500',
    description: 'Process end point',
  },
];

interface NodePaletteProps {
  onAddNode: (type: 'start' | 'task' | 'decision' | 'end') => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-40 w-44">
      <div className="mb-2 pb-1.5 border-b border-gray-200">
        <h3 className="font-bold text-gray-900 text-xs">Components</h3>
      </div>

      <div className="space-y-1.5">
        {paletteItems.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => onDragStart(e, item.type)}
            onClick={() => onAddNode(item.type)}
            className="flex items-center gap-2 p-1.5 rounded-md border border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-move transition-all duration-150 group"
            title={item.description}
          >
            <div className={`${item.color} text-white p-1.5 rounded group-hover:scale-110 transition-transform`}>
              {React.cloneElement(item.icon as React.ReactElement, { size: 16 })}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs text-gray-900 truncate">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
