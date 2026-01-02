import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { analyticsApi, ProcessHealthResult } from '../lib/api';

interface ProcessHealthCardProps {
  processId: string;
  compact?: boolean;
  showDetails?: boolean;
  onHealthCalculated?: (health: ProcessHealthResult) => void;
}

export const ProcessHealthCard: React.FC<ProcessHealthCardProps> = ({
  processId,
  compact = false,
  showDetails = true,
  onHealthCalculated,
}) => {
  const [health, setHealth] = useState<ProcessHealthResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    fetchHealth();
  }, [processId]);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await analyticsApi.getProcessHealth(processId);
      setHealth(result);
      onHealthCalculated?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setIsRecalculating(true);
      const result = await analyticsApi.calculateProcessHealth(processId);
      setHealth(result);
      onHealthCalculated?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recalculate health');
    } finally {
      setIsRecalculating(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 30) return 'Poor';
    return 'Critical';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${compact ? 'p-3' : 'p-4'} animate-pulse`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
        <button
          onClick={fetchHealth}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!health) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="text-center text-gray-500">
          <Activity className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No health data available</p>
          <button
            onClick={handleRecalculate}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Calculate Now
          </button>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getScoreBgColor(health.score)}`}>
          <span className={`text-sm font-bold ${getScoreColor(health.score)}`}>{health.score}</span>
        </div>
        {getTrendIcon(health.trend)}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Process Health</h3>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          title="Recalculate health score"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${isRecalculating ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Score Circle */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getScoreBgColor(health.score)}`}>
          <span className={`text-2xl font-bold ${getScoreColor(health.score)}`}>{health.score}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-semibold ${getScoreColor(health.score)}`}>
              {getScoreLabel(health.score)}
            </span>
            {getTrendIcon(health.trend)}
          </div>
          <p className="text-sm text-gray-500 capitalize">{health.trend}</p>
        </div>
      </div>

      {showDetails && health.details && (
        <>
          {/* Component Scores */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <ScoreItem
              label="Complexity"
              score={health.details.complexity?.score || 0}
              icon={<span className="text-xs">C</span>}
            />
            <ScoreItem
              label="Efficiency"
              score={health.details.efficiency?.score || 0}
              icon={<span className="text-xs">E</span>}
            />
            <ScoreItem
              label="Automation"
              score={health.details.automation?.score || 0}
              icon={<span className="text-xs">A</span>}
            />
            <ScoreItem
              label="Documentation"
              score={health.details.documentation?.score || 0}
              icon={<span className="text-xs">D</span>}
            />
          </div>

          {/* Risk Factors */}
          {health.details.riskFactors && health.details.riskFactors.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Risk Factors
              </h4>
              <ul className="space-y-1">
                {health.details.riskFactors.slice(0, 3).map((risk, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-orange-500 mt-0.5">*</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Recommendations */}
          {health.details.recommendations && health.details.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Recommendations
              </h4>
              <ul className="space-y-1">
                {health.details.recommendations.slice(0, 3).map((rec, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-green-500 mt-0.5">+</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Metrics */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-semibold text-gray-800">{health.details.complexity?.nodeCount || 0}</p>
                <p className="text-xs text-gray-500">Steps</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">{health.bottlenecks}</p>
                <p className="text-xs text-gray-500">Bottlenecks</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  {health.cycleTime ? `${Math.round(health.cycleTime)}m` : 'N/A'}
                </p>
                <p className="text-xs text-gray-500">Cycle Time</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface ScoreItemProps {
  label: string;
  score: number;
  icon: React.ReactNode;
}

const ScoreItem: React.FC<ScoreItemProps> = ({ label, score, icon }) => {
  const getColor = (s: number) => {
    if (s >= 70) return 'bg-green-500';
    if (s >= 50) return 'bg-yellow-500';
    if (s >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-gray-50 rounded p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-medium">{score}</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(score)} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

export default ProcessHealthCard;
