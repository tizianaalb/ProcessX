import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Lightbulb,
  Loader,
  CheckCircle2,
  XCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Zap,
  TrendingUp,
  ArrowLeft,
  Filter,
  Target,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../lib/api';
import type { ProcessRecommendation, Process } from '../lib/api';
import { Button } from '../components/ui/button';

export const ProcessRecommendations = () => {
  const { processId } = useParams<{ processId: string }>();
  const navigate = useNavigate();

  const [process, setProcess] = useState<Process | null>(null);
  const [recommendations, setRecommendations] = useState<ProcessRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [expandedRecs, setExpandedRecs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (processId) {
      loadProcess();
      loadRecommendations();
    }
  }, [processId]);

  const loadProcess = async () => {
    try {
      const { process } = await api.getProcess(processId!);
      setProcess(process);
    } catch (err: any) {
      setError(err.message || 'Failed to load process');
    }
  };

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const { recommendations } = await api.getProcessRecommendations(
        processId!,
        filterStatus || undefined
      );
      setRecommendations(recommendations);
    } catch (err: any) {
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (recId: string) => {
    try {
      await api.approveRecommendation(recId);
      loadRecommendations();
    } catch (err: any) {
      alert('Failed to approve: ' + err.message);
    }
  };

  const handleReject = async (recId: string) => {
    try {
      await api.rejectRecommendation(recId);
      loadRecommendations();
    } catch (err: any) {
      alert('Failed to reject: ' + err.message);
    }
  };

  const handleImplement = async (recId: string) => {
    try {
      await api.implementRecommendation(recId);
      loadRecommendations();
    } catch (err: any) {
      alert('Failed to mark as implemented: ' + err.message);
    }
  };

  const toggleExpanded = (recId: string) => {
    const newExpanded = new Set(expandedRecs);
    if (newExpanded.has(recId)) {
      newExpanded.delete(recId);
    } else {
      newExpanded.add(recId);
    }
    setExpandedRecs(newExpanded);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'QUICK_WIN':
        return <Zap className="w-5 h-5 text-yellow-600" />;
      case 'STRATEGIC':
        return <Target className="w-5 h-5 text-purple-600" />;
      case 'AUTOMATION':
        return <Lightbulb className="w-5 h-5 text-blue-600" />;
      case 'INTEGRATION':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'REDESIGN':
        return <TrendingUp className="w-5 h-5 text-orange-600" />;
      default:
        return <Lightbulb className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'QUICK_WIN':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'STRATEGIC':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'AUTOMATION':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'INTEGRATION':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'REDESIGN':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'IMPLEMENTED':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <ThumbsUp className="w-4 h-4" />;
      case 'REJECTED':
        return <ThumbsDown className="w-4 h-4" />;
      case 'IMPLEMENTED':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredRecommendations = recommendations.filter((rec) => {
    if (filterCategory && rec.category !== filterCategory) return false;
    return true;
  });

  const groupedByPriority = {
    HIGH: filteredRecommendations.filter((r) => r.priority === 'HIGH'),
    MEDIUM: filteredRecommendations.filter((r) => r.priority === 'MEDIUM'),
    LOW: filteredRecommendations.filter((r) => r.priority === 'LOW'),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <div className="text-xl font-semibold text-gray-700">Loading recommendations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => navigate(`/processes/${processId}/analyze`)}
              variant="outline"
              className="text-sm flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Analysis
            </Button>
            <Button
              onClick={() => navigate(`/processes/${processId}/edit`)}
              variant="outline"
              className="text-sm"
            >
              View Process
            </Button>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Recommendations</h1>
              <p className="mt-1 text-sm text-gray-600">
                {process?.name} - AI-generated improvement suggestions
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Filter className="w-4 h-4 inline mr-1" />
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="IMPLEMENTED">Implemented</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Categories</option>
                <option value="QUICK_WIN">Quick Wins</option>
                <option value="STRATEGIC">Strategic</option>
                <option value="AUTOMATION">Automation</option>
                <option value="INTEGRATION">Integration</option>
                <option value="REDESIGN">Redesign</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={loadRecommendations}
                variant="outline"
                className="flex items-center gap-2"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {filteredRecommendations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
            <p className="text-gray-600 mb-4">
              Run an AI analysis to generate improvement recommendations.
            </p>
            <Button
              onClick={() => navigate(`/processes/${processId}/analyze`)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Go to Analysis
            </Button>
          </div>
        ) : (
          <>
            {/* High Priority Recommendations */}
            {groupedByPriority.HIGH.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="px-2 py-1 bg-red-100 text-red-800 border border-red-300 rounded text-sm font-medium">
                    HIGH PRIORITY
                  </span>
                  <span className="text-gray-600 text-base">
                    ({groupedByPriority.HIGH.length})
                  </span>
                </h2>
                <div className="space-y-4">
                  {groupedByPriority.HIGH.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      expanded={expandedRecs.has(rec.id)}
                      onToggleExpand={() => toggleExpanded(rec.id)}
                      onApprove={() => handleApprove(rec.id)}
                      onReject={() => handleReject(rec.id)}
                      onImplement={() => handleImplement(rec.id)}
                      getCategoryIcon={getCategoryIcon}
                      getCategoryColor={getCategoryColor}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                      getStatusIcon={getStatusIcon}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Medium Priority Recommendations */}
            {groupedByPriority.MEDIUM.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded text-sm font-medium">
                    MEDIUM PRIORITY
                  </span>
                  <span className="text-gray-600 text-base">
                    ({groupedByPriority.MEDIUM.length})
                  </span>
                </h2>
                <div className="space-y-4">
                  {groupedByPriority.MEDIUM.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      expanded={expandedRecs.has(rec.id)}
                      onToggleExpand={() => toggleExpanded(rec.id)}
                      onApprove={() => handleApprove(rec.id)}
                      onReject={() => handleReject(rec.id)}
                      onImplement={() => handleImplement(rec.id)}
                      getCategoryIcon={getCategoryIcon}
                      getCategoryColor={getCategoryColor}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                      getStatusIcon={getStatusIcon}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Low Priority Recommendations */}
            {groupedByPriority.LOW.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 border border-green-300 rounded text-sm font-medium">
                    LOW PRIORITY
                  </span>
                  <span className="text-gray-600 text-base">
                    ({groupedByPriority.LOW.length})
                  </span>
                </h2>
                <div className="space-y-4">
                  {groupedByPriority.LOW.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      expanded={expandedRecs.has(rec.id)}
                      onToggleExpand={() => toggleExpanded(rec.id)}
                      onApprove={() => handleApprove(rec.id)}
                      onReject={() => handleReject(rec.id)}
                      onImplement={() => handleImplement(rec.id)}
                      getCategoryIcon={getCategoryIcon}
                      getCategoryColor={getCategoryColor}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                      getStatusIcon={getStatusIcon}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Recommendation Card Component
interface RecommendationCardProps {
  recommendation: ProcessRecommendation;
  expanded: boolean;
  onToggleExpand: () => void;
  onApprove: () => void;
  onReject: () => void;
  onImplement: () => void;
  getCategoryIcon: (category: string) => JSX.Element;
  getCategoryColor: (category: string) => string;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => JSX.Element;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  expanded,
  onToggleExpand,
  onApprove,
  onReject,
  onImplement,
  getCategoryIcon,
  getCategoryColor,
  getPriorityColor,
  getStatusColor,
  getStatusIcon,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            {getCategoryIcon(recommendation.category)}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg mb-2">
                {recommendation.title}
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded border ${getCategoryColor(
                    recommendation.category
                  )}`}
                >
                  {recommendation.category.replace('_', ' ')}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded border flex items-center gap-1 ${getStatusColor(
                    recommendation.status
                  )}`}
                >
                  {getStatusIcon(recommendation.status)}
                  {recommendation.status}
                </span>
              </div>
              <p className="text-sm text-gray-700">{recommendation.description}</p>
            </div>
          </div>

          <button
            onClick={onToggleExpand}
            className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Expected Benefits */}
            {recommendation.expectedBenefits && recommendation.expectedBenefits.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Expected Benefits:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {recommendation.expectedBenefits.map((benefit, idx) => (
                    <li key={idx} className="text-sm text-gray-700">
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Implementation Plan */}
            {recommendation.implementation && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Implementation:</h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      <strong>Effort:</strong> {recommendation.implementation.effort}
                    </span>
                    <span className="text-gray-600">
                      <strong>Timeline:</strong> {recommendation.implementation.timeline}
                    </span>
                  </div>
                  {recommendation.implementation.steps && recommendation.implementation.steps.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Steps:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        {recommendation.implementation.steps.map((step, idx) => (
                          <li key={idx} className="text-sm text-gray-700">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metrics */}
            {recommendation.metrics && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Expected Impact:</h4>
                <div className="grid grid-cols-3 gap-3">
                  {recommendation.metrics.timeSaving !== null &&
                    recommendation.metrics.timeSaving !== undefined && (
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="text-2xl font-bold text-green-700">
                          {recommendation.metrics.timeSaving}%
                        </div>
                        <div className="text-xs text-green-600">Time Saved</div>
                      </div>
                    )}
                  {recommendation.metrics.costSaving !== null &&
                    recommendation.metrics.costSaving !== undefined && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="text-2xl font-bold text-blue-700">
                          ${recommendation.metrics.costSaving.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-600">Cost Saved</div>
                      </div>
                    )}
                  {recommendation.metrics.riskReduction !== null &&
                    recommendation.metrics.riskReduction !== undefined && (
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="text-2xl font-bold text-purple-700">
                          {recommendation.metrics.riskReduction}%
                        </div>
                        <div className="text-xs text-purple-600">Risk Reduced</div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-4 border-t flex items-center gap-2">
          {recommendation.status === 'PENDING' && (
            <>
              <Button
                onClick={onApprove}
                className="bg-green-600 hover:bg-green-700 text-white text-sm flex items-center gap-1"
              >
                <ThumbsUp className="w-4 h-4" />
                Approve
              </Button>
              <Button
                onClick={onReject}
                variant="outline"
                className="text-sm text-red-600 hover:bg-red-50 flex items-center gap-1"
              >
                <ThumbsDown className="w-4 h-4" />
                Reject
              </Button>
            </>
          )}

          {recommendation.status === 'APPROVED' && (
            <Button
              onClick={onImplement}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center gap-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark as Implemented
            </Button>
          )}

          {recommendation.status === 'IMPLEMENTED' && (
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Implemented</span>
              {recommendation.implementedAt && (
                <span className="text-gray-600">
                  on {new Date(recommendation.implementedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          )}

          {recommendation.status === 'REJECTED' && (
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Rejected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
