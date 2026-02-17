import React, { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Lightbulb,
  Shield,
} from 'lucide-react';
import { extendedAnalyticsApi, ValidationResult, ValidationIssue } from '../lib/api';
import { Button } from './ui/button';

interface ProcessValidationPanelProps {
  processId?: string;
  nodes?: any[];
  edges?: any[];
  onIssueClick?: (stepId: string) => void;
  onClose?: () => void;
  isFloating?: boolean;
}

const severityConfig = {
  error: {
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
};

const IssueItem: React.FC<{
  issue: ValidationIssue;
  onStepClick?: (stepId: string) => void;
}> = ({ issue, onStepClick }) => {
  const [expanded, setExpanded] = useState(false);
  const config = severityConfig[issue.severity];
  const Icon = config.icon;

  return (
    <div
      className={`rounded-lg border ${config.border} ${config.bg} p-3 cursor-pointer hover:shadow-sm transition-all`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <Icon className={`${config.color} flex-shrink-0 mt-0.5`} size={18} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.badge}`}>
              {issue.severity.toUpperCase()}
            </span>
            <span className="text-xs text-slate-500">{issue.type}</span>
          </div>
          <p className="text-sm text-slate-700 font-medium">{issue.message}</p>
          {issue.stepName && (
            <p className="text-xs text-slate-500 mt-1">
              Step: <span className="font-medium">{issue.stepName}</span>
            </p>
          )}
          {expanded && issue.suggestion && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="flex items-start gap-2">
                <Lightbulb className="text-yellow-500 flex-shrink-0" size={14} />
                <p className="text-xs text-slate-600">{issue.suggestion}</p>
              </div>
              {issue.stepId && onStepClick && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStepClick(issue.stepId!);
                  }}
                >
                  Go to Step
                </Button>
              )}
            </div>
          )}
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    </div>
  );
};

export const ProcessValidationPanel: React.FC<ProcessValidationPanelProps> = ({
  processId,
  nodes,
  edges,
  onIssueClick,
  onClose,
  isFloating = false,
}) => {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const validate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let result: ValidationResult;

      if (processId) {
        // Validate saved process
        result = await extendedAnalyticsApi.validateProcess(processId);
      } else if (nodes && edges) {
        // Real-time validation
        const steps = nodes.map((node) => ({
          id: node.id,
          name: node.data?.label || 'Untitled',
          type: node.type?.toUpperCase() || 'TASK',
          description: node.data?.description,
          duration: node.data?.duration,
          responsibleRole: node.data?.metadata?.responsibleRole,
          requiredSystems: node.data?.metadata?.requiredSystems || [],
        }));

        const connections = edges.map((edge) => ({
          id: edge.id,
          sourceStepId: edge.source,
          targetStepId: edge.target,
          type: edge.animated ? 'CONDITIONAL' : 'DEFAULT',
        }));

        result = await extendedAnalyticsApi.validateProcessRealtime(steps, connections);
      } else {
        return;
      }

      setValidation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setLoading(false);
    }
  }, [processId, nodes, edges]);

  useEffect(() => {
    validate();
  }, []);

  // Debounced re-validation when nodes/edges change
  useEffect(() => {
    if (!processId && (nodes || edges)) {
      const timer = setTimeout(() => {
        validate();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [nodes?.length, edges?.length]);

  const filteredIssues = validation?.issues.filter((issue) =>
    filterSeverity === 'all' ? true : issue.severity === filterSeverity
  ) || [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const containerClasses = isFloating
    ? 'absolute right-4 bottom-4 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-[500px] overflow-hidden flex flex-col'
    : 'bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden';

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Shield className="text-white" size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Process Validation</h3>
              {validation && (
                <p className="text-xs text-slate-500">
                  {validation.summary.errors} errors, {validation.summary.warnings} warnings
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={validate}
              disabled={loading}
              className="h-8 px-2"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
            {isFloating && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCollapsed(!collapsed)}
                className="h-8 px-2"
              >
                {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </Button>
            )}
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose} className="h-8 px-2">
                <X size={14} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Score */}
          {validation && (
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center ${getScoreBg(
                      validation.score
                    )}`}
                  >
                    <span className={`text-2xl font-bold ${getScoreColor(validation.score)}`}>
                      {validation.score}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Validation Score</p>
                    <p className={`text-sm font-medium ${getScoreColor(validation.score)}`}>
                      {validation.isValid ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle size={14} />
                          Valid Process
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <AlertCircle size={14} />
                          Issues Found
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter */}
          {validation && validation.issues.length > 0 && (
            <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2">
              <span className="text-xs text-slate-500">Filter:</span>
              {(['all', 'error', 'warning', 'info'] as const).map((severity) => (
                <button
                  key={severity}
                  onClick={() => setFilterSeverity(severity)}
                  className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterSeverity === severity
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {severity === 'all' ? 'All' : severity.charAt(0).toUpperCase() + severity.slice(1)}
                  {severity !== 'all' && ` (${validation.summary[severity === 'error' ? 'errors' : severity === 'warning' ? 'warnings' : 'info']})`}
                </button>
              ))}
            </div>
          )}

          {/* Issues List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <p className="text-red-600 text-sm">{error}</p>
                <Button size="sm" onClick={validate} className="mt-3">
                  Retry
                </Button>
              </div>
            ) : validation && filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => (
                <IssueItem key={issue.id} issue={issue} onStepClick={onIssueClick} />
              ))
            ) : validation ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-green-600 font-medium">No issues found!</p>
                <p className="text-sm text-slate-500 mt-1">Your process passes all validation rules.</p>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};

export default ProcessValidationPanel;
