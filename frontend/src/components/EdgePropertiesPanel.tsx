import { useState, useEffect } from 'react';
import { X, ArrowRight, Tag, FileText, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface EdgePropertiesPanelProps {
  edge: {
    id: string;
    source: string;
    target: string;
    label?: string;
    type?: string;
    data?: {
      condition?: string;
      probability?: number;
      description?: string;
    };
  };
  sourceNodeLabel?: string;
  targetNodeLabel?: string;
  onClose: () => void;
  onSave: (edgeId: string, data: {
    label?: string;
    type?: string;
    data?: {
      condition?: string;
      probability?: number;
      description?: string;
    };
  }) => void;
  onDelete: (edgeId: string) => void;
}

export const EdgePropertiesPanel = ({
  edge,
  sourceNodeLabel,
  targetNodeLabel,
  onClose,
  onSave,
  onDelete,
}: EdgePropertiesPanelProps) => {
  const [label, setLabel] = useState(edge.label || '');
  const [condition, setCondition] = useState(edge.data?.condition || '');
  const [probability, setProbability] = useState(edge.data?.probability?.toString() || '');
  const [description, setDescription] = useState(edge.data?.description || '');
  const [edgeType, setEdgeType] = useState(edge.type || 'default');

  useEffect(() => {
    setLabel(edge.label || '');
    setCondition(edge.data?.condition || '');
    setProbability(edge.data?.probability?.toString() || '');
    setDescription(edge.data?.description || '');
    setEdgeType(edge.type || 'default');
  }, [edge]);

  const handleSave = () => {
    onSave(edge.id, {
      label: label || undefined,
      type: edgeType,
      data: {
        condition: condition || undefined,
        probability: probability ? parseFloat(probability) : undefined,
        description: description || undefined,
      },
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="absolute top-4 right-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-white" />
          <h3 className="text-white font-semibold">Connection Properties</h3>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Connection Info */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
            {sourceNodeLabel || 'Source'}
          </span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
            {targetNodeLabel || 'Target'}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="p-4 space-y-4">
        {/* Label */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <Tag className="w-4 h-4" />
            Label
          </label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Yes, No, Approved, Rejected"
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Displayed on the connection line
          </p>
        </div>

        {/* Connection Type */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <Zap className="w-4 h-4" />
            Connection Type
          </label>
          <select
            value={edgeType}
            onChange={(e) => setEdgeType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="default">Default (solid line)</option>
            <option value="step">Conditional (animated)</option>
          </select>
        </div>

        {/* Condition Expression */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <FileText className="w-4 h-4" />
            Condition (optional)
          </label>
          <Input
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="e.g., amount > 1000"
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Business rule or condition for this path
          </p>
        </div>

        {/* Probability */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Probability % (optional)
          </label>
          <Input
            type="number"
            min="0"
            max="100"
            value={probability}
            onChange={(e) => setProbability(e.target.value)}
            placeholder="e.g., 80"
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Likelihood this path is taken (for analysis)
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional notes about this connection..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            rows={2}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(edge.id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Delete
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Save
          </Button>
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="px-4 py-2 bg-gray-100 text-xs text-gray-500 text-center">
        Press <kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+Enter</kbd> to save,{' '}
        <kbd className="px-1 py-0.5 bg-gray-200 rounded">Esc</kbd> to close
      </div>
    </div>
  );
};
