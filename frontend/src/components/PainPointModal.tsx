import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import type { PainPoint, CreatePainPointData } from '../lib/api';

interface PainPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePainPointData) => Promise<void>;
  processStepId?: string;
  processStepName?: string;
  existingPainPoint?: PainPoint;
}

const CATEGORIES = [
  { value: 'BOTTLENECK', label: 'Bottleneck' },
  { value: 'REWORK', label: 'Rework' },
  { value: 'WASTE', label: 'Waste' },
  { value: 'MANUAL_PROCESS', label: 'Manual Process' },
  { value: 'COMPLIANCE_RISK', label: 'Compliance Risk' },
  { value: 'SYSTEM_LIMITATION', label: 'System Limitation' },
  { value: 'COMMUNICATION_GAP', label: 'Communication Gap' },
] as const;

const SEVERITIES = [
  { value: 'LOW', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100 text-red-800' },
] as const;

const FREQUENCIES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUALLY', label: 'Annually' },
] as const;

export const PainPointModal = ({
  isOpen,
  onClose,
  onSubmit,
  processStepId,
  processStepName,
  existingPainPoint,
}: PainPointModalProps) => {
  const [formData, setFormData] = useState<CreatePainPointData>({
    processStepId,
    category: 'BOTTLENECK',
    severity: 'MEDIUM',
    title: '',
    description: '',
    impact: '',
    estimatedCost: undefined,
    estimatedTime: undefined,
    frequency: undefined,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existingPainPoint) {
      setFormData({
        processStepId: existingPainPoint.processStepId,
        category: existingPainPoint.category,
        severity: existingPainPoint.severity,
        title: existingPainPoint.title,
        description: existingPainPoint.description,
        impact: existingPainPoint.impact,
        estimatedCost: existingPainPoint.estimatedCost,
        estimatedTime: existingPainPoint.estimatedTime,
        frequency: existingPainPoint.frequency,
      });
    } else {
      setFormData({
        processStepId,
        category: 'BOTTLENECK',
        severity: 'MEDIUM',
        title: '',
        description: '',
        impact: '',
        estimatedCost: undefined,
        estimatedTime: undefined,
        frequency: undefined,
      });
    }
  }, [existingPainPoint, processStepId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in title and description');
      return;
    }

    try {
      setSubmitting(true);
      // Clean up the data before sending - remove empty strings and convert to undefined
      const cleanedData: CreatePainPointData = {
        processStepId: formData.processStepId || undefined,
        category: formData.category,
        severity: formData.severity,
        title: formData.title.trim(),
        description: formData.description.trim(),
        impact: formData.impact?.trim() || undefined,
        estimatedCost: formData.estimatedCost,
        estimatedTime: formData.estimatedTime,
        frequency: formData.frequency,
      };
      await onSubmit(cleanedData);
      onClose();
    } catch (error: any) {
      console.error('Failed to save pain point:', error);
      alert('Failed to save pain point: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {existingPainPoint ? 'Edit Pain Point' : 'Add Pain Point'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={submitting}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {processStepName && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-900">
                <strong>Process Step:</strong> {processStepName}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity *
              </label>
              <select
                value={formData.severity}
                onChange={(e) =>
                  setFormData({ ...formData, severity: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {SEVERITIES.map((sev) => (
                  <option key={sev.value} value={sev.value}>
                    {sev.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief title describing the pain point"
              maxLength={255}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detailed description of the pain point..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Impact
            </label>
            <textarea
              value={formData.impact || ''}
              onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
              placeholder="How does this affect the business?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                value={formData.frequency || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    frequency: e.target.value ? (e.target.value as any) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not specified</option>
                {FREQUENCIES.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Cost ($)
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={formData.estimatedCost || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedCost: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time (min)
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={formData.estimatedTime || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedTime: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : existingPainPoint ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
