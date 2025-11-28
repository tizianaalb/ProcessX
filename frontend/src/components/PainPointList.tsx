import { AlertTriangle, Edit2, Trash2, DollarSign, Clock } from 'lucide-react';
import { Button } from './ui/button';
import type { PainPoint } from '../lib/api';

interface PainPointListProps {
  painPoints: PainPoint[];
  onEdit: (painPoint: PainPoint) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const SEVERITY_COLORS = {
  LOW: 'bg-green-100 text-green-800 border-green-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
};

const CATEGORY_LABELS: Record<string, string> = {
  BOTTLENECK: 'Bottleneck',
  REWORK: 'Rework',
  WASTE: 'Waste',
  MANUAL_PROCESS: 'Manual Process',
  COMPLIANCE_RISK: 'Compliance Risk',
  SYSTEM_LIMITATION: 'System Limitation',
  COMMUNICATION_GAP: 'Communication Gap',
};

const STATUS_COLORS = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  RESOLVED: 'bg-green-100 text-green-800',
  DISMISSED: 'bg-gray-100 text-gray-800',
};

export const PainPointList = ({
  painPoints,
  onEdit,
  onDelete,
  loading,
}: PainPointListProps) => {
  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="animate-pulse">Loading pain points...</div>
      </div>
    );
  }

  if (painPoints.length === 0) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="mx-auto text-gray-300 mb-3" size={48} />
        <p className="text-gray-500 text-sm">No pain points identified yet</p>
        <p className="text-gray-400 text-xs mt-1">
          Click on a process step to add pain points
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {painPoints.map((painPoint) => (
        <div
          key={painPoint.id}
          className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                    SEVERITY_COLORS[painPoint.severity]
                  }`}
                >
                  {painPoint.severity}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  {CATEGORY_LABELS[painPoint.category]}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {painPoint.title}
              </h3>
            </div>
            <div className="flex gap-1 ml-2">
              <button
                onClick={() => onEdit(painPoint)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                title="Edit"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Are you sure you want to delete this pain point?'
                    )
                  ) {
                    onDelete(painPoint.id);
                  }
                }}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {painPoint.processStep && (
            <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
              <span className="font-medium">Step:</span>
              <span>{painPoint.processStep.name}</span>
            </div>
          )}

          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {painPoint.description}
          </p>

          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            {painPoint.estimatedCost !== null &&
              painPoint.estimatedCost !== undefined && (
                <div className="flex items-center gap-1">
                  <DollarSign size={12} />
                  <span>
                    ${painPoint.estimatedCost.toLocaleString()}/year
                  </span>
                </div>
              )}
            {painPoint.estimatedTime !== null &&
              painPoint.estimatedTime !== undefined && (
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{painPoint.estimatedTime} min</span>
                </div>
              )}
            {painPoint.frequency && (
              <div className="text-xs text-gray-500">
                {painPoint.frequency.charAt(0) +
                  painPoint.frequency.slice(1).toLowerCase()}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                STATUS_COLORS[painPoint.status]
              }`}
            >
              {painPoint.status.replace('_', ' ')}
            </span>
            <div className="text-xs text-gray-500">
              {painPoint.identifiedBy.firstName} {painPoint.identifiedBy.lastName}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
