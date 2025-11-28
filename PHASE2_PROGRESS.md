# Phase 2: Process Mapping - Implementation Progress

## Completed ✅

### Backend API
- ✅ Installed ReactFlow (v11.11.0) for frontend
- ✅ Created Process Controller (`backend/src/controllers/process.controller.ts`)
  - `GET /api/processes` - List all processes
  - `GET /api/processes/:id` - Get single process with steps and connections
  - `POST /api/processes` - Create new process
  - `PUT /api/processes/:id` - Update process
  - `DELETE /api/processes/:id` - Delete process
  - `POST /api/processes/:id/steps` - Add steps to process
  - `POST /api/processes/:id/connections` - Add connections between steps
- ✅ Created Process Routes (`backend/src/routes/process.routes.ts`)
- ✅ Integrated routes into main server
- ✅ All routes protected with authentication middleware

### Features Implemented
- Multi-tenant process isolation (by organization)
- Process versioning support
- Step types: START, TASK, DECISION, END
- Connection types: DEFAULT, CONDITIONAL
- Position tracking for visual layout
- Metadata storage for custom properties

## Next Steps 🚀

### 1. Frontend API Client Extension
Add process methods to `frontend/src/lib/api.ts`:
```typescript
async getProcesses(): Promise<{ processes: Process[] }>
async getProcess(id: string): Promise<{ process: Process }>
async createProcess(data: CreateProcessData): Promise<{ process: Process }>
async updateProcess(id: string, data: UpdateProcessData): Promise<{ process: Process }>
async deleteProcess(id: string): Promise<void>
async addProcessSteps(processId: string, steps: ProcessStep[]): Promise<{ steps: ProcessStep[] }>
async addProcessConnections(processId: string, connections: Connection[]): Promise<{ connections: Connection[] }>
```

### 2. Process List Page
Create `frontend/src/pages/ProcessList.tsx`:
- Display all processes in a grid/table
- Show process name, type (AS_IS/TO_BE), status, step count
- Create new process button
- Edit/delete actions
- Filter by status and type

### 3. Process Editor
Create `frontend/src/pages/ProcessEditor.tsx`:
- ReactFlow canvas for visual editing
- Custom node components for each step type
- Toolbar with step types (drag to add)
- Properties panel for selected step
- Save button to persist to database
- Auto-layout option

### 4. Custom Node Components
Create step type components:
- `StartNode.tsx` - Green circle for process start
- `TaskNode.tsx` - Rectangle for tasks
- `DecisionNode.tsx` - Diamond for decisions
- `EndNode.tsx` - Red circle for process end

### 5. Routing Updates
Add to `App.tsx`:
- `/processes` - Process list page
- `/processes/new` - Create new process
- `/processes/:id` - View process (read-only)
- `/processes/:id/edit` - Edit process

### 6. Dashboard Integration
Update `Dashboard.tsx`:
- Wire up "Create New Process" button → `/processes/new`
- Wire up "View Templates" button → `/processes?filter=template`
- Display actual process count from API

## Database Schema (Already in Prisma)

### Process Table
```prisma
model Process {
  id             String   @id @default(uuid())
  name           String
  description    String?
  type           ProcessType @default(AS_IS)  // AS_IS, TO_BE
  status         ProcessStatus @default(DRAFT) // DRAFT, ACTIVE, ARCHIVED
  version        Int      @default(1)
  organizationId String
  createdById    String
  steps          ProcessStep[]
  connections    ProcessConnection[]
  painPoints     PainPoint[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### ProcessStep Table
```prisma
model ProcessStep {
  id          String   @id @default(uuid())
  processId   String
  name        String
  description String?
  type        StepType @default(TASK) // START, TASK, DECISION, END
  order       Int
  duration    Int?  // in minutes
  positionX   Float
  positionY   Float
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### ProcessConnection Table
```prisma
model ProcessConnection {
  id            String @id @default(uuid())
  processId     String
  sourceStepId  String
  targetStepId  String
  label         String?
  type          ConnectionType @default(DEFAULT) // DEFAULT, CONDITIONAL
  createdAt     DateTime @default(now())
}
```

## API Examples

### Create Process
```bash
curl -X POST http://localhost:3100/api/processes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Insurance Claim Processing",
    "description": "As-is process for handling insurance claims",
    "type": "AS_IS"
  }'
```

### Add Steps
```bash
curl -X POST http://localhost:3100/api/processes/PROCESS_ID/steps \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "steps": [
      {
        "name": "Start",
        "type": "START",
        "position": { "x": 100, "y": 100 }
      },
      {
        "name": "Receive Claim",
        "type": "TASK",
        "duration": 15,
        "position": { "x": 250, "y": 100 }
      }
    ]
  }'
```

### Add Connections
```bash
curl -X POST http://localhost:3100/api/processes/PROCESS_ID/connections \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connections": [
      {
        "sourceStepId": "STEP_1_ID",
        "targetStepId": "STEP_2_ID",
        "type": "DEFAULT"
      }
    ]
  }'
```

## ReactFlow Integration Guide

### Basic Setup
```tsx
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background
} from 'reactflow';
import 'reactflow/dist/style.css';

const ProcessEditor = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
    >
      <Controls />
      <Background />
    </ReactFlow>
  );
};
```

### Custom Node Types
```tsx
const nodeTypes = {
  start: StartNode,
  task: TaskNode,
  decision: DecisionNode,
  end: EndNode,
};

<ReactFlow nodeTypes={nodeTypes} ... />
```

## Testing Checklist

- [ ] Create a new process
- [ ] Add START node
- [ ] Add TASK nodes
- [ ] Add DECISION node
- [ ] Add END node
- [ ] Connect nodes
- [ ] Save process
- [ ] Load saved process
- [ ] Edit existing process
- [ ] Delete process
- [ ] View process list
- [ ] Filter processes

## Performance Considerations

- Use React.memo() for custom nodes
- Implement debounced auto-save
- Lazy load process list
- Paginate if > 50 processes
- Use optimistic UI updates

## Next Phase Preview

**Phase 3: Pain Point Analysis**
- AI-powered pain point detection
- Manual pain point annotation
- Link pain points to specific steps
- Severity and impact scoring
- Recommendations engine
