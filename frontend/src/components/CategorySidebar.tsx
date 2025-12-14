import { useState } from 'react';
import * as Icons from 'lucide-react';
import { getCategoriesSorted, type TemplateCategory } from '../config/templateCategories';

interface CategorySidebarProps {
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  onCategorySelect: (categoryKey: string | null, subcategoryKey: string | null) => void;
  templateCounts: Record<string, number>;
}

export function CategorySidebar({
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
  templateCounts,
}: CategorySidebarProps) {
  const categories = getCategoriesSorted();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['underwriting', 'claims']));

  const toggleCategory = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategoryClick = (category: TemplateCategory) => {
    // If clicking the already selected category, deselect it
    if (selectedCategory === category.key && selectedSubcategory === null) {
      onCategorySelect(null, null);
    } else {
      // Select the category (all templates in that category)
      onCategorySelect(category.key, null);
      // Expand the category to show subcategories
      if (!expandedCategories.has(category.key)) {
        toggleCategory(category.key);
      }
    }
  };

  const handleSubcategoryClick = (categoryKey: string, subcategoryKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Toggle subcategory selection
    if (selectedCategory === categoryKey && selectedSubcategory === subcategoryKey) {
      onCategorySelect(categoryKey, null);
    } else {
      onCategorySelect(categoryKey, subcategoryKey);
    }
  };

  const getCategoryCount = (categoryKey: string): number => {
    return templateCounts[categoryKey] || 0;
  };

  const getSubcategoryCount = (categoryKey: string, subcategoryKey: string): number => {
    return templateCounts[`${categoryKey}_${subcategoryKey}`] || 0;
  };

  const getTotalCount = (): number => {
    // Only count category-level counts (not subcategories) to avoid double-counting
    return categories.reduce((sum, category) => sum + getCategoryCount(category.key), 0);
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon className="h-5 w-5" /> : <Icons.Folder className="h-5 w-5" />;
  };

  return (
    <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-gray-900">Template Categories</h2>
        <p className="text-sm text-gray-500 mt-1">{getTotalCount()} templates available</p>
      </div>

      {/* All Templates Option */}
      <div
        onClick={() => onCategorySelect(null, null)}
        className={`
          px-4 py-3 cursor-pointer transition-colors border-b border-gray-200
          ${selectedCategory === null
            ? 'bg-blue-50 border-l-4 border-l-blue-600'
            : 'hover:bg-gray-100 border-l-4 border-l-transparent'}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icons.Grid3x3 className="h-5 w-5 text-gray-600" />
            <span className={`font-medium ${selectedCategory === null ? 'text-blue-900' : 'text-gray-900'}`}>
              All Templates
            </span>
          </div>
          <span className="text-sm font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">
            {getTotalCount()}
          </span>
        </div>
      </div>

      {/* Category List */}
      <div className="py-2">
        {categories.map((category) => {
          const isExpanded = expandedCategories.has(category.key);
          const isCategorySelected = selectedCategory === category.key;
          const categoryCount = getCategoryCount(category.key);

          return (
            <div key={category.key} className="mb-1">
              {/* Category Header */}
              <div
                onClick={() => handleCategoryClick(category)}
                className={`
                  px-4 py-3 cursor-pointer transition-colors
                  ${isCategorySelected && selectedSubcategory === null
                    ? 'bg-blue-50 border-l-4 border-l-blue-600'
                    : 'hover:bg-gray-100 border-l-4 border-l-transparent'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategory(category.key);
                      }}
                      className="hover:bg-gray-200 rounded p-1 transition-colors"
                    >
                      {isExpanded ? (
                        <Icons.ChevronDown className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Icons.ChevronRight className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                    {getIcon(category.icon)}
                    <div className="flex-1">
                      <div className={`font-medium ${isCategorySelected && !selectedSubcategory ? 'text-blue-900' : 'text-gray-900'}`}>
                        {category.label}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {category.description}
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-medium px-2 py-1 rounded ml-2 ${
                    isCategorySelected && !selectedSubcategory
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {categoryCount}
                  </span>
                </div>
              </div>

              {/* Subcategories */}
              {isExpanded && category.subcategories.length > 0 && (
                <div className="ml-4 border-l-2 border-gray-200">
                  {category.subcategories.map((subcategory) => {
                    const isSubcategorySelected =
                      selectedCategory === category.key &&
                      selectedSubcategory === subcategory.key;
                    const subcategoryCount = getSubcategoryCount(category.key, subcategory.key);

                    return (
                      <div
                        key={subcategory.key}
                        onClick={(e) => handleSubcategoryClick(category.key, subcategory.key, e)}
                        className={`
                          px-4 py-2 cursor-pointer transition-colors
                          ${isSubcategorySelected
                            ? 'bg-blue-50 border-l-4 border-l-blue-600 ml-[-2px]'
                            : 'hover:bg-gray-100 border-l-4 border-l-transparent ml-[-2px]'}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${isSubcategorySelected ? 'text-blue-900' : 'text-gray-700'}`}>
                              {subcategory.label}
                            </div>
                            <div className="text-xs text-gray-500 line-clamp-1">
                              {subcategory.description}
                            </div>
                          </div>
                          {subcategoryCount > 0 && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ml-2 ${
                              isSubcategorySelected
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {subcategoryCount}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
