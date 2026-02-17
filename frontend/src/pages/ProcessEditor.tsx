import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  BackgroundVariant,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AlertTriangle, ChevronRight, ChevronLeft, Home, Settings, Sparkles, Lightbulb, Maximize2, Download, GitCompare, Shield, LayoutGrid } from 'lucide-react';

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
import { AIAnalysisPanel, AIAnalysisPanelToggle } from '../components/AIAnalysisPanel';
import { EdgePropertiesPanel } from '../components/EdgePropertiesPanel';
import { ProcessValidationPanel } from '../components/ProcessValidationPanel';

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

// Default edge options for smooth vertical flow
const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { strokeWidth: 2, stroke: '#64748b' },
};

// Auto-layout: topological sort then place top-to-bottom
function autoLayoutNodes(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;

  const nodeMap = new Map<string, Node>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Build adjacency and in-degree
  const adj = new Map<string, string[]>();
  const inDeg = new Map<string, number>();
  nodes.forEach((n) => {
    adj.set(n.id, []);
    inDeg.set(n.id, 0);
  });
  edges.forEach((e) => {
    adj.get(e.source)?.push(e.target);
    inDeg.set(e.target, (inDeg.get(e.target) || 0) + 1);
  });

  // Topological sort (Kahn's)
  const queue: string[] = [];
  inDeg.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const levels: string[][] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const levelSize = queue.length;
    const level: string[] = [];
    for (let i = 0; i < levelSize; i++) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      level.push(id);
      for (const next of adj.get(id) || []) {
        const newDeg = (inDeg.get(next) || 1) - 1;
        inDeg.set(next, newDeg);
        if (newDeg === 0) queue.push(next);
      }
    }
    if (level.length > 0) levels.push(level);
  }

  // Add any remaining nodes (disconnected) as a final level
  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      levels.push([n.id]);
      visited.add(n.id);
    }
  });

  // Position nodes
  const VERTICAL_GAP = 120;
  const HORIZONTAL_GAP = 160;
  const START_X = 300;
  const START_Y = 40;

  const positioned = new Map<string, { x: number; y: number }>();

  levels.forEach((level, levelIdx) => {
    const totalWidth = (level.length - 1) * HORIZONTAL_GAP;
    const startX = START_X - totalWidth / 2;
    level.forEach((nodeId, colIdx) => {
      positioned.set(nodeId, {
        x: startX + colIdx * HORIZONTAL_GAP,
        y: START_Y + levelIdx * VERTICAL_GAP,
      });
    });
  });

  return nodes.map((n) => {
    const pos = positioned.get(n.id);
    return pos ? { ...n, position: pos } : n;
  });
}

// Get the next smart position below the lowest existing node
function getSmartPosition(nodes: Node[]): { x: number; y: number } {
  if (nodes.length === 0) return { x: 300, y: 40 };

  let maxY = -Infinity;
  let xAtMaxY = 300;
  for (const n of nodes) {
    if (n.position.y > maxY) {
      maxY = n.position.y;
      xAtMaxY = n.position.x;
    }
  }
  return { x: xAtMaxY, y: maxY + 120 };
}

const ProcessEditorInner = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
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

  // Left palette state
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);

  // Edge editing state
  const [showEdgePropertiesPanel, setShowEdgePropertiesPanel] = useState(false);
  const [selectedEdgeForEdit, setSelectedEdgeForEdit] = useState<Edge | null>(null);

  // Validation panel state
  const [showValidationPanel, setShowValidationPanel] = useState(false);

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

  // Track if initial fit has been done
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (id) {
      loadProcess(id);
      loadPainPoints(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  // Keyboard shortcut for fit-to-screen
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+0 or F key (when not typing in input)
      if ((e.ctrlKey && e.key === '0') || (e.key === 'f' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement))) {
        e.preventDefault();
        handleFitView();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [reactFlowInstance, nodes]);

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

      // Convert connections to ReactFlow edges with smoothstep type
      const flowEdges: Edge[] =
        response.process.connections?.map((conn) => ({
          id: conn.id,
          source: conn.sourceStepId,
          target: conn.targetStepId,
          label: conn.label,
          type: conn.type === 'CONDITIONAL' ? 'smoothstep' : 'smoothstep',
          animated: conn.type === 'CONDITIONAL',
          style: { strokeWidth: 2, stroke: conn.type === 'CONDITIONAL' ? '#eab308' : '#64748b' },
        })) || [];

      setNodes(flowNodes);
      setEdges(flowEdges);

      // Auto fit-to-screen after loading
      hasFittedRef.current = false;
    } catch (error: any) {
      alert('Failed to load process: ' + error.message);
      navigate('/processes');
    } finally {
      setLoading(false);
    }
  };

  // Auto fit-to-screen when nodes load
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0 && !hasFittedRef.current) {
      hasFittedRef.current = true;
      setTimeout(() => {
        reactFlowInstance.fitView({
          padding: 0.15,
          minZoom: 0.3,
          maxZoom: 1.2,
          duration: 400,
        });
      }, 150);
    }
  }, [reactFlowInstance, nodes.length]);

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

  // Connection validation - BPMN rules
  const isValidConnection = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return false;

      // Rule 1: Cannot connect a node to itself
      if (connection.source === connection.target) return false;

      // Rule 2: End nodes cannot have outgoing connections
      if (sourceNode.type === 'end') return false;

      // Rule 3: Start nodes cannot have incoming connections
      if (targetNode.type === 'start') return false;

      // Rule 4: Check if connection already exists
      const connectionExists = edges.some(
        (e) => e.source === connection.source && e.target === connection.target
      );
      if (connectionExists) return false;

      return true;
    },
    [nodes, edges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!isValidConnection(connection)) {
        console.warn('Invalid connection attempted:', connection);
        return;
      }

      // Determine edge type based on source node
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const isConditional = sourceNode?.type === 'decision' ||
                           sourceNode?.type === 'inclusiveGateway' ||
                           sourceNode?.type === 'eventGateway';

      const newEdge = {
        ...connection,
        id: `edge-${Date.now()}`,
        type: 'smoothstep',
        animated: isConditional,
        label: connection.sourceHandle === 'yes' ? 'Yes' :
               connection.sourceHandle === 'no' ? 'No' : '',
        style: { strokeWidth: 2, stroke: isConditional ? '#eab308' : '#64748b' },
        data: {
          condition: '',
          probability: undefined,
          description: '',
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [isValidConnection, nodes]
  );

  // Add node at smart position (below the lowest node)
  const addNode = (type: string) => {
    const position = getSmartPosition(nodes);
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

  // Drag and drop handlers for node palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type || !reactFlowInstance) return;

    const position = reactFlowInstance.project({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      position,
      data: {
        label: labelMap[type] || type,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [reactFlowInstance]);

  // Auto Layout handler
  const handleAutoLayout = () => {
    const laid = autoLayoutNodes(nodes, edges);
    setNodes(laid);
    // Fit to view after layout
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({
          padding: 0.15,
          minZoom: 0.3,
          maxZoom: 1.2,
          duration: 400,
        });
      }
    }, 50);
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
    setSelectedEdgeForEdit(edge);
    setShowEdgePropertiesPanel(true);
    setContextMenu({ visible: false, x: 0, y: 0, type: null, target: null });
  };

  const handleSaveEdgeProperties = (
    edgeId: string,
    data: {
      label?: string;
      type?: string;
      data?: {
        condition?: string;
        probability?: number;
        description?: string;
      };
    }
  ) => {
    setEdges((eds) =>
      eds.map((e) =>
        e.id === edgeId
          ? {
              ...e,
              label: data.label,
              type: 'smoothstep',
              animated: data.type === 'step',
              style: { strokeWidth: 2, stroke: data.type === 'step' ? '#eab308' : '#64748b' },
              data: { ...e.data, ...data.data },
            }
          : e
      )
    );
    setShowEdgePropertiesPanel(false);
    setSelectedEdgeForEdit(null);
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

      // Detect modified nodes
      const modifiedSteps = existingNodes
        .map((node) => {
          const originalStep = process.steps?.find((s) => s.id === node.id);
          if (!originalStep) return null;

          const metadataChanged = JSON.stringify(originalStep.metadata) !== JSON.stringify(node.data.metadata);
          const hasChanges =
            originalStep.name !== (node.data.label || 'Untitled') ||
            originalStep.description !== node.data.description ||
            originalStep.type !== node.type?.toUpperCase() ||
            originalStep.duration !== node.data.duration ||
            originalStep.positionX !== node.position.x ||
            originalStep.positionY !== node.position.y ||
            metadataChanged;

          if (!hasChanges) return null;

          return {
            id: node.id,
            name: node.data.label || 'Untitled',
            description: node.data.description,
            type: node.type?.toUpperCase(),
            duration: node.data.duration,
            position: { x: node.position.x, y: node.position.y },
            metadata: node.data.metadata,
          };
        })
        .filter(Boolean);

      if (newSteps.length > 0) {
        await api.addProcessSteps(process.id, newSteps);
      }

      if (modifiedSteps.length > 0) {
        await api.updateProcessSteps(process.id, modifiedSteps as any);
      }

      // Detect and delete removed nodes
      const deletedNodeIds = process.steps
        ?.filter((step) => !nodes.find((node) => node.id === step.id))
        .map((step) => step.id) || [];

      for (const nodeId of deletedNodeIds) {
        try {
          await api.deleteProcessStep(nodeId);
        } catch (error) {
          console.error(`Failed to delete node ${nodeId}:`, error);
        }
      }

      // Convert edges back to connections
      const newConnections: ProcessConnectionInput[] = edges
        .filter((edge) => !process.connections?.find((c) => c.id === edge.id))
        .filter((edge) => !edge.source.startsWith('node-') && !edge.target.startsWith('node-'))
        .map((edge) => ({
          sourceStepId: edge.source,
          targetStepId: edge.target,
          label: edge.label as string,
          type: edge.animated ? 'CONDITIONAL' : 'DEFAULT',
        }));

      if (newConnections.length > 0) {
        await api.addProcessConnections(process.id, newConnections);
      }

      // Detect and delete removed connections
      const deletedConnectionIds = process.connections
        ?.filter((conn) => !edges.find((edge) => edge.id === conn.id))
        .map((conn) => conn.id) || [];

      for (const connId of deletedConnectionIds) {
        try {
          await api.deleteProcessConnection(connId);
        } catch (error) {
          console.error(`Failed to delete connection ${connId}:`, error);
        }
      }

      alert('Process saved successfully!');
      await loadProcess(process.id);
    } catch (error: any) {
      alert('Failed to save process: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportBPMN = async () => {
    if (!process) {
      alert('Please create a process first');
      return;
    }

    try {
      await api.exportBPMN(process.id);
    } catch (error: any) {
      alert('Failed to export BPMN: ' + error.message);
    }
  };

  const handleFitView = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (reactFlowInstance && nodes.length > 0) {
      reactFlowInstance.fitView({
        padding: 0.15,
        minZoom: 0.3,
        maxZoom: 1.2,
        duration: 400,
      });
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
      <div className="bg-white border-b px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1.5"
              title="Go to Dashboard"
            >
              <Home size={14} />
              Dashboard
            </Button>
            <Button
              onClick={() => navigate('/settings')}
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1.5"
              title="Go to Settings"
            >
              <Settings size={14} />
            </Button>
            <Button
              onClick={() => navigate('/processes')}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              ← Processes
            </Button>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          {id && (
            <>
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={() => navigate(`/processes/${id}/analyze`)}
                  variant="outline"
                  size="sm"
                  className="text-xs flex items-center gap-1.5 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100"
                  title="AI Analysis"
                >
                  <Sparkles size={14} className="text-purple-600" />
                  AI Analysis
                </Button>
                <Button
                  onClick={() => navigate(`/processes/${id}/recommendations`)}
                  variant="outline"
                  size="sm"
                  className="text-xs flex items-center gap-1.5"
                  title="View Recommendations"
                >
                  <Lightbulb size={14} className="text-blue-600" />
                </Button>
                <Button
                  onClick={() => navigate(`/processes/${id}/compare`)}
                  variant="outline"
                  size="sm"
                  className="text-xs flex items-center gap-1.5 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100"
                  title="Compare AS-IS vs TO-BE"
                >
                  <GitCompare size={14} className="text-green-600" />
                  Compare
                </Button>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
            </>
          )}
          <div>
            <Input
              type="text"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
              className="text-lg font-bold border-none focus:ring-2 focus:ring-blue-500 px-2 h-8"
              placeholder="Process name..."
            />
            <p className="text-xs text-gray-500 px-2">
              {process ? `Version ${process.version} • ${process.status}` : 'New Process'}
            </p>
          </div>
        </div>

        <div className="flex gap-1.5">
          <Button
            onClick={() => {
              setSelectedNode(null);
              setEditingPainPoint(null);
              setShowPainPointModal(true);
            }}
            disabled={!process}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1.5 text-xs"
          >
            <AlertTriangle size={14} />
            Pain Point
          </Button>
          <Button
            onClick={handleAutoLayout}
            disabled={!process || nodes.length === 0}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-xs"
            title="Auto-arrange nodes vertically"
          >
            <LayoutGrid size={14} />
            Auto Layout
          </Button>
          <Button
            onClick={(e) => handleFitView(e)}
            disabled={!process || nodes.length === 0}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-xs"
            title="Fit all nodes to screen (Ctrl+0 or F)"
          >
            <Maximize2 size={14} />
            Fit to Screen
          </Button>
          <Button
            onClick={() => setShowValidationPanel(!showValidationPanel)}
            disabled={!process}
            variant="outline"
            size="sm"
            className={`flex items-center gap-1.5 text-xs ${showValidationPanel ? 'bg-blue-100 border-blue-400' : ''}`}
            title="Validate process"
          >
            <Shield size={14} className="text-blue-600" />
            Validate
          </Button>
          <Button
            onClick={handleExportBPMN}
            disabled={!process}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            title="Export process as BPMN 2.0 XML"
          >
            <Download size={14} />
            BPMN
          </Button>
          <Button onClick={handleSave} disabled={saving || !process} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main content area: Left Palette + Canvas + Right Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Node Palette Sidebar */}
        <NodePalette
          onAddNode={addNode}
          collapsed={paletteCollapsed}
          onToggleCollapse={() => setPaletteCollapsed(!paletteCollapsed)}
        />

        {/* ReactFlow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onNodeClick={handleNodeClick}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onEdgeClick={(_, edge) => {
              setSelectedEdgeForEdit(edge);
              setShowEdgePropertiesPanel(true);
            }}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            attributionPosition="bottom-left"
            fitView
            fitViewOptions={{ padding: 0.15, minZoom: 0.3, maxZoom: 1.2 }}
            style={{
              background: 'linear-gradient(180deg, #f0f4ff 0%, #e8ecf8 100%)',
            }}
          >
            <Controls className="bg-white/90 rounded-lg shadow-md" />
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#c0c8e0"
            />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case 'start':
                    return '#22c55e';
                  case 'task':
                  case 'userTask':
                  case 'systemTask':
                    return '#3b82f6';
                  case 'decision':
                  case 'parallelGateway':
                  case 'inclusiveGateway':
                  case 'eventGateway':
                    return '#eab308';
                  case 'end':
                    return '#ef4444';
                  case 'subprocess':
                    return '#06b6d4';
                  default:
                    return '#6366f1';
                }
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
              className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200"
            />
          </ReactFlow>

          {/* AI Analysis Panel */}
          {process && (
            <>
              <AIAnalysisPanel
                processId={process.id}
                onAnalysisComplete={loadPainPoints}
              />
              <AIAnalysisPanelToggle />
            </>
          )}

          {/* Validation Panel */}
          {showValidationPanel && process && (
            <ProcessValidationPanel
              processId={process.id}
              nodes={nodes}
              edges={edges}
              isFloating={true}
              onClose={() => setShowValidationPanel(false)}
              onIssueClick={(stepId) => {
                const node = nodes.find((n) => n.id === stepId);
                if (node && reactFlowInstance) {
                  reactFlowInstance.setCenter(node.position.x, node.position.y, {
                    zoom: 1.5,
                    duration: 500,
                  });
                }
              }}
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

          {/* Edge Properties Panel */}
          {showEdgePropertiesPanel && selectedEdgeForEdit && (
            <EdgePropertiesPanel
              edge={selectedEdgeForEdit}
              sourceNodeLabel={nodes.find((n) => n.id === selectedEdgeForEdit.source)?.data?.label}
              targetNodeLabel={nodes.find((n) => n.id === selectedEdgeForEdit.target)?.data?.label}
              onClose={() => {
                setShowEdgePropertiesPanel(false);
                setSelectedEdgeForEdit(null);
              }}
              onSave={handleSaveEdgeProperties}
              onDelete={(edgeId) => {
                handleDeleteEdge(edgeId);
                setShowEdgePropertiesPanel(false);
                setSelectedEdgeForEdit(null);
              }}
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

        {/* Pain Point Sidebar (Right) */}
        {process && (
          <div
            className={`bg-gradient-to-b from-white to-gray-50 border-l border-gray-200 shadow-2xl transition-all duration-300 ${
              sidebarOpen ? 'w-80' : 'w-0'
            } overflow-hidden flex flex-col`}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-orange-50 via-red-50 to-pink-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                  <AlertTriangle className="text-white" size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    Pain Points
                  </h3>
                  <p className="text-[10px] text-gray-600">
                    {painPoints.length} {painPoints.length === 1 ? 'issue' : 'issues'} identified
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-colors"
                title="Close sidebar"
              >
                <ChevronRight size={16} />
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
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-gradient-to-br from-orange-500 to-red-500 border-2 border-white rounded-l-xl p-2 shadow-2xl hover:from-orange-600 hover:to-red-600 transition-all hover:scale-110 group z-10"
            title="Open Pain Points"
          >
            <div className="flex items-center gap-1">
              <AlertTriangle className="text-white" size={16} />
              <ChevronLeft className="text-white group-hover:animate-pulse" size={16} />
            </div>
            {painPoints.length > 0 && (
              <div className="absolute -top-2 -left-2 bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-lg">
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

// Wrap with ReactFlowProvider to enable useReactFlow hook
export const ProcessEditor = () => {
  return (
    <ReactFlowProvider>
      <ProcessEditorInner />
    </ReactFlowProvider>
  );
};
