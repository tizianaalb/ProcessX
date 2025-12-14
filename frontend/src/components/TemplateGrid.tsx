import { useState } from 'react';
import { Search, Clock, Layers, TrendingUp, Eye } from 'lucide-react';
import { getCategoryLabel, getSubcategoryLabel } from '../config/templateCategories';

interface ProcessTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  templateData: {
    steps: any[];
    connections: any[];
  };
  usageCount: number;
  createdAt: string;
}

interface TemplateGridProps {
  templates: ProcessTemplate[];
  onTemplateSelect: (template: ProcessTemplate) => void;
  onTemplatePreview: (template: ProcessTemplate) => void;
}

export function TemplateGrid({
  templates,
  onTemplateSelect,
  onTemplatePreview,
}: TemplateGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent'>('name');

  // Filter templates by search query
  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'usage':
        return b.usageCount - a.usageCount;
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const calculateTotalDuration = (template: ProcessTemplate): number => {
    return template.templateData.steps
      .filter((step) => step.duration !== null && step.type !== 'START' && step.type !== 'END')
      .reduce((sum, step) => sum + (step.duration || 0), 0);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header with Search and Sort */}
      <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Process Templates</h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'} found
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'usage' | 'recent')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="name">Sort by Name</option>
            <option value="usage">Sort by Usage</option>
            <option value="recent">Sort by Recent</option>
          </select>
        </div>
      </div>

      {/* Template Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {sortedTemplates.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No templates found</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Select a category to view available templates'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTemplates.map((template) => {
              const stepCount = template.templateData.steps.length;
              const duration = calculateTotalDuration(template);

              return (
                <div
                  key={template.id}
                  className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 bg-white cursor-pointer"
                  onClick={() => onTemplateSelect(template)}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                        {template.name}
                      </h3>
                    </div>

                    {/* Category Badges */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {getCategoryLabel(template.category)}
                      </span>
                      {template.subcategory && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          {getSubcategoryLabel(template.category, template.subcategory)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                      {template.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Layers className="h-4 w-4" />
                        <span>{stepCount} steps</span>
                      </div>
                      {duration > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(duration)}</span>
                        </div>
                      )}
                      {template.usageCount > 0 && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>{template.usageCount} uses</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTemplatePreview(template);
                        }}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </button>
                      <button
                        onClick={() => onTemplateSelect(template)}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
