# ProcessX - Next Development Steps

**Priority:** Phase 2 Frontend Implementation
**Estimated Effort:** 2-3 development days
**Goal:** Complete interactive process mapping interface with ReactFlow

---

## Immediate Next Steps (Phase 2 Frontend)

### Step 1: Extend API Client ⏳
**File:** `frontend/src/lib/api.ts`
**Duration:** 30 minutes

Add the following methods to the ApiClient class:

```typescript
// Process CRUD
async getProcesses(): Promise<{ processes: Process[] }> {
  return this.request('/processes');
}

async getProcess(id: string): Promise<{ process: Process }> {
  return this.request(`/processes/${id}`);
}

async createProcess(data: CreateProcessData): Promise<{ process: Process }> {
  return this.request('/processes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async updateProcess(id: string, data: UpdateProcessData): Promise<{ process: Process }> {
  return this.request(`/processes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async deleteProcess(id: string): Promise<void> {
  return this.request(`/processes/${id}`, {
    method: 'DELETE',
  });
}

// Process steps and connections
async addProcessSteps(processId: string, steps: ProcessStepInput[]): Promise<{ steps: ProcessStep[] }> {
  return this.request(`/processes/${processId}/steps`, {
    method: 'POST',
    body: JSON.stringify({ steps }),
  });
}

async addProcessConnections(processId: string, connections: ProcessConnectionInput[]): Promise<{ connections: ProcessConnection[] }> {
  return this.request(`/processes/${processId}/connections`, {
    method: 'POST',
    body: JSON.stringify({ connections }),
  });
}
```

**Type Definitions:**
```typescript
export interface Process {
  id: string;
  name: string;
  description?: string;
  type: 'AS_IS' | 'TO_BE';
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  version: number;
  organizationId: string;
  createdById: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  steps?: ProcessStep[];
  connections?: ProcessConnection[];
  _count?: {
    steps: number;
    painPoints: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProcessStep {
  id: string;
  processId: string;
  name: string;
  description?: string;
  type: 'START' | 'TASK' | 'DECISION' | 'END';
  order: number;
  duration?: number;
  positionX: number;
  positionY: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessConnection {
  id: string;
  processId: string;
  sourceStepId: string;
  targetStepId: string;
  label?: string;
  type: 'DEFAULT' | 'CONDITIONAL';
  createdAt: string;
}

export interface CreateProcessData {
  name: string;
  description?: string;
  type?: 'AS_IS' | 'TO_BE';
}

export interface UpdateProcessData {
  name?: string;
  description?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  type?: 'AS_IS' | 'TO_BE';
}

export interface ProcessStepInput {
  name: string;
  description?: string;
  type?: 'START' | 'TASK' | 'DECISION' | 'END';
  duration?: number;
  position: { x: number; y: number };
  metadata?: any;
}

export interface ProcessConnectionInput {
  sourceStepId: string;
  targetStepId: string;
  label?: string;
  type?: 'DEFAULT' | 'CONDITIONAL';
}
```

---

### Step 2: Process List Page ⏳
**File:** `frontend/src/pages/ProcessList.tsx`
**Duration:** 2 hours

Create a comprehensive process listing page:

```typescript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Process } from '../lib/api';
import { Button } from '../components/ui/button';

export const ProcessList = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    type?: 'AS_IS' | 'TO_BE';
  }>({});
  const navigate = useNavigate();

  useEffect(() => {
    loadProcesses();
  }, []);

  const loadProcesses = async () => {
    try {
      setLoading(true);
      const response = await api.getProcesses();
      setProcesses(response.processes);
    } catch (error) {
      console.error('Failed to load processes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this process?')) {
      try {
        await api.deleteProcess(id);
        setProcesses(processes.filter(p => p.id !== id));
      } catch (error) {
        console.error('Failed to delete process:', error);
      }
    }
  };

  const filteredProcesses = processes.filter(p => {
    if (filter.status && p.status !== filter.status) return false;
    if (filter.type && p.type !== filter.type) return false;
    return true;
  });

  // Render grid/table UI
};
```

**UI Features:**
- Header with "Create New Process" button
- Filter dropdowns for status and type
- Grid/table layout showing:
  - Process name and description
  - Type badge (AS_IS/TO_BE)
  - Status badge (DRAFT/ACTIVE/ARCHIVED)
  - Step count
  - Last updated date
  - Action buttons (View, Edit, Delete)
- Loading state
- Empty state with call-to-action

---

### Step 3: Custom Node Components ⏳
**Files:** `frontend/src/components/nodes/`
**Duration:** 2 hours

Create four custom node types:

**1. StartNode.tsx**
```typescript
import { Handle, Position } from 'reactflow';

export const StartNode = ({ data }: any) => (
  <div className="bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold shadow-lg">
    START
    <Handle type="source" position={Position.Right} />
  </div>
);
```

**2. TaskNode.tsx**
```typescript
import { Handle, Position } from 'reactflow';

export const TaskNode = ({ data }: any) => (
  <div className="bg-blue-500 text-white rounded-lg p-4 shadow-lg min-w-[150px]">
    <Handle type="target" position={Position.Left} />
    <div className="font-bold">{data.label}</div>
    {data.duration && (
      <div className="text-xs mt-1">{data.duration} min</div>
    )}
    <Handle type="source" position={Position.Right} />
  </div>
);
```

**3. DecisionNode.tsx**
```typescript
import { Handle, Position } from 'reactflow';

export const DecisionNode = ({ data }: any) => (
  <div className="bg-yellow-500 text-white transform rotate-45 w-24 h-24 flex items-center justify-center shadow-lg">
    <div className="transform -rotate-45 text-sm font-bold text-center">
      {data.label}
    </div>
    <Handle type="target" position={Position.Left} className="transform -rotate-45" />
    <Handle type="source" position={Position.Right} className="transform -rotate-45" />
    <Handle type="source" position={Position.Bottom} className="transform -rotate-45" />
  </div>
);
```

**4. EndNode.tsx**
```typescript
import { Handle, Position } from 'reactflow';

export const EndNode = ({ data }: any) => (
  <div className="bg-red-500 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold shadow-lg">
    END
    <Handle type="target" position={Position.Left} />
  </div>
);
```

---

### Step 4: Process Editor ⏳
**File:** `frontend/src/pages/ProcessEditor.tsx`
**Duration:** 4 hours

Create the main process editor with ReactFlow:

```typescript
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
} from 'reactflow';
import 'reactflow/dist/style.css';

import { api, Process, ProcessStep } from '../lib/api';
import { StartNode } from '../components/nodes/StartNode';
import { TaskNode } from '../components/nodes/TaskNode';
import { DecisionNode } from '../components/nodes/DecisionNode';
import { EndNode } from '../components/nodes/EndNode';
import { Button } from '../components/ui/button';

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

  useEffect(() => {
    if (id) {
      loadProcess(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadProcess = async (processId: string) => {
    try {
      const response = await api.getProcess(processId);
      setProcess(response.process);

      // Convert process steps to ReactFlow nodes
      const flowNodes = response.process.steps?.map(step => ({
        id: step.id,
        type: step.type.toLowerCase(),
        position: { x: step.positionX, y: step.positionY },
        data: {
          label: step.name,
          duration: step.duration,
          description: step.description,
        },
      })) || [];

      // Convert connections to ReactFlow edges
      const flowEdges = response.process.connections?.map(conn => ({
        id: conn.id,
        source: conn.sourceStepId,
        target: conn.targetStepId,
        label: conn.label,
        type: conn.type === 'CONDITIONAL' ? 'step' : 'default',
      })) || [];

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Failed to load process:', error);
    } finally {
      setLoading(false);
    }
  };

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  const handleSave = async () => {
    // Convert nodes back to process steps
    // Convert edges back to connections
    // Save to backend
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {process ? process.name : 'New Process'}
        </h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/processes')}>Cancel</Button>
          <Button onClick={handleSave}>Save Process</Button>
        </div>
      </div>

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
};
```

**Features to implement:**
- Toolbar with draggable node types
- Properties panel for selected node
- Node addition via drag-and-drop
- Connection drawing
- Auto-layout algorithm
- Save functionality (convert nodes/edges to API format)
- Undo/redo
- Zoom and pan controls

---

### Step 5: Add Routes ⏳
**File:** `frontend/src/App.tsx`
**Duration:** 15 minutes

Update routing configuration:

```typescript
import { Routes, Route } from 'react-router-dom';
import { ProcessList } from './pages/ProcessList';
import { ProcessEditor } from './pages/ProcessEditor';

// Inside router:
<Route path="/processes" element={
  <ProtectedRoute>
    <ProcessList />
  </ProtectedRoute>
} />
<Route path="/processes/new" element={
  <ProtectedRoute>
    <ProcessEditor />
  </ProtectedRoute>
} />
<Route path="/processes/:id" element={
  <ProtectedRoute>
    <ProcessEditor />
  </ProtectedRoute>
} />
<Route path="/processes/:id/edit" element={
  <ProtectedRoute>
    <ProcessEditor />
  </ProtectedRoute>
} />
```

---

### Step 6: Update Dashboard ⏳
**File:** `frontend/src/pages/Dashboard.tsx`
**Duration:** 30 minutes

Wire up dashboard buttons and display real data:

```typescript
const [processCount, setProcessCount] = useState(0);

useEffect(() => {
  const loadStats = async () => {
    try {
      const response = await api.getProcesses();
      setProcessCount(response.processes.length);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };
  loadStats();
}, []);

// Update "Create New Process" button
<Button onClick={() => navigate('/processes/new')}>
  Create New Process
</Button>

// Update "View Templates" button
<Button onClick={() => navigate('/processes?filter=template')}>
  View Templates
</Button>

// Display actual count
<div className="text-4xl font-bold">{processCount}</div>
```

---

## Testing Checklist

After implementation, verify the following:

- [ ] Process list page loads and displays processes
- [ ] Filter by status works (DRAFT/ACTIVE/ARCHIVED)
- [ ] Filter by type works (AS_IS/TO_BE)
- [ ] "Create New Process" button navigates to editor
- [ ] Process editor loads with empty canvas
- [ ] Can add START node to canvas
- [ ] Can add TASK nodes to canvas
- [ ] Can add DECISION node to canvas
- [ ] Can add END node to canvas
- [ ] Can connect nodes with edges
- [ ] Can drag nodes to reposition
- [ ] Can delete nodes
- [ ] Can delete edges
- [ ] Save button persists process to database
- [ ] Can load existing process in editor
- [ ] Can edit existing process
- [ ] Can delete process from list
- [ ] Dashboard shows correct process count
- [ ] Dashboard buttons navigate correctly

---

## Performance Optimizations

Implement these after basic functionality works:

1. **Memoize Custom Nodes**
   ```typescript
   export const TaskNode = React.memo(({ data }: any) => {
     // ... component code
   });
   ```

2. **Debounce Auto-Save**
   ```typescript
   const debouncedSave = useMemo(
     () => debounce(handleSave, 2000),
     []
   );
   ```

3. **Lazy Load Process List**
   - Implement pagination for > 50 processes
   - Use virtual scrolling for large lists

4. **Optimistic UI Updates**
   - Update UI immediately on user action
   - Revert if API call fails

---

## Future Enhancements (Phase 3+)

- Process templates library
- Version comparison view
- Real-time collaboration (WebSockets)
- AI-powered pain point detection
- Process optimization recommendations
- Export to PowerPoint/PDF/Excel/Word
- Mobile responsive design
- Keyboard shortcuts
- Process analytics dashboard
- Audit trail

---

## Dependencies to Install

None required - ReactFlow v11.11.0 already installed.

Optional for enhanced functionality:
```bash
cd frontend
npm install react-beautiful-dnd  # For drag-and-drop toolbar
npm install lodash               # For debounce utility
npm install date-fns             # For date formatting
```

---

## Quick Reference

### ReactFlow Key Concepts
- **Nodes:** Visual elements on the canvas (our process steps)
- **Edges:** Connections between nodes (our process connections)
- **Handles:** Connection points on nodes (source/target)
- **Node Types:** Custom React components for rendering nodes
- **Controls:** Zoom, pan, fit view controls

### API Endpoints
- `GET /api/processes` - List processes
- `POST /api/processes` - Create process
- `GET /api/processes/:id` - Get single process
- `PUT /api/processes/:id` - Update process
- `DELETE /api/processes/:id` - Delete process
- `POST /api/processes/:id/steps` - Add steps
- `POST /api/processes/:id/connections` - Add connections

### File Structure
```
frontend/src/
├── components/
│   └── nodes/
│       ├── StartNode.tsx
│       ├── TaskNode.tsx
│       ├── DecisionNode.tsx
│       └── EndNode.tsx
├── pages/
│   ├── ProcessList.tsx
│   └── ProcessEditor.tsx
└── lib/
    └── api.ts (extend with process methods)
```

---

## Support

If you encounter issues:
1. Check backend logs: `logs/backend.log`
2. Check frontend console in browser DevTools
3. Verify API endpoints with curl or Postman
4. Check database with pgAdmin at http://localhost:4100
5. Review ReactFlow docs: https://reactflow.dev/

---

**Next Action:** Start with Step 1 (Extend API Client) and work through sequentially.
