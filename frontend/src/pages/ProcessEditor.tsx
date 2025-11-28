import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  NodeChange,
  EdgeChange,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AlertTriangle, Plus, ChevronRight, ChevronLeft } from 'lucide-react';

import { api } from '../lib/api';
import type { Process, ProcessStep, ProcessStepInput, ProcessConnectionInput, PainPoint, CreatePainPointData } from '../lib/api';
import { StartNode } from '../components/nodes/StartNode';
import { TaskNode } from '../components/nodes/TaskNode';
import { DecisionNode } from '../components/nodes/DecisionNode';
import { EndNode } from '../components/nodes/EndNode';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PainPointModal } from '../components/PainPointModal';
import { PainPointList } from '../components/PainPointList';

const nodeTypes = {
  start: StartNode,
  task: TaskNode,
  decision: DecisionNode,
  end: EndNode,
};

export const ProcessEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [process, setProcess] = useState<Process | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processName, setProcessName] = useState('');
  const [processDescription, setProcessDescription] = useState('');
  const [processType, setProcessType] = useState<'AS_IS' | 'TO_BE'>('AS_IS');
  const [showCreateDialog, setShowCreateDialog] = useState(!id);

  // Pain point state
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [loadingPainPoints, setLoadingPainPoints] = useState(false);
  const [showPainPointModal, setShowPainPointModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editingPainPoint, setEditingPainPoint] = useState<PainPoint | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (id) {
      loadProcess(id);
      loadPainPoints(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadProcess = async (processId: string) => {
    try {
      const response = await api.getProcess(processId);
      setProcess(response.process);
      setProcessName(response.process.name);
      setProcessDescription(response.process.description || '');
      setProcessType(response.process.type);

      // Convert process steps to ReactFlow nodes
      const flowNodes: Node[] =
        response.process.steps?.map((step) => ({
          id: step.id,
          type: step.type.toLowerCase(),
          position: { x: step.positionX, y: step.positionY },
          data: {
            label: step.name,
            duration: step.duration,
            description: step.description,
            painPointCount: 0,
            painPointSeverity: 'LOW',
          },
        })) || [];

      // Convert connections to ReactFlow edges
      const flowEdges: Edge[] =
        response.process.connections?.map((conn) => ({
          id: conn.id,
          source: conn.sourceStepId,
          target: conn.targetStepId,
          label: conn.label,
          type: conn.type === 'CONDITIONAL' ? 'step' : 'default',
          animated: conn.type === 'CONDITIONAL',
        })) || [];

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error: any) {
      alert('Failed to load process: ' + error.message);
      navigate('/processes');
    } finally {
      setLoading(false);
    }
  };

  const loadPainPoints = async (processId: string) => {
    try {
      setLoadingPainPoints(true);
      const response = await api.getPainPoints(processId);
      setPainPoints(response.painPoints);

      // Update nodes with pain point counts and highest severity
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const nodePainPoints = response.painPoints.filter(
            (pp) => pp.processStepId === node.id
          );

          if (nodePainPoints.length === 0) {
            return {
              ...node,
              data: { ...node.data, painPointCount: 0, painPointSeverity: 'LOW' },
            };
          }

          // Find highest severity
          const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          const highestSeverity = nodePainPoints.reduce((highest, pp) => {
            return severityOrder[pp.severity] > severityOrder[highest]
              ? pp.severity
              : highest;
          }, 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL');

          return {
            ...node,
            data: {
              ...node.data,
              painPointCount: nodePainPoints.length,
              painPointSeverity: highestSeverity,
            },
          };
        })
      );
    } catch (error: any) {
      console.error('Failed to load pain points:', error);
    } finally {
      setLoadingPainPoints(false);
    }
  };

  const handleCreatePainPoint = async (data: CreatePainPointData) => {
    if (!process) return;
    try {
      await api.createPainPoint(process.id, data);
      await loadPainPoints(process.id);
      setShowPainPointModal(false);
      setSelectedNode(null);
      setEditingPainPoint(null);
    } catch (error: any) {
      throw error;
    }
  };

  const handleEditPainPoint = (painPoint: PainPoint) => {
    setEditingPainPoint(painPoint);
    setShowPainPointModal(true);
  };

  const handleUpdatePainPoint = async (data: CreatePainPointData) => {
    if (!process || !editingPainPoint) return;
    try {
      await api.updatePainPoint(editingPainPoint.id, data);
      await loadPainPoints(process.id);
      setShowPainPointModal(false);
      setEditingPainPoint(null);
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeletePainPoint = async (id: string) => {
    if (!process) return;
    try {
      await api.deletePainPoint(id);
      await loadPainPoints(process.id);
    } catch (error: any) {
      alert('Failed to delete pain point: ' + error.message);
    }
  };

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowPainPointModal(true);
    setEditingPainPoint(null);
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  const addNode = (type: 'start' | 'task' | 'decision' | 'end') => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleCreateProcess = async () => {
    if (!processName.trim()) {
      alert('Please enter a process name');
      return;
    }

    try {
      const response = await api.createProcess({
        name: processName,
        description: processDescription,
        type: processType,
      });
      setProcess(response.process);
      setShowCreateDialog(false);
      // Navigate to edit URL with the new process ID
      navigate(`/processes/${response.process.id}/edit`, { replace: true });
    } catch (error: any) {
      alert('Failed to create process: ' + error.message);
    }
  };

  const handleSave = async () => {
    if (!process) {
      alert('Please create a process first');
      return;
    }

    try {
      setSaving(true);

      // First, update process metadata if changed
      if (
        process.name !== processName ||
        process.description !== processDescription ||
        process.type !== processType
      ) {
        await api.updateProcess(process.id, {
          name: processName,
          description: processDescription,
          type: processType,
        });
      }

      // Convert nodes back to process steps
      const newSteps: ProcessStepInput[] = nodes
        .filter((node) => !process.steps?.find((s) => s.id === node.id))
        .map((node) => ({
          name: node.data.label || 'Untitled',
          description: node.data.description,
          type: node.type?.toUpperCase() as 'START' | 'TASK' | 'DECISION' | 'END',
          duration: node.data.duration,
          position: { x: node.position.x, y: node.position.y },
          metadata: node.data.metadata,
        }));

      if (newSteps.length > 0) {
        await api.addProcessSteps(process.id, newSteps);
      }

      // Convert edges back to connections
      const newConnections: ProcessConnectionInput[] = edges
        .filter((edge) => !process.connections?.find((c) => c.id === edge.id))
        .map((edge) => ({
          sourceStepId: edge.source,
          targetStepId: edge.target,
          label: edge.label as string,
          type: edge.animated ? 'CONDITIONAL' : 'DEFAULT',
        }));

      if (newConnections.length > 0) {
        await api.addProcessConnections(process.id, newConnections);
      }

      alert('Process saved successfully!');
      // Reload to get fresh data with IDs
      await loadProcess(process.id);
    } catch (error: any) {
      alert('Failed to save process: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700">Loading process...</div>
      </div>
    );
  }

  if (showCreateDialog) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Process</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Process Name *
              </label>
              <Input
                type="text"
                value={processName}
                onChange={(e) => setProcessName(e.target.value)}
                placeholder="e.g., Insurance Claim Processing"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={processDescription}
                onChange={(e) => setProcessDescription(e.target.value)}
                placeholder="Brief description of the process..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Process Type
              </label>
              <select
                value={processType}
                onChange={(e) => setProcessType(e.target.value as 'AS_IS' | 'TO_BE')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="AS_IS">As-Is (Current Process)</option>
                <option value="TO_BE">To-Be (Future Process)</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => navigate('/processes')}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProcess}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create Process
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/processes')}
            variant="outline"
            className="text-sm"
          >
            ← Back
          </Button>
          <div>
            <Input
              type="text"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
              className="text-xl font-bold border-none focus:ring-2 focus:ring-blue-500 px-2"
              placeholder="Process name..."
            />
            <p className="text-sm text-gray-500 px-2">
              {process ? `Version ${process.version} • ${process.status}` : 'New Process'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedNode(null);
              setEditingPainPoint(null);
              setShowPainPointModal(true);
            }}
            disabled={!process}
            className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
          >
            <AlertTriangle size={16} />
            Add Pain Point
          </Button>
          <Button onClick={handleSave} disabled={saving || !process} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? 'Saving...' : 'Save Process'}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-50 border-b p-3 flex gap-2">
        <div className="text-sm font-medium text-gray-700 mr-2 flex items-center">
          Add Node:
        </div>
        <Button
          onClick={() => addNode('start')}
          size="sm"
          className="bg-green-500 hover:bg-green-600 text-white text-xs"
        >
          + Start
        </Button>
        <Button
          onClick={() => addNode('task')}
          size="sm"
          className="bg-blue-500 hover:bg-blue-600 text-white text-xs"
        >
          + Task
        </Button>
        <Button
          onClick={() => addNode('decision')}
          size="sm"
          className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs"
        >
          + Decision
        </Button>
        <Button
          onClick={() => addNode('end')}
          size="sm"
          className="bg-red-500 hover:bg-red-600 text-white text-xs"
        >
          + End
        </Button>
      </div>

      {/* ReactFlow Canvas with Pain Point Sidebar */}
      <div className="flex-1 flex relative">
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>

        {/* Pain Point Sidebar */}
        {process && (
          <div
            className={`bg-white border-l shadow-lg transition-all duration-300 ${
              sidebarOpen ? 'w-96' : 'w-0'
            } overflow-hidden flex flex-col`}
          >
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-orange-500" size={20} />
                <h3 className="font-semibold text-gray-900">
                  Pain Points ({painPoints.length})
                </h3>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PainPointList
                painPoints={painPoints}
                onEdit={handleEditPainPoint}
                onDelete={handleDeletePainPoint}
                loading={loadingPainPoints}
              />
            </div>
          </div>
        )}

        {/* Sidebar Toggle Button (when closed) */}
        {process && !sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-r-0 rounded-l-lg p-2 shadow-lg hover:bg-gray-50"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {/* Pain Point Modal */}
      <PainPointModal
        isOpen={showPainPointModal}
        onClose={() => {
          setShowPainPointModal(false);
          setSelectedNode(null);
          setEditingPainPoint(null);
        }}
        onSubmit={editingPainPoint ? handleUpdatePainPoint : handleCreatePainPoint}
        processStepId={selectedNode?.id}
        processStepName={selectedNode?.data.label}
        existingPainPoint={editingPainPoint || undefined}
      />

      {/* Instructions */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-8 max-w-md text-center">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start Building Your Process
            </h3>
            <p className="text-gray-600 text-sm">
              Click the buttons above to add nodes to your process map. Connect nodes by dragging from one handle to another.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
