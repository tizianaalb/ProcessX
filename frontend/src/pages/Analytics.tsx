import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { analyticsApi, reviewApi, AnalyticsSummary, ReviewStats } from '../lib/api';
import { Button } from '../components/ui/button';

export const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryResult, reviewResult] = await Promise.all([
        analyticsApi.getSummary(),
        reviewApi.getReviewStats(),
      ]);
      setSummary(summaryResult);
      setReviewStats(reviewResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
          <p className="text-gray-500">Overview of your organization's process performance</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Processes */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Processes</span>
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{summary?.processes.total || 0}</p>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="text-green-600">{summary?.processes.active || 0} Active</span>
            <span className="text-gray-500">{summary?.processes.draft || 0} Draft</span>
          </div>
        </div>

        {/* Average Health Score */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Avg Health Score</span>
            <Activity className="w-5 h-5 text-purple-500" />
          </div>
          <p className={`text-3xl font-bold ${getHealthColor(summary?.health.averageScore || 0)}`}>
            {summary?.health.averageScore || 0}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-full h-2 rounded-full ${getHealthBgColor(summary?.health.averageScore || 0)}`}>
              <div
                className={`h-full rounded-full ${
                  (summary?.health.averageScore || 0) >= 80
                    ? 'bg-green-500'
                    : (summary?.health.averageScore || 0) >= 60
                    ? 'bg-yellow-500'
                    : (summary?.health.averageScore || 0) >= 40
                    ? 'bg-orange-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${summary?.health.averageScore || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Open Pain Points */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Open Pain Points</span>
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{summary?.painPoints.open || 0}</p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            {(summary?.painPoints.critical || 0) > 0 && (
              <span className="text-red-600 font-medium">
                {summary?.painPoints.critical} Critical
              </span>
            )}
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Pending Reviews</span>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{reviewStats?.pending || 0}</p>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="text-green-600">{reviewStats?.approved || 0} Approved</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Distribution */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Process Health Distribution</h2>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>

          {summary?.health.processesWithHealth === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No health data yet</p>
              <p className="text-sm mt-1">Process health will be calculated when you view processes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Distribution Bars */}
              <div className="space-y-3">
                <DistributionBar
                  label="Excellent (90+)"
                  count={summary?.health.distribution.excellent || 0}
                  total={summary?.health.processesWithHealth || 1}
                  color="bg-green-500"
                />
                <DistributionBar
                  label="Good (70-89)"
                  count={summary?.health.distribution.good || 0}
                  total={summary?.health.processesWithHealth || 1}
                  color="bg-lime-500"
                />
                <DistributionBar
                  label="Fair (50-69)"
                  count={summary?.health.distribution.fair || 0}
                  total={summary?.health.processesWithHealth || 1}
                  color="bg-yellow-500"
                />
                <DistributionBar
                  label="Poor (30-49)"
                  count={summary?.health.distribution.poor || 0}
                  total={summary?.health.processesWithHealth || 1}
                  color="bg-orange-500"
                />
                <DistributionBar
                  label="Critical (<30)"
                  count={summary?.health.distribution.critical || 0}
                  total={summary?.health.processesWithHealth || 1}
                  color="bg-red-500"
                />
              </div>

              {/* Summary Stats */}
              <div className="pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {summary?.health.healthyProcesses || 0}
                  </p>
                  <p className="text-xs text-gray-500">Healthy</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {summary?.health.atRiskProcesses || 0}
                  </p>
                  <p className="text-xs text-gray-500">At Risk</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {summary?.health.criticalProcesses || 0}
                  </p>
                  <p className="text-xs text-gray-500">Critical</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Recent Activity</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>

          {summary?.recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {summary?.recentActivity.map((process) => (
                <div
                  key={process.id}
                  onClick={() => navigate(`/processes/${process.id}`)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{process.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(process.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        process.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : process.status === 'DRAFT'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {process.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => navigate('/processes')}
          >
            View All Processes
          </Button>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Recommendations</h2>
          <CheckCircle className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800">Pending Recommendations</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {summary?.recommendations.pending || 0}
            </p>
            <p className="text-xs text-blue-600 mt-2">Awaiting review and implementation</p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800">Implemented</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {summary?.recommendations.implemented || 0}
            </p>
            <p className="text-xs text-green-600 mt-2">Successfully completed improvements</p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-purple-800">Review Approval Rate</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">
              {reviewStats && (reviewStats.approved + reviewStats.rejected) > 0
                ? Math.round(
                    (reviewStats.approved / (reviewStats.approved + reviewStats.rejected)) * 100
                  )
                : 0}
              %
            </p>
            <p className="text-xs text-purple-600 mt-2">
              {reviewStats?.avgReviewTime
                ? `Avg review time: ${reviewStats.avgReviewTime}h`
                : 'No reviews completed yet'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DistributionBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

const DistributionBar: React.FC<DistributionBarProps> = ({ label, count, total, color }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-28">{label}</span>
      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-800 w-12 text-right">{count}</span>
    </div>
  );
};

export default Analytics;
