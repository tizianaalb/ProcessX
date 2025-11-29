import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Diamond, StopCircle, GripVertical, GitBranch, Layers, User, Cpu, Clock, MessageSquare, Circle, Pentagon, Mail, AlertOctagon, Radio, Database, Folder } from 'lucide-react';

interface NodePaletteItem {
  type: 'start' | 'task' | 'decision' | 'end' | 'parallelGateway' | 'subprocess' | 'userTask' | 'systemTask' | 'timer' | 'annotation' | 'inclusiveGateway' | 'eventGateway' | 'messageEvent' | 'errorEvent' | 'signalEvent' | 'dataObject' | 'group';
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  category?: 'basic' | 'task' | 'gateway' | 'event' | 'data';
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
    type: 'end',
    label: 'End',
    icon: <StopCircle className="w-5 h-5" />,
    color: 'bg-red-500',
    description: 'Process end point',
  },
  {
    type: 'task',
    label: 'Task',
    icon: <Square className="w-5 h-5" />,
    color: 'bg-blue-500',
    description: 'Generic task or activity',
  },
  {
    type: 'userTask',
    label: 'User Task',
    icon: <User className="w-5 h-5" />,
    color: 'bg-emerald-500',
    description: 'Manual task performed by user',
  },
  {
    type: 'systemTask',
    label: 'System Task',
    icon: <Cpu className="w-5 h-5" />,
    color: 'bg-indigo-500',
    description: 'Automated system task',
  },
  {
    type: 'decision',
    label: 'Decision',
    icon: <Diamond className="w-5 h-5" />,
    color: 'bg-yellow-500',
    description: 'Exclusive decision point (XOR)',
  },
  {
    type: 'parallelGateway',
    label: 'Parallel',
    icon: <GitBranch className="w-5 h-5" />,
    color: 'bg-purple-500',
    description: 'Parallel gateway (AND fork/join)',
  },
  {
    type: 'subprocess',
    label: 'Subprocess',
    icon: <Layers className="w-5 h-5" />,
    color: 'bg-cyan-500',
    description: 'Reusable subprocess',
  },
  {
    type: 'timer',
    label: 'Timer',
    icon: <Clock className="w-5 h-5" />,
    color: 'bg-amber-500',
    description: 'Time-based event or delay',
  },
  {
    type: 'annotation',
    label: 'Note',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'bg-yellow-400',
    description: 'Add text annotation',
    category: 'data',
  },
  // Phase 2 - Advanced Gateways
  {
    type: 'inclusiveGateway',
    label: 'Inclusive',
    icon: <Circle className="w-5 h-5" />,
    color: 'bg-teal-500',
    description: 'Inclusive gateway (OR - one or more paths)',
    category: 'gateway',
  },
  {
    type: 'eventGateway',
    label: 'Event Gateway',
    icon: <Pentagon className="w-5 h-5" />,
    color: 'bg-pink-500',
    description: 'Event-based gateway (wait for events)',
    category: 'gateway',
  },
  // Phase 2 - Events
  {
    type: 'messageEvent',
    label: 'Message',
    icon: <Mail className="w-5 h-5" />,
    color: 'bg-blue-500',
    description: 'Message event (send/receive)',
    category: 'event',
  },
  {
    type: 'errorEvent',
    label: 'Error',
    icon: <AlertOctagon className="w-5 h-5" />,
    color: 'bg-red-500',
    description: 'Error event (exception handling)',
    category: 'event',
  },
  {
    type: 'signalEvent',
    label: 'Signal',
    icon: <Radio className="w-5 h-5" />,
    color: 'bg-purple-500',
    description: 'Signal event (broadcast)',
    category: 'event',
  },
  // Phase 2 - Data & Organization
  {
    type: 'dataObject',
    label: 'Data',
    icon: <Database className="w-5 h-5" />,
    color: 'bg-slate-400',
    description: 'Data object or store',
    category: 'data',
  },
  {
    type: 'group',
    label: 'Group',
    icon: <Folder className="w-5 h-5" />,
    color: 'bg-gray-300',
    description: 'Visual grouping container',
    category: 'data',
  },
];

interface NodePaletteProps {
  onAddNode: (type: 'start' | 'task' | 'decision' | 'end' | 'parallelGateway' | 'subprocess' | 'userTask' | 'systemTask' | 'timer' | 'annotation' | 'inclusiveGateway' | 'eventGateway' | 'messageEvent' | 'errorEvent' | 'signalEvent' | 'dataObject' | 'group') => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('nodePalettePosition');
    return saved ? JSON.parse(saved) : { x: 16, y: 16 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const paletteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('nodePalettePosition', JSON.stringify(position));
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      ref={paletteRef}
      style={{ left: position.x, top: position.y }}
      className="absolute bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-40 w-44"
      onMouseDown={handleMouseDown}
    >
      <div className="mb-2 pb-1.5 border-b border-gray-200 flex items-center gap-1 drag-handle cursor-move">
        <GripVertical className="w-3 h-3 text-gray-400" />
        <h3 className="font-bold text-gray-900 text-xs flex-1">Components</h3>
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
