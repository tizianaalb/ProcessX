import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  BackgroundVariant,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AlertTriangle, Plus, ChevronRight, ChevronLeft, Home, Settings } from 'lucide-react';

// Types for ReactFlow
type Node = any;
type Edge = any;
type NodeChange = any;
type EdgeChange = any;
type Connection = any;

import { api } from '../lib/api';
import type { Process, ProcessStep, ProcessStepInput, ProcessConnectionInput, PainPoint, CreatePainPointData } from '../lib/api';
import { StartNode } from '../components/nodes/StartNode';
import { TaskNode } from '../components/nodes/TaskNode';
import { DecisionNode } from '../components/nodes/DecisionNode';
import { EndNode } from '../components/nodes/EndNode';
import { ParallelGatewayNode } from '../components/nodes/ParallelGatewayNode';
import { SubprocessNode } from '../components/nodes/SubprocessNode';
import { UserTaskNode } from '../components/nodes/UserTaskNode';
import { SystemTaskNode } from '../components/nodes/SystemTaskNode';
import { TimerNode } from '../components/nodes/TimerNode';
import { AnnotationNode } from '../components/nodes/AnnotationNode';
import { InclusiveGatewayNode } from '../components/nodes/InclusiveGatewayNode';
import { EventGatewayNode } from '../components/nodes/EventGatewayNode';
import { MessageEventNode } from '../components/nodes/MessageEventNode';
import { ErrorEventNode } from '../components/nodes/ErrorEventNode';
import { SignalEventNode } from '../components/nodes/SignalEventNode';
import { DataObjectNode } from '../components/nodes/DataObjectNode';
import { GroupNode } from '../components/nodes/GroupNode';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PainPointModal } from '../components/PainPointModal';
import { PainPointList } from '../components/PainPointList';
import { ContextMenu, getNodeContextMenuItems, getEdgeContextMenuItems } from '../components/ContextMenu';
import { NodePropertiesPanel } from '../components/NodePropertiesPanel';
import { NodePalette } from '../components/NodePalette';
import { AIAnalysisPanel } from '../components/AIAnalysisPanel';

const nodeTypes = {
  start: StartNode,
  task: TaskNode,
  decision: DecisionNode,
  end: EndNode,
  parallelGateway: ParallelGatewayNode,
  subprocess: SubprocessNode,
  userTask: UserTaskNode,
  systemTask: SystemTaskNode,
  timer: TimerNode,
  annotation: AnnotationNode,
  inclusiveGateway: InclusiveGatewayNode,
  eventGateway: EventGatewayNode,
  messageEvent: MessageEventNode,
  errorEvent: ErrorEventNode,
  signalEvent: SignalEventNode,
  dataObject: DataObjectNode,
  group: GroupNode,
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

  // Context menu and properties panel state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    type: 'node' | 'edge' | null;
    target: any;
  }>({ visible: false, x: 0, y: 0, type: null, target: null });
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [selectedNodeForEdit, setSelectedNodeForEdit] = useState<Node | null>(null);

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

  const handleNodeClick = useCallback(async (_event: React.MouseEvent, node: Node) => {
    // Check if this is an unsaved node (temporary ID)
    if (node.id.startsWith('node-')) {
      const confirmed = window.confirm(
        'This node needs to be saved before adding pain points. Save the process now?'
      );
      if (confirmed) {
        await handleSave();
        // After save, the node IDs will be refreshed, so we can't continue
        alert('Process saved! Please click the node again to add a pain point.');
        return;
      }
      return;
    }

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

  const addNode = (type: 'start' | 'task' | 'decision' | 'end' | 'parallelGateway' | 'subprocess' | 'userTask' | 'systemTask' | 'timer' | 'annotation' | 'inclusiveGateway' | 'eventGateway' | 'messageEvent' | 'errorEvent' | 'signalEvent' | 'dataObject' | 'group') => {
    // Generate friendly labels for new node types
    const labelMap: Record<string, string> = {
      start: 'Start',
      end: 'End',
      task: 'Task',
      decision: 'Decision',
      parallelGateway: 'Parallel',
      subprocess: 'Subprocess',
      userTask: 'User Task',
      systemTask: 'System Task',
      timer: 'Timer',
      annotation: 'Note',
      inclusiveGateway: 'Inclusive OR',
      eventGateway: 'Event Gateway',
      messageEvent: 'Message',
      errorEvent: 'Error',
      signalEvent: 'Signal',
      dataObject: 'Data',
      group: 'Group',
    };

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        label: labelMap[type] || type,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // Drag and drop handlers for node palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const reactFlowBounds = event.currentTarget.getBoundingClientRect();
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    };

    addNodeAtPosition(type as any, position);
  }, []);

  const addNodeAtPosition = (type: 'start' | 'task' | 'decision' | 'end' | 'parallelGateway' | 'subprocess' | 'userTask' | 'systemTask' | 'timer' | 'annotation' | 'inclusiveGateway' | 'eventGateway' | 'messageEvent' | 'errorEvent' | 'signalEvent' | 'dataObject' | 'group', position: { x: number; y: number }) => {
    // Generate friendly labels for new node types
    const labelMap: Record<string, string> = {
      start: 'Start',
      end: 'End',
      task: 'Task',
      decision: 'Decision',
      parallelGateway: 'Parallel',
      subprocess: 'Subprocess',
      userTask: 'User Task',
      systemTask: 'System Task',
      timer: 'Timer',
      annotation: 'Note',
      inclusiveGateway: 'Inclusive OR',
      eventGateway: 'Event Gateway',
      messageEvent: 'Message',
      errorEvent: 'Error',
      signalEvent: 'Signal',
      dataObject: 'Data',
      group: 'Group',
    };

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      position,
      data: {
        label: labelMap[type] || type,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // Context menu handlers
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      type: 'node',
      target: node,
    });
  }, []);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      type: 'edge',
      target: edge,
    });
  }, []);

  const onPaneClick = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, type: null, target: null });
  }, []);

  // Node edit/delete/duplicate handlers
  const handleEditNode = (node: Node) => {
    setSelectedNodeForEdit(node);
    setShowPropertiesPanel(true);
    setContextMenu({ visible: false, x: 0, y: 0, type: null, target: null });
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setContextMenu({ visible: false, x: 0, y: 0, type: null, target: null });
  };

  const handleDuplicateNode = (node: Node) => {
    const newNode = {
      ...node,
      id: `node-${Date.now()}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setContextMenu({ visible: false, x: 0, y: 0, type: null, target: null });
  };

  const handleSaveNodeProperties = (nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data } : node
      )
    );
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    setContextMenu({ visible: false, x: 0, y: 0, type: null, target: null });
  };

  const handleEditEdgeLabel = (edge: Edge) => {
    const newLabel = prompt('Enter edge label:', edge.label || '');
    if (newLabel !== null) {
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edge.id ? { ...e, label: newLabel } : e
        )
      );
    }
    setContextMenu({ visible: false, x: 0, y: 0, type: null, target: null });
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

      // Separate new nodes from existing nodes
      const newNodes = nodes.filter((node) => !process.steps?.find((s) => s.id === node.id));
      const existingNodes = nodes.filter((node) => process.steps?.find((s) => s.id === node.id));

      // Convert new nodes to process steps
      const newSteps: ProcessStepInput[] = newNodes.map((node) => ({
        name: node.data.label || 'Untitled',
        description: node.data.description,
        type: node.type?.toUpperCase() as 'START' | 'TASK' | 'DECISION' | 'END',
        duration: node.data.duration,
        position: { x: node.position.x, y: node.position.y },
        metadata: node.data.metadata,
      }));

      // Detect modified nodes (compare with process.steps)
      const modifiedSteps = existingNodes
        .map((node) => {
          const originalStep = process.steps?.find((s) => s.id === node.id);
          if (!originalStep) return null;

          // Check if anything changed
          const hasChanges =
            originalStep.name !== (node.data.label || 'Untitled') ||
            originalStep.description !== node.data.description ||
            originalStep.type !== node.type?.toUpperCase() ||
            originalStep.duration !== node.data.duration ||
            originalStep.positionX !== node.position.x ||
            originalStep.positionY !== node.position.y;

          if (!hasChanges) return null;

          return {
            id: node.id,
            name: node.data.label || 'Untitled',
            description: node.data.description,
            type: node.type?.toUpperCase(),
            duration: node.data.duration,
            position: { x: node.position.x, y: node.position.y },
          };
        })
        .filter(Boolean);

      // Save new steps
      if (newSteps.length > 0) {
        await api.addProcessSteps(process.id, newSteps);
      }

      // Update modified steps
      if (modifiedSteps.length > 0) {
        await api.updateProcessSteps(process.id, modifiedSteps as any);
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
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="text-sm flex items-center gap-2"
              title="Go to Dashboard"
            >
              <Home size={16} />
              Dashboard
            </Button>
            <Button
              onClick={() => navigate('/settings')}
              variant="outline"
              className="text-sm flex items-center gap-2"
              title="Go to Settings"
            >
              <Settings size={16} />
              Settings
            </Button>
            <Button
              onClick={() => navigate('/processes')}
              variant="outline"
              className="text-sm"
            >
              ← Processes
            </Button>
          </div>
          <div className="h-8 w-px bg-gray-300"></div>
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
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            <Controls />
            <Background
              variant={BackgroundVariant.Dots}
              gap={16}
              size={1.5}
              color="#ffffff40"
            />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case 'start':
                    return '#22c55e';
                  case 'task':
                    return '#3b82f6';
                  case 'decision':
                    return '#eab308';
                  case 'end':
                    return '#ef4444';
                  default:
                    return '#6366f1';
                }
              }}
              maskColor="rgba(0, 0, 0, 0.2)"
              className="bg-white/90 backdrop-blur-sm rounded-lg border border-white/20"
            />
          </ReactFlow>

          {/* Node Palette */}
          <NodePalette onAddNode={addNode} />

          {/* AI Analysis Panel */}
          {process && (
            <AIAnalysisPanel
              processId={process.id}
              onAnalysisComplete={loadPainPoints}
            />
          )}

          {/* Node Properties Panel */}
          {showPropertiesPanel && selectedNodeForEdit && (
            <NodePropertiesPanel
              node={selectedNodeForEdit}
              onClose={() => {
                setShowPropertiesPanel(false);
                setSelectedNodeForEdit(null);
              }}
              onSave={handleSaveNodeProperties}
            />
          )}

          {/* Context Menu */}
          {contextMenu.visible && contextMenu.type === 'node' && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              items={getNodeContextMenuItems(
                () => handleEditNode(contextMenu.target),
                () => handleDuplicateNode(contextMenu.target),
                () => handleDeleteNode(contextMenu.target.id),
                async () => {
                  // Check if this is an unsaved node (temporary ID)
                  if (contextMenu.target.id.startsWith('node-')) {
                    const confirmed = window.confirm(
                      'This node needs to be saved before adding pain points. Save the process now?'
                    );
                    if (confirmed) {
                      await handleSave();
                      alert('Process saved! Please right-click the node again to add a pain point.');
                    }
                    setContextMenu({ visible: false, x: 0, y: 0, type: null, target: null });
                    return;
                  }

                  setSelectedNode(contextMenu.target);
                  setShowPainPointModal(true);
                  setEditingPainPoint(null);
                  setContextMenu({ visible: false, x: 0, y: 0, type: null, target: null });
                }
              )}
              onClose={() => setContextMenu({ visible: false, x: 0, y: 0, type: null, target: null })}
            />
          )}

          {contextMenu.visible && contextMenu.type === 'edge' && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              items={getEdgeContextMenuItems(
                () => handleEditEdgeLabel(contextMenu.target),
                () => handleDeleteEdge(contextMenu.target.id)
              )}
              onClose={() => setContextMenu({ visible: false, x: 0, y: 0, type: null, target: null })}
            />
          )}
        </div>

        {/* Pain Point Sidebar */}
        {process && (
          <div
            className={`bg-gradient-to-b from-white to-gray-50 border-l border-gray-200 shadow-2xl transition-all duration-300 ${
              sidebarOpen ? 'w-96' : 'w-0'
            } overflow-hidden flex flex-col`}
          >
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-orange-50 via-red-50 to-pink-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                  <AlertTriangle className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Pain Points
                  </h3>
                  <p className="text-xs text-gray-600">
                    {painPoints.length} {painPoints.length === 1 ? 'issue' : 'issues'} identified
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-colors"
                title="Close sidebar"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-50/50">
              <PainPointList
                painPoints={painPoints}
                onEdit={handleEditPainPoint}
                onDelete={handleDeletePainPoint}
                loading={loadingPainPoints}
                nodes={nodes}
              />
            </div>
          </div>
        )}

        {/* Sidebar Toggle Button (when closed) */}
        {process && !sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-gradient-to-br from-orange-500 to-red-500 border-2 border-white rounded-l-xl p-3 shadow-2xl hover:from-orange-600 hover:to-red-600 transition-all hover:scale-110 group"
            title="Open Pain Points"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-white" size={20} />
              <ChevronLeft className="text-white group-hover:animate-pulse" size={20} />
            </div>
            {painPoints.length > 0 && (
              <div className="absolute -top-2 -left-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg">
                {painPoints.length}
              </div>
            )}
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

    </div>
  );
};
