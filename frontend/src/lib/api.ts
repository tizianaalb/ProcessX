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

// AI Analysis interfaces
export interface AIAnalysis {
  id: string;
  processId: string;
  analysisType: 'FULL' | 'PAIN_POINTS' | 'RECOMMENDATIONS' | 'TO_BE';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  progressStep?: 'gathering' | 'understanding' | 'pain_points' | 'recommendations' | 'to_be';
  understanding?: any;
  detectedPainPoints?: any[];
  recommendations?: any[];
  generatedProcess?: any;
  aiProvider: string;
  modelId?: string;
  tokensUsed?: number;
  cost?: number;
  errorMessage?: string;
  initiatedById: string;
  completedAt?: string;
  createdAt: string;
  process?: {
    name: string;
    type: string;
  };
  initiatedBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  processRecommendations?: ProcessRecommendation[];
}

export interface ProcessRecommendation {
  id: string;
  processId: string;
  analysisId?: string;
  category: 'QUICK_WIN' | 'STRATEGIC' | 'AUTOMATION' | 'INTEGRATION' | 'REDESIGN';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  expectedBenefits: string[];
  implementation: {
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
    timeline: string;
    steps: string[];
  };
  metrics: {
    timeSaving?: number;
    costSaving?: number;
    riskReduction?: number;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';
  approvedById?: string;
  approvedAt?: string;
  implementedAt?: string;
  createdAt: string;
  updatedAt: string;
  analysis?: {
    id: string;
    analysisType: string;
    createdAt: string;
  };
  approvedBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface StartAnalysisData {
  analysisType?: 'FULL' | 'PAIN_POINTS' | 'RECOMMENDATIONS' | 'TO_BE';
}

// AI Process Generation interfaces
export interface GenerateProcessData {
  description: string;
  processType?: 'AS_IS' | 'TO_BE';
  industryContext?: string;
  category?: string;
  subcategory?: string;
  createImmediately?: boolean;
}

export interface GeneratedProcessPreview {
  name: string;
  description: string;
  steps: Array<{
    id: string;
    name: string;
    description: string;
    type: 'START' | 'TASK' | 'DECISION' | 'END';
    duration?: number;
    position: { x: number; y: number };
    metadata?: {
      responsibleRole?: string;
      department?: string;
      requiredSystems?: string[];
    };
  }>;
  connections: Array<{
    sourceStepId: string;
    targetStepId: string;
    label?: string;
    type: 'DEFAULT' | 'CONDITIONAL';
  }>;
}

// Template interfaces
export interface ProcessTemplate {
  id: string;
  organizationId?: string;
  name: string;
  description?: string;
  category?: string;
  industrySector: string;
  templateData: {
    steps: Array<any>;
    connections: Array<any>;
  };
  previewImageUrl?: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
  };
}

export interface UseTemplateData {
  name?: string;
  description?: string;
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

  async updateProcessSteps(
    processId: string,
    steps: Array<{ id: string; name: string; description?: string; type?: string; duration?: number; position?: { x: number; y: number } }>
  ): Promise<{ steps: ProcessStep[]; message: string }> {
    return this.request<{ steps: ProcessStep[]; message: string }>(
      `/api/processes/${processId}/steps`,
      {
        method: 'PUT',
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

  async deleteProcessStep(stepId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/steps/${stepId}`, {
      method: 'DELETE',
    });
  }

  async deleteProcessConnection(connectionId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/connections/${connectionId}`, {
      method: 'DELETE',
    });
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

  // AI Analysis endpoints
  async startAnalysis(
    processId: string,
    data: StartAnalysisData = {}
  ): Promise<{ success: boolean; message: string; analysisId: string }> {
    return this.request<{ success: boolean; message: string; analysisId: string }>(
      `/api/processes/${processId}/analyze`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getAnalysis(analysisId: string): Promise<{ success: boolean; analysis: AIAnalysis }> {
    return this.request<{ success: boolean; analysis: AIAnalysis }>(
      `/api/analyses/${analysisId}`,
      {
        method: 'GET',
      }
    );
  }

  async getProcessAnalyses(processId: string): Promise<{ success: boolean; analyses: AIAnalysis[] }> {
    return this.request<{ success: boolean; analyses: AIAnalysis[] }>(
      `/api/processes/${processId}/analyses`,
      {
        method: 'GET',
      }
    );
  }

  async deleteAnalysis(analysisId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/api/analyses/${analysisId}`,
      {
        method: 'DELETE',
      }
    );
  }

  async getProcessRecommendations(
    processId: string,
    status?: string
  ): Promise<{ success: boolean; recommendations: ProcessRecommendation[] }> {
    const queryParams = status ? `?status=${status}` : '';
    return this.request<{ success: boolean; recommendations: ProcessRecommendation[] }>(
      `/api/processes/${processId}/recommendations${queryParams}`,
      {
        method: 'GET',
      }
    );
  }

  async approveRecommendation(
    recommendationId: string
  ): Promise<{ success: boolean; recommendation: ProcessRecommendation }> {
    return this.request<{ success: boolean; recommendation: ProcessRecommendation }>(
      `/api/recommendations/${recommendationId}/approve`,
      {
        method: 'POST',
      }
    );
  }

  async rejectRecommendation(
    recommendationId: string
  ): Promise<{ success: boolean; recommendation: ProcessRecommendation }> {
    return this.request<{ success: boolean; recommendation: ProcessRecommendation }>(
      `/api/recommendations/${recommendationId}/reject`,
      {
        method: 'POST',
      }
    );
  }

  async implementRecommendation(
    recommendationId: string
  ): Promise<{ success: boolean; recommendation: ProcessRecommendation }> {
    return this.request<{ success: boolean; recommendation: ProcessRecommendation }>(
      `/api/recommendations/${recommendationId}/implement`,
      {
        method: 'POST',
      }
    );
  }

  // AI Process Generation endpoint
  async generateProcessFromDescription(
    data: GenerateProcessData
  ): Promise<{ success: boolean; message: string; preview?: GeneratedProcessPreview; process?: Process }> {
    return this.request<{ success: boolean; message: string; preview?: GeneratedProcessPreview; process?: Process }>(
      '/api/processes/generate-from-description',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  // Template endpoints
  async getTemplates(params?: { category?: string; industrySector?: string }): Promise<{ success: boolean; templates: ProcessTemplate[] }> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.industrySector) queryParams.append('industrySector', params.industrySector);

    const queryString = queryParams.toString();
    return this.request<{ success: boolean; templates: ProcessTemplate[] }>(
      `/api/templates${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
      }
    );
  }

  async getTemplate(id: string): Promise<{ success: boolean; template: ProcessTemplate }> {
    return this.request<{ success: boolean; template: ProcessTemplate }>(
      `/api/templates/${id}`,
      {
        method: 'GET',
      }
    );
  }

  async useTemplate(id: string, data: UseTemplateData = {}): Promise<{ success: boolean; message: string; process: Process }> {
    return this.request<{ success: boolean; message: string; process: Process }>(
      `/api/templates/${id}/use`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  // Export analysis endpoint
  async exportAnalysis(analysisId: string, format: 'markdown' | 'powerpoint' | 'pdf' | 'excel' | 'word'): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const url = `${this.baseURL}/api/analyses/${analysisId}/export/${format}`;
    console.log('Export URL:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Export response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export error response:', errorText);
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.error || error.message || 'Export failed');
        } catch {
          throw new Error(`Export failed: ${response.status} ${response.statusText}`);
        }
      }

      // Get filename from Content-Disposition header or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      console.log('Content-Disposition:', contentDisposition);

      const extensionMap: Record<string, string> = {
        markdown: 'md',
        powerpoint: 'pptx',
        pdf: 'pdf',
        excel: 'xlsx',
        word: 'docx',
      };
      let filename = `analysis.${extensionMap[format] || 'file'}`;
      if (contentDisposition) {
        const matches = /filename="(.+)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      console.log('Downloading file:', filename);

      // Download the file
      const blob = await response.blob();
      console.log('Blob size:', blob.size, 'type:', blob.type);

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      console.log('File download triggered');
    } catch (error) {
      console.error('Export analysis error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to export analysis');
    }
  }

  // BPMN import endpoint
  async importBPMN(file: File): Promise<{ success: boolean; message: string; process?: any }> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const formData = new FormData();
    formData.append('bpmnFile', file);

    try {
      const response = await fetch(`${this.baseURL}/api/bpmn/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to import BPMN');
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to import BPMN file');
    }
  }

  // BPMN export endpoint
  async exportBPMN(processId: string): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const url = `${this.baseURL}/api/processes/${processId}/export/bpmn`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(error.error || 'Failed to export BPMN');
      }

      // Get filename from Content-Disposition header or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'process.bpmn';
      if (contentDisposition) {
        const matches = /filename="(.+)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to export BPMN');
    }
  }
}

// Analytics interfaces
export interface ProcessHealthResult {
  processId: string;
  score: number;
  complexity: number;
  bottlenecks: number;
  cycleTime: number | null;
  details: {
    overall: number;
    complexity: {
      score: number;
      nodeCount: number;
      connectionCount: number;
      branchingFactor: number;
      nestingDepth: number;
    };
    efficiency: {
      score: number;
      totalDuration: number;
      bottleneckCount: number;
      avgStepDuration: number;
      criticalPathLength: number;
    };
    automation: {
      score: number;
      automatedSteps: number;
      manualSteps: number;
      automationRatio: number;
    };
    documentation: {
      score: number;
      stepsWithDescriptions: number;
      stepsWithRoles: number;
      completenessRatio: number;
    };
    riskFactors: string[];
    recommendations: string[];
  };
  trend: 'improving' | 'stable' | 'declining' | 'new';
}

export interface OrganizationHealthSummary {
  totalProcesses: number;
  processesWithHealth: number;
  averageScore: number;
  healthyProcesses: number;
  atRiskProcesses: number;
  criticalProcesses: number;
  distribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    critical: number;
  };
}

export interface AnalyticsSummary {
  processes: {
    total: number;
    active: number;
    draft: number;
  };
  painPoints: {
    open: number;
    critical: number;
  };
  recommendations: {
    pending: number;
    implemented: number;
  };
  health: OrganizationHealthSummary;
  recentActivity: Array<{
    id: string;
    name: string;
    status: string;
    updatedAt: string;
  }>;
}

// Notification interfaces
export interface Notification {
  id: string;
  userId: string;
  type: 'mention' | 'review_request' | 'approval' | 'rejection' | 'comment' | 'system';
  title: string;
  content: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

// Review interfaces
export interface ProcessReview {
  id: string;
  processId: string;
  requesterId: string;
  reviewerId: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comments: string | null;
  decision: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  process?: {
    id: string;
    name: string;
    status: string;
  };
  requester?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  reviewer?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

export interface CreateReviewData {
  processId: string;
  reviewerId?: string;
  comments?: string;
}

export interface UpdateReviewData {
  status: 'approved' | 'rejected' | 'changes_requested';
  decision?: string;
  comments?: string;
}

export interface ReviewStats {
  pending: number;
  approved: number;
  rejected: number;
  changesRequested: number;
  avgReviewTime: number | null;
}

export const api = new ApiClient(API_URL);

// Extend api with new methods
export const analyticsApi = {
  getOrganizationHealth: (): Promise<OrganizationHealthSummary> =>
    api['request']('/api/analytics/health/organization'),

  getProcessHealth: (processId: string, recalculate = false): Promise<ProcessHealthResult> =>
    api['request'](`/api/analytics/health/processes/${processId}${recalculate ? '?recalculate=true' : ''}`),

  calculateProcessHealth: (processId: string): Promise<ProcessHealthResult> =>
    api['request'](`/api/analytics/health/processes/${processId}/calculate`, { method: 'POST' }),

  getProcessHealthHistory: (processId: string, limit = 30): Promise<any[]> =>
    api['request'](`/api/analytics/health/processes/${processId}/history?limit=${limit}`),

  getSummary: (): Promise<AnalyticsSummary> =>
    api['request']('/api/analytics/summary'),

  getTrends: (days = 30): Promise<any> =>
    api['request'](`/api/analytics/trends?days=${days}`),
};

export const notificationApi = {
  getNotifications: (options?: { limit?: number; offset?: number; unreadOnly?: boolean }): Promise<NotificationsResponse> => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));
    if (options?.unreadOnly) params.append('unreadOnly', 'true');
    const queryString = params.toString();
    return api['request'](`/api/notifications${queryString ? `?${queryString}` : ''}`);
  },

  getUnreadCount: (): Promise<{ count: number }> =>
    api['request']('/api/notifications/unread-count'),

  markAsRead: (notificationId: string): Promise<Notification> =>
    api['request'](`/api/notifications/${notificationId}/read`, { method: 'PATCH' }),

  markAllAsRead: (): Promise<{ success: boolean; count: number }> =>
    api['request']('/api/notifications/mark-all-read', { method: 'POST' }),

  deleteNotification: (notificationId: string): Promise<{ success: boolean }> =>
    api['request'](`/api/notifications/${notificationId}`, { method: 'DELETE' }),
};

export const reviewApi = {
  createReview: (data: CreateReviewData): Promise<ProcessReview> =>
    api['request']('/api/reviews', { method: 'POST', body: JSON.stringify(data) }),

  getPendingReviews: (): Promise<ProcessReview[]> =>
    api['request']('/api/reviews/pending'),

  getMyRequests: (): Promise<ProcessReview[]> =>
    api['request']('/api/reviews/my-requests'),

  getReviewStats: (): Promise<ReviewStats> =>
    api['request']('/api/reviews/stats'),

  getProcessReviews: (processId: string): Promise<ProcessReview[]> =>
    api['request'](`/api/reviews/process/${processId}`),

  getReview: (reviewId: string): Promise<ProcessReview> =>
    api['request'](`/api/reviews/${reviewId}`),

  updateReview: (reviewId: string, data: UpdateReviewData): Promise<ProcessReview> =>
    api['request'](`/api/reviews/${reviewId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  assignReviewer: (reviewId: string, reviewerId: string): Promise<ProcessReview> =>
    api['request'](`/api/reviews/${reviewId}/assign`, { method: 'POST', body: JSON.stringify({ reviewerId }) }),

  cancelReview: (reviewId: string): Promise<{ success: boolean }> =>
    api['request'](`/api/reviews/${reviewId}`, { method: 'DELETE' }),
};
