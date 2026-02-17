import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  ArrowLeft,
  GitCompare,
  Clock,
  Zap,
  TrendingDown,
  TrendingUp,
  Minus,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Bot,
  Link,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { extendedAnalyticsApi, ProcessComparisonResult } from '../lib/api';
import { StartNode } from '../components/nodes/StartNode';
import { TaskNode } from '../components/nodes/TaskNode';
import { DecisionNode } from '../components/nodes/DecisionNode';
import { EndNode } from '../components/nodes/EndNode';

const nodeTypes = {
  start: StartNode,
  task: TaskNode,
  decision: DecisionNode,
  end: EndNode,
};

export const ProcessComparison: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [comparison, setComparison] = useState<ProcessComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadComparison(id);
    }
  }, [id]);

  const loadComparison = async (processId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await extendedAnalyticsApi.getProcessComparison(processId);
      setComparison(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comparison');
    } finally {
      setLoading(false);
    }
  };

  const convertToFlowNodes = (steps: any[]) => {
    return steps.map((step, index) => ({
      id: step.id || `step-${index}`,
      type: (step.type || 'task').toLowerCase(),
      position: {
        x: step.positionX ?? step.position?.x ?? (index % 4) * 200 + 50,
        y: step.positionY ?? step.position?.y ?? Math.floor(index / 4) * 120 + 50,
      },
      data: {
        label: step.name,
        duration: step.duration,
      },
    }));
  };

  const convertToFlowEdges = (connections: any[]) => {
    return connections.map((conn, index) => ({
      id: conn.id || `edge-${index}`,
      source: conn.sourceStepId,
      target: conn.targetStepId,
      label: conn.label,
      animated: conn.type === 'CONDITIONAL',
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-600 font-medium">Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <Button onClick={() => id && loadComparison(id)} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!comparison) {
    return null;
  }

  const asIsNodes = convertToFlowNodes(comparison.asIsProcess.steps);
  const asIsEdges = convertToFlowEdges(comparison.asIsProcess.connections);
  const toBeNodes = comparison.toBeProcess ? convertToFlowNodes(comparison.toBeProcess.steps) : [];
  const toBeEdges = comparison.toBeProcess ? convertToFlowEdges(comparison.toBeProcess.connections) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={18} />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                  <GitCompare className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Process Comparison</h1>
                  <p className="text-sm text-slate-500">{comparison.asIsProcess.name}</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => id && loadComparison(id)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Metrics Summary */}
        {comparison.hasComparison && comparison.metrics && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-600" size={20} />
              Improvement Metrics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Duration Savings */}
              <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="text-blue-500" size={18} />
                  <span className="text-sm text-slate-500">Time Saved</span>
                </div>
                <p className={`text-2xl font-bold ${comparison.metrics.durationSavings > 0 ? 'text-green-600' : 'text-slate-700'}`}>
                  {comparison.metrics.durationSavings > 0 ? '-' : ''}{Math.abs(comparison.metrics.durationSavings)} min
                </p>
                <p className="text-xs text-slate-500">
                  {comparison.metrics.durationSavingsPercent > 0 ? '-' : '+'}{Math.abs(comparison.metrics.durationSavingsPercent)}% cycle time
                </p>
              </div>

              {/* Steps Reduced */}
              <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Minus className="text-orange-500" size={18} />
                  <span className="text-sm text-slate-500">Steps Removed</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {comparison.metrics.stepsRemoved}
                </p>
                <p className="text-xs text-slate-500">Eliminated</p>
              </div>

              {/* Steps Added */}
              <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="text-blue-500" size={18} />
                  <span className="text-sm text-slate-500">Steps Added</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {comparison.metrics.stepsAdded}
                </p>
                <p className="text-xs text-slate-500">New steps</p>
              </div>

              {/* Steps Modified */}
              <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="text-purple-500" size={18} />
                  <span className="text-sm text-slate-500">Modified</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {comparison.metrics.stepsModified}
                </p>
                <p className="text-xs text-slate-500">Changed steps</p>
              </div>

              {/* Automation Improvement */}
              <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="text-yellow-500" size={18} />
                  <span className="text-sm text-slate-500">Automation</span>
                </div>
                <p className={`text-2xl font-bold ${comparison.metrics.automationImprovement > 0 ? 'text-green-600' : 'text-slate-700'}`}>
                  {comparison.metrics.automationImprovement > 0 ? '+' : ''}{comparison.metrics.automationImprovement}%
                </p>
                <p className="text-xs text-slate-500">Improvement</p>
              </div>

              {/* Bottlenecks Reduced */}
              <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="text-green-500" size={18} />
                  <span className="text-sm text-slate-500">Bottlenecks</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  -{comparison.metrics.bottlenecksReduced}
                </p>
                <p className="text-xs text-slate-500">Reduced</p>
              </div>
            </div>
          </div>
        )}

        {/* Side by Side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AS-IS Process */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">AS-IS</span>
                    Current Process
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{comparison.asIsProcess.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">
                    {comparison.asIsProcess.stepCount} steps
                  </p>
                  <p className="text-sm text-slate-500">
                    {comparison.asIsProcess.totalDuration} min total
                  </p>
                </div>
              </div>
            </div>
            <div className="h-[400px]">
              <ReactFlow
                nodes={asIsNodes}
                edges={asIsEdges}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
              >
                <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e2e8f0" />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  Manual: {comparison.asIsProcess.manualSteps} | Automated: {comparison.asIsProcess.automatedSteps}
                </span>
                <span className="text-slate-500">
                  Automation: {comparison.asIsProcess.stepCount > 0
                    ? Math.round((comparison.asIsProcess.automatedSteps / comparison.asIsProcess.stepCount) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* TO-BE Process */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">TO-BE</span>
                    Optimized Process
                    {comparison.toBeProcess?.source === 'ai_generated' && (
                      <Bot className="text-purple-500" size={16} title="AI Generated" />
                    )}
                    {comparison.toBeProcess?.source === 'linked_process' && (
                      <Link className="text-blue-500" size={16} title="Linked Process" />
                    )}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {comparison.toBeProcess?.name || 'No optimized process available'}
                  </p>
                </div>
                {comparison.toBeProcess && (
                  <div className="text-right">
                    <p className="text-sm text-slate-500">
                      {comparison.toBeProcess.stepCount} steps
                    </p>
                    <p className="text-sm text-slate-500">
                      {comparison.toBeProcess.totalDuration} min total
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="h-[400px]">
              {comparison.hasComparison ? (
                <ReactFlow
                  nodes={toBeNodes}
                  edges={toBeEdges}
                  nodeTypes={nodeTypes}
                  fitView
                  attributionPosition="bottom-left"
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                >
                  <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#d1fae5" />
                  <Controls showInteractive={false} />
                </ReactFlow>
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-50">
                  <div className="text-center p-8">
                    <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h4 className="font-bold text-slate-700 mb-2">No TO-BE Process Available</h4>
                    <p className="text-slate-500 text-sm mb-4">
                      Run AI Analysis to generate an optimized version of this process.
                    </p>
                    <Button
                      onClick={() => navigate(`/processes/${id}/analyze`)}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    >
                      Run AI Analysis
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {comparison.toBeProcess && (
              <div className="p-4 bg-green-50 border-t border-green-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Manual: {comparison.toBeProcess.manualSteps} | Automated: {comparison.toBeProcess.automatedSteps}
                  </span>
                  <span className="text-green-600 font-medium">
                    Automation: {comparison.toBeProcess.stepCount > 0
                      ? Math.round((comparison.toBeProcess.automatedSteps / comparison.toBeProcess.stepCount) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Card */}
        {comparison.hasComparison && comparison.metrics && (
          <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={24} />
              <h3 className="text-xl font-bold">Optimization Summary</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-green-100 text-sm mb-1">Cycle Time Reduction</p>
                <p className="text-3xl font-bold">
                  {comparison.metrics.durationSavingsPercent}%
                </p>
              </div>
              <div>
                <p className="text-green-100 text-sm mb-1">Steps Streamlined</p>
                <p className="text-3xl font-bold">
                  {comparison.asIsProcess.stepCount} → {comparison.toBeProcess?.stepCount || 0}
                </p>
              </div>
              <div>
                <p className="text-green-100 text-sm mb-1">Automation Gain</p>
                <p className="text-3xl font-bold">
                  +{comparison.metrics.automationImprovement}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessComparison;
