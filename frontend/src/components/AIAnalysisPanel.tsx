import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

interface AIAnalysisPanelProps {
  processId: string;
  onAnalysisComplete?: () => void;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  processId,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className="absolute right-4 top-4 w-64 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-xl shadow-2xl border-2 border-white/20 z-50 overflow-hidden"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-indigo-600/20 animate-pulse"></div>

      {/* Content */}
      <div className="relative p-6">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-white font-bold text-xl text-center mb-2">
          AI-Powered Analysis
        </h3>

        {/* Description */}
        <p className="text-white/90 text-sm text-center mb-6">
          Analyze your process, detect pain points, get recommendations, and generate optimized TO-BE processes.
        </p>

        {/* Button */}
        <button
          onClick={() => navigate(`/processes/${processId}/analyze`)}
          className="w-full bg-white hover:bg-gray-50 text-purple-600 font-bold py-3 px-4 rounded-lg shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <span>Go to AI Analysis</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Features List */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-white/80 text-xs">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>Full process understanding</span>
          </div>
          <div className="flex items-center gap-2 text-white/80 text-xs">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>Automated pain point detection</span>
          </div>
          <div className="flex items-center gap-2 text-white/80 text-xs">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>Smart improvement recommendations</span>
          </div>
          <div className="flex items-center gap-2 text-white/80 text-xs">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>TO-BE process generation</span>
          </div>
        </div>
      </div>

      {/* Bottom Accent */}
      <div className="h-1 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400"></div>
    </div>
  );
};
