import React, { useState, useEffect, useMemo } from 'react';
import { X, FileText, Clock, Loader, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import type { ProcessTemplate } from '../lib/api';
import { Button } from './ui/button';
import { CategorySidebar } from './CategorySidebar';
import { TemplateGrid } from './TemplateGrid';
import { getCategoryLabel, getSubcategoryLabel } from '../config/templateCategories';

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
  const [allTemplates, setAllTemplates] = useState<ProcessTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ProcessTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.getTemplates();

      if (result.success) {
        setAllTemplates(result.templates);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  // Calculate template counts for sidebar
  const templateCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    allTemplates.forEach((template) => {
      // Count by category
      if (template.category) {
        counts[template.category] = (counts[template.category] || 0) + 1;

        // Count by subcategory
        if (template.subcategory) {
          const key = `${template.category}_${template.subcategory}`;
          counts[key] = (counts[key] || 0) + 1;
        }
      }
    });

    return counts;
  }, [allTemplates]);

  // Filter templates based on selection
  const filteredTemplates = useMemo(() => {
    if (!selectedCategory) {
      return allTemplates;
    }

    if (selectedSubcategory) {
      return allTemplates.filter(
        (t) => t.category === selectedCategory && t.subcategory === selectedSubcategory
      );
    }

    return allTemplates.filter((t) => t.category === selectedCategory);
  }, [allTemplates, selectedCategory, selectedSubcategory]);

  const handleCategorySelect = (categoryKey: string | null, subcategoryKey: string | null) => {
    setSelectedCategory(categoryKey);
    setSelectedSubcategory(subcategoryKey);
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
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-[95%] max-w-[1400px] h-[90vh] flex flex-col overflow-hidden m-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 flex items-center justify-between border-b border-blue-700 flex-shrink-0">
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

        {/* Error State */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Main Content - Two Column Layout or Detail View */}
        {!selectedTemplate ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Loading State */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : (
              <>
                {/* Left Sidebar - Categories */}
                <CategorySidebar
                  selectedCategory={selectedCategory}
                  selectedSubcategory={selectedSubcategory}
                  onCategorySelect={handleCategorySelect}
                  templateCounts={templateCounts}
                />

                {/* Right Content - Template Grid */}
                <TemplateGrid
                  templates={filteredTemplates}
                  onTemplateSelect={setSelectedTemplate}
                  onTemplatePreview={setSelectedTemplate}
                />
              </>
            )}
          </div>
        ) : (
          /* Template Detail View */
          <div className="flex-1 overflow-y-auto p-6">
            <button
              onClick={() => setSelectedTemplate(null)}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mb-6 transition-colors"
            >
              <ArrowLeft size={20} />
              Back to templates
            </button>

            <div>

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

              <div className="flex justify-end gap-3 mt-6">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateGallery;
