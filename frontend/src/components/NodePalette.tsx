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
    <div className="absolute top-4 left-4 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-40">
      <div className="mb-3 pb-2 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 text-sm">Components</h3>
        <p className="text-xs text-gray-500 mt-1">Drag to canvas or click to add</p>
      </div>

      <div className="space-y-2">
        {paletteItems.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => onDragStart(e, item.type)}
            onClick={() => onAddNode(item.type)}
            className="flex items-center gap-3 p-2.5 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-move transition-all duration-150 group"
          >
            <div className={`${item.color} text-white p-2 rounded-md group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900">{item.label}</div>
              <div className="text-xs text-gray-500">{item.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          <p>💡 <strong>Tip:</strong> Drag components onto the canvas</p>
        </div>
      </div>
    </div>
  );
};
