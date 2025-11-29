import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ChevronDown, ChevronUp, GripVertical, X } from 'lucide-react';

interface AIAnalysisPanelProps {
  processId: string;
  onAnalysisComplete?: () => void;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  processId,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('aiPanelExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isVisible, setIsVisible] = useState(() => {
    const saved = localStorage.getItem('aiPanelVisible');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('aiPanelPosition');
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 300, y: 80 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('aiPanelExpanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  useEffect(() => {
    localStorage.setItem('aiPanelVisible', JSON.stringify(isVisible));
  }, [isVisible]);

  useEffect(() => {
    localStorage.setItem('aiPanelPosition', JSON.stringify(position));
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
          x: Math.max(0, Math.min(e.clientX - dragStart.x, window.innerWidth - 280)),
          y: Math.max(0, Math.min(e.clientY - dragStart.y, window.innerHeight - 100)),
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

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      style={{
        left: position.x,
        top: position.y,
        width: isExpanded ? '280px' : '48px'
      }}
      className={`absolute bg-white rounded-lg shadow-lg border border-gray-200 z-50 transition-all duration-200 ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
      onMouseDown={handleMouseDown}
    >
      {/* Header - Always visible */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-lg drag-handle cursor-grab active:cursor-grabbing">
        <div className="flex items-center justify-between p-2">
          {isExpanded ? (
            <>
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-white/70" />
                <Sparkles className="w-4 h-4 text-white" />
                <h3 className="text-white font-semibold text-sm">AI Analysis</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  title="Collapse"
                >
                  <ChevronUp className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  title="Hide"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Expand AI Analysis"
            >
              <Sparkles className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Content - Only visible when expanded */}
      {isExpanded && (
        <div className="p-4">
          {/* Icon */}
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
          </div>

          {/* Title */}
          <h4 className="text-gray-900 font-bold text-sm text-center mb-2">
            AI-Powered Analysis
          </h4>

          {/* Description */}
          <p className="text-gray-600 text-xs text-center mb-4">
            Analyze processes, detect pain points, and get smart recommendations.
          </p>

          {/* Button */}
          <button
            onClick={() => navigate(`/processes/${processId}/analyze`)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-sm"
          >
            <span>Open AI Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Features List */}
          <div className="mt-3 space-y-1.5 border-t border-gray-200 pt-3">
            <div className="flex items-start gap-2 text-gray-600 text-xs">
              <div className="w-1 h-1 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>Process understanding</span>
            </div>
            <div className="flex items-start gap-2 text-gray-600 text-xs">
              <div className="w-1 h-1 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>Pain point detection</span>
            </div>
            <div className="flex items-start gap-2 text-gray-600 text-xs">
              <div className="w-1 h-1 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>Improvement recommendations</span>
            </div>
            <div className="flex items-start gap-2 text-gray-600 text-xs">
              <div className="w-1 h-1 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
              <span>TO-BE process generation</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed state tooltip */}
      {!isExpanded && (
        <div className="absolute left-full ml-2 top-0 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap opacity-0 hover:opacity-100 pointer-events-none transition-opacity">
          Click to expand AI Analysis
        </div>
      )}
    </div>
  );
};

// Helper component to show/hide the panel
export const AIAnalysisPanelToggle: React.FC = () => {
  const [isVisible, setIsVisible] = useState(() => {
    const saved = localStorage.getItem('aiPanelVisible');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('aiPanelVisible');
      setIsVisible(saved !== null ? JSON.parse(saved) : true);
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  if (isVisible) {
    return null;
  }

  return (
    <button
      onClick={() => {
        localStorage.setItem('aiPanelVisible', JSON.stringify(true));
        window.dispatchEvent(new Event('storage'));
      }}
      className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-110 z-50"
      title="Show AI Analysis Panel"
    >
      <Sparkles className="w-5 h-5" />
    </button>
  );
};
