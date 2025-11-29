import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface NodePropertiesPanelProps {
  node: any;
  onClose: () => void;
  onSave: (nodeId: string, data: any) => void;
}

export const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  node,
  onClose,
  onSave,
}) => {
  const [label, setLabel] = useState(node.data.label || '');
  const [description, setDescription] = useState(node.data.description || '');
  const [duration, setDuration] = useState(node.data.duration || '');

  useEffect(() => {
    setLabel(node.data.label || '');
    setDescription(node.data.description || '');
    setDuration(node.data.duration || '');
  }, [node]);

  const handleSave = () => {
    onSave(node.id, {
      ...node.data,
      label,
      description,
      duration: duration ? parseInt(duration) : undefined,
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <div className="absolute top-4 right-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-40">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="font-semibold text-gray-900">Node Properties</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node Type
          </label>
          <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 capitalize">
            {node.type}
          </div>
        </div>

        <div>
          <label htmlFor="node-label" className="block text-sm font-medium text-gray-700 mb-1">
            Label *
          </label>
          <Input
            id="node-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter node label"
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="node-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="node-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter description (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        {node.type === 'task' && (
          <div>
            <label htmlFor="node-duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <Input
              id="node-duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0"
              className="w-full"
              min="0"
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={!label.trim()}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>

        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
          <p>💡 Tip: Press Ctrl+Enter to save</p>
        </div>
      </div>
    </div>
  );
};
