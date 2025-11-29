import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Brain,
  Target,
  Download,
  FileText,
  Sheet,
  Presentation,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertCircle,
  GripVertical,
} from 'lucide-react';

interface AIAnalysisPanelProps {
  processId: string;
  onAnalysisComplete?: () => void;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  processId,
  onAnalysisComplete,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingRec, setGeneratingRec] = useState(false);
  const [generatingTarget, setGeneratingTarget] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('aiPanelPosition');
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 580, y: 16 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

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
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
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

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setMessage(null);
    try {
      const response = await fetch(`http://localhost:3100/api/processes/${processId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setMessage({
        type: 'success',
        text: `Found ${data.analysis.detectedPainPoints.length} pain points!`,
      });
      onAnalysisComplete?.();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Analysis failed',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    setGeneratingRec(true);
    setMessage(null);
    try {
      const response = await fetch(
        `http://localhost:3100/api/processes/${processId}/recommendations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate recommendations');
      }

      const data = await response.json();
      setMessage({
        type: 'success',
        text: `Generated ${data.recommendations.length} recommendations!`,
      });
      onAnalysisComplete?.();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to generate recommendations',
      });
    } finally {
      setGeneratingRec(false);
    }
  };

  const handleGenerateTarget = async () => {
    setGeneratingTarget(true);
    setMessage(null);
    try {
      const response = await fetch(
        `http://localhost:3100/api/processes/${processId}/target`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate target process');
      }

      setMessage({
        type: 'success',
        text: 'Target (TO-BE) process created successfully!',
      });
      onAnalysisComplete?.();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to generate target process',
      });
    } finally {
      setGeneratingTarget(false);
    }
  };

  const handleExport = async (format: 'powerpoint' | 'pdf' | 'excel' | 'word') => {
    setExportingFormat(format);
    setMessage(null);
    try {
      const response = await fetch(
        `http://localhost:3100/api/processes/${processId}/export/${format}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed`);
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const extensions: Record<string, string> = {
        powerpoint: 'pptx',
        pdf: 'pdf',
        excel: 'xlsx',
        word: 'docx',
      };

      a.download = `process_analysis.${extensions[format]}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({
        type: 'success',
        text: `Exported as ${format.toUpperCase()}!`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Export failed',
      });
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div
      ref={panelRef}
      style={{ left: position.x, top: position.y }}
      className="absolute w-40 bg-white rounded-xl shadow-xl border border-gray-200 z-50"
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-2 rounded-t-xl drag-handle cursor-move">
        <div className="flex items-center gap-1">
          <GripVertical className="w-2 h-2 text-white/70" />
          <Sparkles className="w-3 h-3 text-white" />
          <h3 className="text-white font-bold text-xs flex-1">AI Analysis</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-2 space-y-1.5">
        {/* Message */}
        {message && (
          <div
            className={`flex items-start gap-1 p-1.5 rounded-lg text-[9px] ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-2 h-2 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-2 h-2 flex-shrink-0 mt-0.5" />
            )}
            <span className="leading-tight">{message.text}</span>
          </div>
        )}

        {/* AI Actions */}
        <div className="space-y-1">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md text-[9px] font-semibold hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Brain className="w-3 h-3" />
            )}
            <span className="leading-tight text-center">{analyzing ? 'Analyzing...' : 'Analyze'}</span>
          </button>

          <button
            onClick={handleGenerateRecommendations}
            disabled={generatingRec}
            className="w-full flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-md text-[9px] font-semibold hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingRec ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            <span className="leading-tight text-center">{generatingRec ? 'Generating...' : 'Recommend'}</span>
          </button>

          <button
            onClick={handleGenerateTarget}
            disabled={generatingTarget}
            className="w-full flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-md text-[9px] font-semibold hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingTarget ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Target className="w-3 h-3" />
            )}
            <span className="leading-tight text-center">{generatingTarget ? 'Creating...' : 'TO-BE'}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-1.5"></div>

        {/* Export Section */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Download className="w-2 h-2 text-gray-600" />
            <h4 className="text-[9px] font-bold text-gray-700">Export</h4>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => handleExport('powerpoint')}
              disabled={exportingFormat !== null}
              className="flex flex-col items-center justify-center gap-0.5 px-1 py-1 bg-orange-100 text-orange-700 rounded-md font-semibold hover:bg-orange-200 transition-all text-[8px] disabled:opacity-50"
            >
              {exportingFormat === 'powerpoint' ? (
                <Loader2 className="w-2 h-2 animate-spin" />
              ) : (
                <Presentation className="w-2 h-2" />
              )}
              <span>PPTX</span>
            </button>

            <button
              onClick={() => handleExport('pdf')}
              disabled={exportingFormat !== null}
              className="flex flex-col items-center justify-center gap-0.5 px-1 py-1 bg-red-100 text-red-700 rounded-md font-semibold hover:bg-red-200 transition-all text-[8px] disabled:opacity-50"
            >
              {exportingFormat === 'pdf' ? (
                <Loader2 className="w-2 h-2 animate-spin" />
              ) : (
                <FileText className="w-2 h-2" />
              )}
              <span>PDF</span>
            </button>

            <button
              onClick={() => handleExport('excel')}
              disabled={exportingFormat !== null}
              className="flex flex-col items-center justify-center gap-0.5 px-1 py-1 bg-green-100 text-green-700 rounded-md font-semibold hover:bg-green-200 transition-all text-[8px] disabled:opacity-50"
            >
              {exportingFormat === 'excel' ? (
                <Loader2 className="w-2 h-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-2 h-2" />
              )}
              <span>Excel</span>
            </button>

            <button
              onClick={() => handleExport('word')}
              disabled={exportingFormat !== null}
              className="flex flex-col items-center justify-center gap-0.5 px-1 py-1 bg-blue-100 text-blue-700 rounded-md font-semibold hover:bg-blue-200 transition-all text-[8px] disabled:opacity-50"
            >
              {exportingFormat === 'word' ? (
                <Loader2 className="w-2 h-2 animate-spin" />
              ) : (
                <Sheet className="w-2 h-2" />
              )}
              <span>Word</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
