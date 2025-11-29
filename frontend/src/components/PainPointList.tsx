import { useState, useMemo } from 'react';
import { AlertTriangle, Edit2, Trash2, DollarSign, Clock, Filter, TrendingUp, AlertCircle, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { Button } from './ui/button';
import type { PainPoint } from '../lib/api';

interface PainPointListProps {
  painPoints: PainPoint[];
  onEdit: (painPoint: PainPoint) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
  nodes?: Array<{ id: string; data: { label: string }; type: string }>;
}

const SEVERITY_COLORS = {
  LOW: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-800',
    badge: 'bg-green-100 text-green-800 border-green-300',
    icon: 'text-green-600',
  },
  MEDIUM: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-800',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: 'text-yellow-600',
  },
  HIGH: {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-800',
    badge: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: 'text-orange-600',
  },
  CRITICAL: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-800 border-red-300',
    icon: 'text-red-600',
  },
};

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  BOTTLENECK: { label: 'Bottleneck', icon: '⏱️' },
  REWORK: { label: 'Rework', icon: '🔄' },
  WASTE: { label: 'Waste', icon: '🗑️' },
  MANUAL_PROCESS: { label: 'Manual Process', icon: '✋' },
  COMPLIANCE_RISK: { label: 'Compliance Risk', icon: '⚠️' },
  SYSTEM_LIMITATION: { label: 'System Limitation', icon: '🔧' },
  COMMUNICATION_GAP: { label: 'Communication Gap', icon: '💬' },
};

const STATUS_CONFIG = {
  OPEN: {
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: AlertCircle,
    label: 'Open',
  },
  IN_PROGRESS: {
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: Zap,
    label: 'In Progress',
  },
  RESOLVED: {
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle2,
    label: 'Resolved',
  },
  DISMISSED: {
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: XCircle,
    label: 'Dismissed',
  },
};

export const PainPointList = ({
  painPoints,
  onEdit,
  onDelete,
  loading,
  nodes = [],
}: PainPointListProps) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'severity' | 'date' | 'cost'>('severity');

  // Calculate statistics
  const stats = useMemo(() => {
    const severityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    const statusCounts = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, DISMISSED: 0 };
    let totalCost = 0;
    let totalTime = 0;

    painPoints.forEach((pp) => {
      severityCounts[pp.severity as keyof typeof severityCounts]++;
      statusCounts[pp.status as keyof typeof statusCounts]++;
      if (pp.estimatedCost) totalCost += pp.estimatedCost;
      if (pp.estimatedTime) totalTime += pp.estimatedTime;
    });

    return { severityCounts, statusCounts, totalCost, totalTime };
  }, [painPoints]);

  // Filter and sort pain points
  const filteredAndSorted = useMemo(() => {
    let filtered = painPoints;

    // Apply severity filter
    if (filterSeverity !== 'ALL') {
      filtered = filtered.filter((pp) => pp.severity === filterSeverity);
    }

    // Apply status filter
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((pp) => pp.status === filterStatus);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'severity') {
        const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return order[b.severity as keyof typeof order] - order[a.severity as keyof typeof order];
      } else if (sortBy === 'cost') {
        return (b.estimatedCost || 0) - (a.estimatedCost || 0);
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return sorted;
  }, [painPoints, filterSeverity, filterStatus, sortBy]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-gray-700 font-medium">Loading pain points...</span>
        </div>
      </div>
    );
  }

  if (painPoints.length === 0) {
    return (
      <div className="p-8 text-center m-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border-2 border-dashed border-gray-300">
          <div className="inline-flex p-4 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mb-4">
            <AlertTriangle className="text-gray-500" size={32} />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">No Pain Points Yet</h4>
          <p className="text-gray-600 text-sm mb-1">
            No issues have been identified in this process
          </p>
          <p className="text-gray-500 text-xs mt-3 bg-white/50 rounded-lg py-2 px-4 inline-block">
            💡 Click on any process step to add a pain point
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Statistics Dashboard */}
      <div className="p-4 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 border-b border-orange-600">
        <div className="grid grid-cols-2 gap-2">
          {/* Total Impact */}
          <div className="bg-white/95 backdrop-blur rounded-xl p-3 shadow-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="p-1.5 bg-orange-100 rounded-lg">
                <DollarSign className="text-orange-600" size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">Cost</span>
            </div>
            <div className="text-xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              ${stats.totalCost.toLocaleString()}
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur rounded-xl p-3 shadow-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Clock className="text-blue-600" size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">Time</span>
            </div>
            <div className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {stats.totalTime}m
            </div>
          </div>

          {/* Severity Breakdown */}
          <div className="col-span-2 bg-white/95 backdrop-blur rounded-xl p-3 shadow-lg">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <TrendingUp className="text-purple-600" size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">Severity</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((severity) => (
                <div key={severity} className={`text-center rounded-lg p-1.5 ${SEVERITY_COLORS[severity].bg} border ${SEVERITY_COLORS[severity].border}`}>
                  <div className={`text-base font-black ${SEVERITY_COLORS[severity].text}`}>
                    {stats.severityCounts[severity]}
                  </div>
                  <div className={`text-[8px] font-bold ${SEVERITY_COLORS[severity].text} uppercase`}>{severity.slice(0,4)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="p-3 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-blue-100 rounded-lg">
            <Filter className="text-blue-600" size={12} strokeWidth={2.5} />
          </div>
          <span className="text-xs font-black text-gray-800 uppercase tracking-wide">Filters</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="text-xs px-2 py-1.5 bg-white border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-gray-700 shadow-sm"
          >
            <option value="ALL">🎯 All</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">🟢 Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs px-2 py-1.5 bg-white border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-semibold text-gray-700 shadow-sm"
          >
            <option value="ALL">📊 All</option>
            <option value="OPEN">🔵 Open</option>
            <option value="IN_PROGRESS">🟣 Progress</option>
            <option value="RESOLVED">🟢 Done</option>
            <option value="DISMISSED">⚫ Skip</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'severity' | 'date' | 'cost')}
            className="text-xs px-2 py-1.5 bg-white border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-gray-700 shadow-sm"
          >
            <option value="severity">⚡ Severity</option>
            <option value="cost">💰 Cost</option>
            <option value="date">📅 Date</option>
          </select>
        </div>

        {/* Active filter indicator */}
        {(filterSeverity !== 'ALL' || filterStatus !== 'ALL') && (
          <div className="mt-2 flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg px-2 py-1.5 border-2 border-blue-300 shadow-sm">
            <span className="text-xs text-blue-800 font-bold">
              {filteredAndSorted.length} of {painPoints.length}
            </span>
            <button
              onClick={() => {
                setFilterSeverity('ALL');
                setFilterStatus('ALL');
              }}
              className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-0.5 rounded-md font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Pain Point Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredAndSorted.map((painPoint) => {
          const severityConfig = SEVERITY_COLORS[painPoint.severity];
          const statusConfig = STATUS_CONFIG[painPoint.status];
          const StatusIcon = statusConfig.icon;
          const categoryInfo = CATEGORY_LABELS[painPoint.category];

          return (
            <div
              key={painPoint.id}
              className={`${severityConfig.bg} border-2 ${severityConfig.border} rounded-xl p-4 shadow-md hover:shadow-2xl transition-all duration-200 hover:scale-[1.02] group`}
            >
              {/* Linked Component/Task - PROMINENT */}
              {painPoint.processStep && (() => {
                // Find the current node to get the latest name
                const currentNode = nodes.find(n => n.id === painPoint.processStepId);
                const displayName = currentNode?.data.label || painPoint.processStep.name;
                const displayType = currentNode?.type?.toUpperCase() || painPoint.processStep.type;

                return (
                  <div className="mb-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl px-4 py-2.5 border-2 border-blue-700 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="bg-white rounded-lg p-1.5">
                        <div className="w-3 h-3 bg-blue-600 rounded"></div>
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Linked to Component</div>
                        <div className="text-sm text-white font-bold">{displayName}</div>
                      </div>
                      <div className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                        {displayType}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* General Pain Point Indicator */}
              {!painPoint.processStep && (
                <div className="mb-3 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl px-4 py-2.5 border-2 border-gray-600 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="bg-white rounded-lg p-1.5">
                      <div className="w-3 h-3 bg-gray-600 rounded"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] text-gray-100 font-bold uppercase tracking-wider">General Pain Point</div>
                      <div className="text-sm text-white font-bold">Not linked to specific component</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Header with Actions */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold border-2 ${severityConfig.badge}`}>
                      {painPoint.severity}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-white/70 text-gray-700 font-medium border border-gray-300">
                      {categoryInfo.icon} {categoryInfo.label}
                    </span>
                  </div>
                  <h3 className={`font-bold text-sm ${severityConfig.text} mb-1`}>
                    {painPoint.title}
                  </h3>
                </div>
                <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(painPoint)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this pain point?')) {
                        onDelete(painPoint.id);
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-800 mb-3 leading-relaxed">
                {painPoint.description}
              </p>

              {/* Impact Metrics */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {painPoint.estimatedCost !== null && painPoint.estimatedCost !== undefined && (
                  <div className="bg-white/70 rounded-lg p-2 border border-gray-200">
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={14} className="text-orange-600" />
                      <div>
                        <div className="text-xs text-gray-600">Annual Cost</div>
                        <div className="text-sm font-bold text-orange-900">
                          ${painPoint.estimatedCost.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {painPoint.estimatedTime !== null && painPoint.estimatedTime !== undefined && (
                  <div className="bg-white/70 rounded-lg p-2 border border-gray-200">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-orange-600" />
                      <div>
                        <div className="text-xs text-gray-600">Time Impact</div>
                        <div className="text-sm font-bold text-orange-900">
                          {painPoint.estimatedTime} min
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {painPoint.frequency && (
                  <div className="bg-white/70 rounded-lg p-2 border border-gray-200 col-span-2">
                    <div className="text-xs text-gray-600">Frequency</div>
                    <div className="text-sm font-bold text-gray-800">
                      {painPoint.frequency.charAt(0) + painPoint.frequency.slice(1).toLowerCase()}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer: Status and User */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-300/50">
                <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border-2 font-medium ${statusConfig.color}`}>
                  <StatusIcon size={14} />
                  {statusConfig.label}
                </div>
                <div className="text-xs text-gray-600 bg-white/60 px-2 py-1 rounded-lg">
                  <span className="font-medium">
                    {painPoint.identifiedBy.firstName} {painPoint.identifiedBy.lastName}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
