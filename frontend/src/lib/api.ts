const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  organizationName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Process interfaces
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

// Pain Point interfaces
export interface PainPoint {
  id: string;
  processId: string;
  processStepId?: string;
  identifiedById: string;
  category:
    | 'BOTTLENECK'
    | 'REWORK'
    | 'WASTE'
    | 'MANUAL_PROCESS'
    | 'COMPLIANCE_RISK'
    | 'SYSTEM_LIMITATION'
    | 'COMMUNICATION_GAP';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  impact?: string;
  estimatedCost?: number;
  estimatedTime?: number;
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  isAiDetected: boolean;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
  processStep?: {
    id: string;
    name: string;
    type: string;
  };
  identifiedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePainPointData {
  processStepId?: string;
  category:
    | 'BOTTLENECK'
    | 'REWORK'
    | 'WASTE'
    | 'MANUAL_PROCESS'
    | 'COMPLIANCE_RISK'
    | 'SYSTEM_LIMITATION'
    | 'COMMUNICATION_GAP';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  impact?: string;
  estimatedCost?: number;
  estimatedTime?: number;
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
}

export interface UpdatePainPointData {
  category?:
    | 'BOTTLENECK'
    | 'REWORK'
    | 'WASTE'
    | 'MANUAL_PROCESS'
    | 'COMPLIANCE_RISK'
    | 'SYSTEM_LIMITATION'
    | 'COMMUNICATION_GAP';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title?: string;
  description?: string;
  impact?: string;
  estimatedCost?: number;
  estimatedTime?: number;
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('auth_token');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }

    return data;
  }

  // Auth endpoints
  async register(data: RegisterData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/me', {
      method: 'GET',
    });
  }

  // Process endpoints
  async getProcesses(): Promise<{ processes: Process[] }> {
    return this.request<{ processes: Process[] }>('/api/processes', {
      method: 'GET',
    });
  }

  async getProcess(id: string): Promise<{ process: Process }> {
    return this.request<{ process: Process }>(`/api/processes/${id}`, {
      method: 'GET',
    });
  }

  async createProcess(data: CreateProcessData): Promise<{ process: Process; message: string }> {
    return this.request<{ process: Process; message: string }>('/api/processes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProcess(id: string, data: UpdateProcessData): Promise<{ process: Process; message: string }> {
    return this.request<{ process: Process; message: string }>(`/api/processes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProcess(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/processes/${id}`, {
      method: 'DELETE',
    });
  }

  async addProcessSteps(
    processId: string,
    steps: ProcessStepInput[]
  ): Promise<{ steps: ProcessStep[]; message: string }> {
    return this.request<{ steps: ProcessStep[]; message: string }>(
      `/api/processes/${processId}/steps`,
      {
        method: 'POST',
        body: JSON.stringify({ steps }),
      }
    );
  }

  async addProcessConnections(
    processId: string,
    connections: ProcessConnectionInput[]
  ): Promise<{ connections: ProcessConnection[]; message: string }> {
    return this.request<{ connections: ProcessConnection[]; message: string }>(
      `/api/processes/${processId}/connections`,
      {
        method: 'POST',
        body: JSON.stringify({ connections }),
      }
    );
  }

  // Pain Point endpoints
  async getPainPoints(processId: string): Promise<{ painPoints: PainPoint[] }> {
    return this.request<{ painPoints: PainPoint[] }>(
      `/api/processes/${processId}/pain-points`,
      {
        method: 'GET',
      }
    );
  }

  async getPainPoint(id: string): Promise<{ painPoint: PainPoint }> {
    return this.request<{ painPoint: PainPoint }>(`/api/pain-points/${id}`, {
      method: 'GET',
    });
  }

  async createPainPoint(
    processId: string,
    data: CreatePainPointData
  ): Promise<{ painPoint: PainPoint; message: string }> {
    return this.request<{ painPoint: PainPoint; message: string }>(
      `/api/processes/${processId}/pain-points`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async updatePainPoint(
    id: string,
    data: UpdatePainPointData
  ): Promise<{ painPoint: PainPoint; message: string }> {
    return this.request<{ painPoint: PainPoint; message: string }>(
      `/api/pain-points/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async deletePainPoint(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/pain-points/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient(API_URL);
