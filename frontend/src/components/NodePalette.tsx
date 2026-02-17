import React, { useState } from 'react';
import {
  Play, Square, Diamond, StopCircle, GitBranch, Layers, User, Cpu, Clock,
  MessageSquare, Circle, Pentagon, Mail, AlertOctagon, Radio, Database,
  Folder, ChevronDown, ChevronRight, PanelLeftClose, PanelLeft,
} from 'lucide-react';

interface NodePaletteItem {
  type: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface NodeCategory {
  name: string;
  items: NodePaletteItem[];
}

const categories: NodeCategory[] = [
  {
    name: 'Flow',
    items: [
      { type: 'start', label: 'Start', icon: <Play className="w-4 h-4" />, color: 'bg-green-500', description: 'Process start point' },
      { type: 'end', label: 'End', icon: <StopCircle className="w-4 h-4" />, color: 'bg-red-500', description: 'Process end point' },
    ],
  },
  {
    name: 'Tasks',
    items: [
      { type: 'task', label: 'Task', icon: <Square className="w-4 h-4" />, color: 'bg-blue-500', description: 'Generic task or activity' },
      { type: 'userTask', label: 'User Task', icon: <User className="w-4 h-4" />, color: 'bg-emerald-500', description: 'Manual user task' },
      { type: 'systemTask', label: 'System Task', icon: <Cpu className="w-4 h-4" />, color: 'bg-indigo-500', description: 'Automated system task' },
      { type: 'subprocess', label: 'Subprocess', icon: <Layers className="w-4 h-4" />, color: 'bg-cyan-500', description: 'Reusable subprocess' },
    ],
  },
  {
    name: 'Gateways',
    items: [
      { type: 'decision', label: 'Decision (XOR)', icon: <Diamond className="w-4 h-4" />, color: 'bg-yellow-500', description: 'Exclusive decision point' },
      { type: 'parallelGateway', label: 'Parallel (AND)', icon: <GitBranch className="w-4 h-4" />, color: 'bg-purple-500', description: 'Parallel fork/join' },
      { type: 'inclusiveGateway', label: 'Inclusive (OR)', icon: <Circle className="w-4 h-4" />, color: 'bg-teal-500', description: 'Inclusive gateway' },
      { type: 'eventGateway', label: 'Event Gateway', icon: <Pentagon className="w-4 h-4" />, color: 'bg-pink-500', description: 'Event-based gateway' },
    ],
  },
  {
    name: 'Events',
    items: [
      { type: 'timer', label: 'Timer', icon: <Clock className="w-4 h-4" />, color: 'bg-amber-500', description: 'Time-based event' },
      { type: 'messageEvent', label: 'Message', icon: <Mail className="w-4 h-4" />, color: 'bg-blue-500', description: 'Message event' },
      { type: 'errorEvent', label: 'Error', icon: <AlertOctagon className="w-4 h-4" />, color: 'bg-red-500', description: 'Error event' },
      { type: 'signalEvent', label: 'Signal', icon: <Radio className="w-4 h-4" />, color: 'bg-purple-500', description: 'Signal event' },
    ],
  },
  {
    name: 'Data & Notes',
    items: [
      { type: 'dataObject', label: 'Data Object', icon: <Database className="w-4 h-4" />, color: 'bg-slate-400', description: 'Data object or store' },
      { type: 'annotation', label: 'Note', icon: <MessageSquare className="w-4 h-4" />, color: 'bg-yellow-400', description: 'Text annotation' },
      { type: 'group', label: 'Group', icon: <Folder className="w-4 h-4" />, color: 'bg-gray-400', description: 'Visual grouping' },
    ],
  },
];

interface NodePaletteProps {
  onAddNode: (type: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode, collapsed = false, onToggleCollapse }) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Flow: true,
    Tasks: true,
    Gateways: true,
    Events: true,
    'Data & Notes': true,
  });

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  if (collapsed) {
    return (
      <div className="w-10 bg-white border-r border-gray-200 flex flex-col items-center pt-2">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          title="Expand palette"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-52 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <span className="font-semibold text-xs text-gray-700 uppercase tracking-wide">Components</span>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            title="Collapse palette"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Scrollable categories */}
      <div className="flex-1 overflow-y-auto py-1">
        {categories.map((category) => (
          <div key={category.name}>
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider hover:bg-gray-50 transition-colors"
            >
              {expandedCategories[category.name] ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              {category.name}
            </button>

            {/* Category items */}
            {expandedCategories[category.name] && (
              <div className="px-2 pb-1 space-y-0.5">
                {category.items.map((item) => (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, item.type)}
                    onClick={() => onAddNode(item.type)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-grab active:cursor-grabbing
                      hover:bg-blue-50 hover:border-blue-200 border border-transparent
                      transition-all duration-100 group"
                    title={item.description}
                  >
                    <div className={`${item.color} text-white p-1 rounded flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      {React.cloneElement(item.icon as React.ReactElement, { className: 'w-3 h-3' })}
                    </div>
                    <span className="text-xs text-gray-700 font-medium truncate">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
