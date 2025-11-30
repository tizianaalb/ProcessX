import React, { useState, useEffect } from 'react';
import { X, FileText, Users, Clock, ChevronRight, Loader } from 'lucide-react';
import { api } from '../lib/api';
import type { ProcessTemplate } from '../lib/api';
import { Button } from './ui/button';

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [templates, setTemplates] = useState<ProcessTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ProcessTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, selectedCategory]);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : undefined;
      const result = await api.getTemplates(params);

      if (result.success) {
        setTemplates(result.templates);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async () => {
    if (!selectedTemplate) return;

    setIsCreating(true);
    setError(null);

    try {
      const result = await api.useTemplate(selectedTemplate.id);

      if (result.success) {
        onSuccess();
        handleClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create process from template');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setSelectedCategory('all');
    setError(null);
    onClose();
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      claims: 'Claims Processing',
      underwriting: 'Underwriting',
      policy: 'Policy Management',
      customer: 'Customer Service',
      billing: 'Billing & Payments',
    };
    return labels[category] || category;
  };

  const filteredTemplates = templates;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 p-6 flex items-center justify-between border-b border-blue-700">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-100" />
            <h2 className="text-2xl font-bold text-white">
              Process Template Library
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-blue-100 hover:text-white transition-colors"
            disabled={isCreating}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Category Filter */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              disabled={loading}
            >
              <option value="all">All Categories</option>
              <option value="claims">Claims Processing</option>
              <option value="underwriting">Underwriting</option>
              <option value="policy">Policy Management</option>
              <option value="customer">Customer Service</option>
              <option value="billing">Billing & Payments</option>
            </select>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Template List */}
          {!loading && !selectedTemplate && (
            <>
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">
                    No templates found in this category
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900 flex-1">
                          {template.name}
                        </h3>
                        {template.category && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                            {getCategoryLabel(template.category)}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {template.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <FileText size={14} />
                          <span>{template.templateData.steps.length} steps</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>{template.usageCount} uses</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(template);
                        }}
                      >
                        View Details
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Template Detail View */}
          {selectedTemplate && (
            <div>
              <div className="mb-6">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mb-4"
                >
                  ← Back to templates
                </button>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selectedTemplate.name}
                    </h3>
                    {selectedTemplate.category && (
                      <span className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded">
                        {getCategoryLabel(selectedTemplate.category)}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 mb-4">
                    {selectedTemplate.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="text-sm font-semibold text-blue-900 mb-1">
                        Total Steps
                      </div>
                      <div className="text-2xl font-bold text-blue-700">
                        {selectedTemplate.templateData.steps.length}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-cyan-200">
                      <div className="text-sm font-semibold text-cyan-900 mb-1">
                        Connections
                      </div>
                      <div className="text-2xl font-bold text-cyan-700">
                        {selectedTemplate.templateData.connections.length}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="text-sm font-semibold text-green-900 mb-1">
                        Times Used
                      </div>
                      <div className="text-2xl font-bold text-green-700">
                        {selectedTemplate.usageCount}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">
                    Process Steps Preview
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedTemplate.templateData.steps.map((step: any, index: number) => (
                      <div
                        key={step.id}
                        className="flex items-start gap-3 bg-white p-4 rounded border border-gray-200"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            {step.name}
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {step.type}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {step.description}
                          </div>
                          {step.duration && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                              <Clock size={12} />
                              <span>{step.duration} minutes</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setSelectedTemplate(null)}
                  variant="outline"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUseTemplate}
                  disabled={isCreating}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                >
                  {isCreating ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Use This Template
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery;
