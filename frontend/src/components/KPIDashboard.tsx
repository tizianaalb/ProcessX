import React, { useEffect, useState } from 'react';
import {
  Activity,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  FileText,
  Bot,
  Users,
  Target,
  RefreshCw,
} from 'lucide-react';
import { extendedAnalyticsApi, KPIDashboardData } from '../lib/api';
import { Button } from './ui/button';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color,
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  const bgColorClasses = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    yellow: 'bg-yellow-50',
    red: 'bg-red-50',
    purple: 'bg-purple-50',
    indigo: 'bg-indigo-50',
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-5 hover:shadow-xl transition-all hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${bgColorClasses[color]}`}>
          <div className={iconColorClasses[color]}>{icon}</div>
        </div>
        {trend && trendValue && (
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              trend === 'up'
                ? 'bg-green-100 text-green-700'
                : trend === 'down'
                ? 'bg-red-100 text-red-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {trend === 'up' ? (
              <TrendingUp size={12} />
            ) : trend === 'down' ? (
              <TrendingDown size={12} />
            ) : null}
            {trendValue}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
};

interface ProgressBarProps {
  label: string;
  value: number;
  maxValue?: number;
  color: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, value, maxValue = 100, color }) => {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-800">{value}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const KPIDashboard: React.FC = () => {
  const [data, setData] = useState<KPIDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await extendedAnalyticsApi.getKPIDashboard();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load KPI dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow-lg border border-slate-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow-lg border border-slate-200">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600">{error}</p>
          <Button onClick={loadDashboard} size="sm" className="mt-3">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const healthScore = data.health.averageScore || 0;
  const healthTrend = healthScore >= 70 ? 'up' : healthScore >= 50 ? 'neutral' : 'down';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
            <Activity className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">KPI Dashboard</h2>
            <p className="text-sm text-slate-500">Real-time process metrics</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadDashboard}>
          <RefreshCw size={14} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Processes"
          value={data.processes.total}
          subtitle={`${data.processes.active} active`}
          icon={<FileText size={20} />}
          color="blue"
        />
        <KPICard
          title="Health Score"
          value={`${healthScore}%`}
          subtitle={`${data.health.healthyProcesses} healthy`}
          icon={<Target size={20} />}
          trend={healthTrend}
          trendValue={healthTrend === 'up' ? 'Good' : healthTrend === 'down' ? 'Needs attention' : 'Fair'}
          color="green"
        />
        <KPICard
          title="Automation Rate"
          value={`${data.automation.ratio}%`}
          subtitle={`${data.steps.automated} of ${data.steps.total} steps`}
          icon={<Bot size={20} />}
          color="purple"
        />
        <KPICard
          title="Open Issues"
          value={data.painPoints.open}
          subtitle={`${data.painPoints.critical} critical`}
          icon={<AlertTriangle size={20} />}
          trend={data.painPoints.open > 5 ? 'down' : 'up'}
          trendValue={data.painPoints.open > 5 ? 'High' : 'Low'}
          color={data.painPoints.critical > 0 ? 'red' : 'yellow'}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Process Types */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-blue-500" />
            Process Types
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">AS-IS Processes</span>
              <span className="font-bold text-blue-600">{data.processes.asIs}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">TO-BE Processes</span>
              <span className="font-bold text-green-600">{data.processes.toBe}</span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Optimization Coverage</span>
                <span className="font-medium text-slate-700">
                  {data.processes.asIs > 0
                    ? Math.round((data.processes.toBe / data.processes.asIs) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cycle Time */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-indigo-500" />
            Cycle Time
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Total Duration</span>
              <span className="font-bold text-slate-800">
                {Math.round(data.cycleTime.total / 60)} hrs
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Avg per Process</span>
              <span className="font-bold text-slate-800">{data.cycleTime.average} min</span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Potential Savings</span>
                <span className="font-medium text-green-600">
                  {data.automation.potentialSavings} min
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pain Point Resolution */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-500" />
            Issue Resolution
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Resolved</span>
              <span className="font-bold text-green-600">{data.painPoints.resolved}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Open</span>
              <span className="font-bold text-yellow-600">{data.painPoints.open}</span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <ProgressBar
                label="Resolution Rate"
                value={data.painPoints.resolutionRate}
                color="bg-green-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Health Distribution */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Activity size={18} className="text-purple-500" />
          Process Health Distribution
        </h3>
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.health.distribution.excellent}</div>
            <div className="text-xs text-slate-500 mt-1">Excellent</div>
            <div className="text-xs text-slate-400">(90+)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-lime-600">{data.health.distribution.good}</div>
            <div className="text-xs text-slate-500 mt-1">Good</div>
            <div className="text-xs text-slate-400">(70-89)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{data.health.distribution.fair}</div>
            <div className="text-xs text-slate-500 mt-1">Fair</div>
            <div className="text-xs text-slate-400">(50-69)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{data.health.distribution.poor}</div>
            <div className="text-xs text-slate-500 mt-1">Poor</div>
            <div className="text-xs text-slate-400">(30-49)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{data.health.distribution.critical}</div>
            <div className="text-xs text-slate-500 mt-1">Critical</div>
            <div className="text-xs text-slate-400">(&lt;30)</div>
          </div>
        </div>
      </div>

      {/* Automation vs Manual */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 text-white">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Zap size={18} />
          Automation Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-purple-200 text-sm mb-1">Automated Steps</p>
            <p className="text-3xl font-bold">{data.steps.automated}</p>
          </div>
          <div>
            <p className="text-purple-200 text-sm mb-1">Manual Steps</p>
            <p className="text-3xl font-bold">{data.steps.manual}</p>
          </div>
          <div>
            <p className="text-purple-200 text-sm mb-1">With Role Assignment</p>
            <p className="text-3xl font-bold">{data.steps.withRoles}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-purple-200">Automation Ratio</span>
            <span className="font-medium">{data.automation.ratio}%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${data.automation.ratio}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIDashboard;
