import React, { useEffect, useState } from 'react';
import {
  Zap,
  Bot,
  Clock,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Target,
  Lightbulb,
} from 'lucide-react';
import {
  extendedAnalyticsApi,
  AutomationOpportunityResult,
  AutomationCandidate,
} from '../lib/api';
import { Button } from './ui/button';

interface AutomationOpportunityPanelProps {
  processId: string;
  onStepClick?: (stepId: string) => void;
}

const PotentialBadge: React.FC<{ potential: 'high' | 'medium' | 'low' }> = ({ potential }) => {
  const config = {
    high: { bg: 'bg-green-100', text: 'text-green-700', label: 'High' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium' },
    low: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Low' },
  };
  const c = config[potential];

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};

const ComplexityBadge: React.FC<{ complexity: 'simple' | 'moderate' | 'complex' }> = ({
  complexity,
}) => {
  const config = {
    simple: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Simple' },
    moderate: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Moderate' },
    complex: { bg: 'bg-red-100', text: 'text-red-700', label: 'Complex' },
  };
  const c = config[complexity];

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};

const CandidateCard: React.FC<{
  candidate: AutomationCandidate;
  onStepClick?: (stepId: string) => void;
}> = ({ candidate, onStepClick }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <PotentialBadge potential={candidate.automationPotential} />
            <ComplexityBadge complexity={candidate.complexity} />
          </div>
          <h4 className="font-medium text-slate-800 mb-1">{candidate.stepName}</h4>
          <p className="text-sm text-slate-500">{candidate.automationType}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-600">
            -{candidate.estimatedSavings} min
          </p>
          <p className="text-xs text-slate-500">estimated savings</p>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-start gap-2 mb-3">
            <Lightbulb className="text-yellow-500 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-sm text-slate-600">{candidate.reason}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              Current: {candidate.currentDuration} min
            </span>
          </div>
          {onStepClick && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={(e) => {
                e.stopPropagation();
                onStepClick(candidate.stepId);
              }}
            >
              View Step
            </Button>
          )}
        </div>
      )}

      <button className="w-full mt-2 flex items-center justify-center text-slate-400 hover:text-slate-600">
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    </div>
  );
};

export const AutomationOpportunityPanel: React.FC<AutomationOpportunityPanelProps> = ({
  processId,
  onStepClick,
}) => {
  const [data, setData] = useState<AutomationOpportunityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadAnalysis();
  }, [processId]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await extendedAnalyticsApi.getAutomationOpportunities(processId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={loadAnalysis} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const displayedCandidates = showAll
    ? data.automationCandidates
    : data.automationCandidates.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Automation Opportunities</h2>
            <p className="text-purple-200 text-sm">{data.processName}</p>
          </div>
        </div>

        {/* Main Score */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className="text-purple-200" />
              <span className="text-purple-200 text-sm">Opportunity Score</span>
            </div>
            <p className="text-3xl font-bold">{data.overallScore}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={18} className="text-purple-200" />
              <span className="text-purple-200 text-sm">Current Automation</span>
            </div>
            <p className="text-3xl font-bold">{Math.round(data.currentAutomationRatio * 100)}%</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={18} className="text-purple-200" />
              <span className="text-purple-200 text-sm">Time Savings</span>
            </div>
            <p className="text-3xl font-bold">{data.estimatedTimeSavings} min</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={18} className="text-purple-200" />
              <span className="text-purple-200 text-sm">Annual Savings</span>
            </div>
            <p className="text-3xl font-bold">
              ${data.estimatedAnnualCostSavings.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Potential Improvement */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-purple-200">Automation Potential</span>
            <span className="font-medium">
              {Math.round(data.currentAutomationRatio * 100)}% → {Math.round(data.potentialAutomationRatio * 100)}%
            </span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full flex">
              <div
                className="bg-white/60"
                style={{ width: `${data.currentAutomationRatio * 100}%` }}
              />
              <div
                className="bg-green-400"
                style={{
                  width: `${(data.potentialAutomationRatio - data.currentAutomationRatio) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-purple-200">Current</span>
            <span className="text-green-300">
              +{Math.round((data.potentialAutomationRatio - data.currentAutomationRatio) * 100)}% potential
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-green-600">{data.summary.highPotential}</p>
          <p className="text-sm text-slate-500">High Potential</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Zap className="text-yellow-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-yellow-600">{data.summary.mediumPotential}</p>
          <p className="text-sm text-slate-500">Medium Potential</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Bot className="text-slate-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-600">{data.summary.lowPotential}</p>
          <p className="text-sm text-slate-500">Low Potential</p>
        </div>
      </div>

      {/* Quick Wins */}
      {data.quickWins.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-yellow-500" size={20} />
            <h3 className="font-bold text-slate-800">Quick Wins</h3>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              High impact, low effort
            </span>
          </div>
          <div className="space-y-3">
            {data.quickWins.map((candidate) => (
              <CandidateCard
                key={candidate.stepId}
                candidate={candidate}
                onStepClick={onStepClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Candidates */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="text-indigo-600" size={20} />
            <h3 className="font-bold text-slate-800">All Automation Candidates</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {data.automationCandidates.length} identified
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={loadAnalysis}>
            <RefreshCw size={14} className="mr-2" />
            Refresh
          </Button>
        </div>

        {data.automationCandidates.length > 0 ? (
          <>
            <div className="space-y-3">
              {displayedCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.stepId}
                  candidate={candidate}
                  onStepClick={onStepClick}
                />
              ))}
            </div>
            {data.automationCandidates.length > 5 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll
                  ? 'Show Less'
                  : `Show All (${data.automationCandidates.length - 5} more)`}
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No automation candidates identified</p>
            <p className="text-sm text-slate-400 mt-1">
              This process may already be well-automated
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationOpportunityPanel;
