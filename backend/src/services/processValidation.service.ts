import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  type: string;
  severity: ValidationSeverity;
  message: string;
  stepId?: string;
  stepName?: string;
  connectionId?: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

export class ProcessValidationService {
  /**
   * Validate a process and return all issues
   */
  async validateProcess(processId: string): Promise<ValidationResult> {
    const process = await prisma.process.findUnique({
      where: { id: processId },
      include: {
        steps: { orderBy: { order: 'asc' } },
        connections: true,
      },
    });

    if (!process) {
      throw new Error('Process not found');
    }

    const issues: ValidationIssue[] = [];

    // Run all validation rules
    issues.push(...this.validateStartEndNodes(process.steps));
    issues.push(...this.validateConnectivity(process.steps, process.connections));
    issues.push(...this.validateDeadEnds(process.steps, process.connections));
    issues.push(...this.validateOrphanNodes(process.steps, process.connections));
    issues.push(...this.validateDecisionGateways(process.steps, process.connections));
    issues.push(...this.validateDocumentation(process.steps));
    issues.push(...this.validateDurations(process.steps));
    issues.push(...this.validateRoleAssignments(process.steps));
    issues.push(...this.validateDuplicateNames(process.steps));
    issues.push(...this.validateSelfLoops(process.connections));

    // Calculate summary
    const summary = {
      errors: issues.filter((i) => i.severity === 'error').length,
      warnings: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
    };

    // Calculate validation score (0-100)
    const errorPenalty = summary.errors * 15;
    const warningPenalty = summary.warnings * 5;
    const score = Math.max(0, 100 - errorPenalty - warningPenalty);

    return {
      isValid: summary.errors === 0,
      score,
      issues,
      summary,
    };
  }

  /**
   * Validate in-memory process data (for real-time frontend validation)
   */
  validateProcessData(steps: any[], connections: any[]): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Run all validation rules
    issues.push(...this.validateStartEndNodes(steps));
    issues.push(...this.validateConnectivity(steps, connections));
    issues.push(...this.validateDeadEnds(steps, connections));
    issues.push(...this.validateOrphanNodes(steps, connections));
    issues.push(...this.validateDecisionGateways(steps, connections));
    issues.push(...this.validateDocumentation(steps));
    issues.push(...this.validateDurations(steps));
    issues.push(...this.validateRoleAssignments(steps));
    issues.push(...this.validateDuplicateNames(steps));
    issues.push(...this.validateSelfLoops(connections));

    const summary = {
      errors: issues.filter((i) => i.severity === 'error').length,
      warnings: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
    };

    const errorPenalty = summary.errors * 15;
    const warningPenalty = summary.warnings * 5;
    const score = Math.max(0, 100 - errorPenalty - warningPenalty);

    return {
      isValid: summary.errors === 0,
      score,
      issues,
      summary,
    };
  }

  /**
   * Rule: Process must have at least one Start and one End node
   */
  private validateStartEndNodes(steps: any[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const startNodes = steps.filter((s) =>
      s.type?.toLowerCase() === 'start' || s.type === 'START'
    );
    const endNodes = steps.filter((s) =>
      s.type?.toLowerCase() === 'end' || s.type === 'END'
    );

    if (startNodes.length === 0) {
      issues.push({
        id: 'no-start-node',
        type: 'structure',
        severity: 'error',
        message: 'Process has no Start node',
        suggestion: 'Add a Start node to define where the process begins',
      });
    }

    if (startNodes.length > 1) {
      issues.push({
        id: 'multiple-start-nodes',
        type: 'structure',
        severity: 'warning',
        message: `Process has ${startNodes.length} Start nodes (typically should have 1)`,
        suggestion: 'Consider consolidating to a single Start node unless parallel entry points are intentional',
      });
    }

    if (endNodes.length === 0) {
      issues.push({
        id: 'no-end-node',
        type: 'structure',
        severity: 'error',
        message: 'Process has no End node',
        suggestion: 'Add an End node to define where the process terminates',
      });
    }

    return issues;
  }

  /**
   * Rule: All nodes should be connected (no disconnected subgraphs)
   */
  private validateConnectivity(steps: any[], connections: any[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (steps.length <= 1) return issues;

    // Build adjacency list (undirected for connectivity check)
    const adj: Record<string, Set<string>> = {};
    steps.forEach((s) => {
      adj[s.id] = new Set();
    });

    connections.forEach((c) => {
      if (adj[c.sourceStepId]) adj[c.sourceStepId].add(c.targetStepId);
      if (adj[c.targetStepId]) adj[c.targetStepId].add(c.sourceStepId);
    });

    // BFS from first node
    const visited = new Set<string>();
    const queue = [steps[0]?.id];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = adj[current] || new Set();
      neighbors.forEach((n) => {
        if (!visited.has(n)) queue.push(n);
      });
    }

    // Check for disconnected nodes
    const disconnected = steps.filter((s) => !visited.has(s.id));

    if (disconnected.length > 0) {
      disconnected.forEach((step) => {
        issues.push({
          id: `disconnected-${step.id}`,
          type: 'connectivity',
          severity: 'error',
          message: `Node "${step.name}" is disconnected from the main process flow`,
          stepId: step.id,
          stepName: step.name,
          suggestion: 'Connect this node to other steps or remove it if not needed',
        });
      });
    }

    return issues;
  }

  /**
   * Rule: No dead ends (non-End nodes with no outgoing connections)
   */
  private validateDeadEnds(steps: any[], connections: any[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const outgoingMap: Record<string, number> = {};
    steps.forEach((s) => {
      outgoingMap[s.id] = 0;
    });

    connections.forEach((c) => {
      outgoingMap[c.sourceStepId] = (outgoingMap[c.sourceStepId] || 0) + 1;
    });

    const deadEnds = steps.filter((s) => {
      const type = s.type?.toLowerCase();
      // End nodes and annotations are allowed to have no outgoing
      if (type === 'end' || type === 'annotation' || type === 'dataobject') {
        return false;
      }
      return outgoingMap[s.id] === 0;
    });

    deadEnds.forEach((step) => {
      issues.push({
        id: `dead-end-${step.id}`,
        type: 'flow',
        severity: 'warning',
        message: `Node "${step.name}" has no outgoing connections (dead end)`,
        stepId: step.id,
        stepName: step.name,
        suggestion: 'Connect this node to the next step in the process or convert to an End node',
      });
    });

    return issues;
  }

  /**
   * Rule: No orphan nodes (non-Start nodes with no incoming connections)
   */
  private validateOrphanNodes(steps: any[], connections: any[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const incomingMap: Record<string, number> = {};
    steps.forEach((s) => {
      incomingMap[s.id] = 0;
    });

    connections.forEach((c) => {
      incomingMap[c.targetStepId] = (incomingMap[c.targetStepId] || 0) + 1;
    });

    const orphans = steps.filter((s) => {
      const type = s.type?.toLowerCase();
      // Start nodes, annotations, and data objects are allowed to have no incoming
      if (type === 'start' || type === 'annotation' || type === 'dataobject') {
        return false;
      }
      return incomingMap[s.id] === 0;
    });

    orphans.forEach((step) => {
      issues.push({
        id: `orphan-${step.id}`,
        type: 'flow',
        severity: 'warning',
        message: `Node "${step.name}" has no incoming connections (unreachable)`,
        stepId: step.id,
        stepName: step.name,
        suggestion: 'Connect this node from a previous step or convert to a Start node',
      });
    });

    return issues;
  }

  /**
   * Rule: Decision gateways should have at least 2 outgoing paths
   */
  private validateDecisionGateways(steps: any[], connections: any[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const outgoingCounts: Record<string, number> = {};
    connections.forEach((c) => {
      outgoingCounts[c.sourceStepId] = (outgoingCounts[c.sourceStepId] || 0) + 1;
    });

    const decisionTypes = ['decision', 'gateway', 'inclusive', 'exclusive', 'event'];
    const decisions = steps.filter((s) => {
      const type = s.type?.toLowerCase();
      return decisionTypes.some((dt) => type?.includes(dt));
    });

    decisions.forEach((step) => {
      const outgoing = outgoingCounts[step.id] || 0;
      if (outgoing < 2) {
        issues.push({
          id: `decision-single-path-${step.id}`,
          type: 'logic',
          severity: 'warning',
          message: `Decision node "${step.name}" has only ${outgoing} outgoing path(s) (should have 2+)`,
          stepId: step.id,
          stepName: step.name,
          suggestion: 'Add alternative paths from this decision point',
        });
      }
    });

    return issues;
  }

  /**
   * Rule: Steps should have descriptions
   */
  private validateDocumentation(steps: any[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const taskTypes = ['task', 'usertask', 'systemtask', 'subprocess', 'user_task', 'system_task'];
    const tasksWithoutDesc = steps.filter((s) => {
      const type = s.type?.toLowerCase();
      const isTask = taskTypes.some((tt) => type?.includes(tt));
      return isTask && (!s.description || s.description.trim().length === 0);
    });

    if (tasksWithoutDesc.length > 0) {
      const percentage = Math.round((tasksWithoutDesc.length / steps.length) * 100);
      if (percentage > 50) {
        issues.push({
          id: 'low-documentation',
          type: 'documentation',
          severity: 'info',
          message: `${tasksWithoutDesc.length} task(s) (${percentage}%) lack descriptions`,
          suggestion: 'Add descriptions to help others understand each step',
        });
      }
    }

    return issues;
  }

  /**
   * Rule: Tasks should have estimated durations
   */
  private validateDurations(steps: any[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const taskTypes = ['task', 'usertask', 'systemtask', 'user_task', 'system_task'];
    const tasksWithoutDuration = steps.filter((s) => {
      const type = s.type?.toLowerCase();
      const isTask = taskTypes.some((tt) => type?.includes(tt));
      return isTask && (!s.duration || s.duration <= 0);
    });

    if (tasksWithoutDuration.length > 3) {
      issues.push({
        id: 'missing-durations',
        type: 'metrics',
        severity: 'info',
        message: `${tasksWithoutDuration.length} task(s) have no duration estimates`,
        suggestion: 'Add duration estimates to enable cycle time analysis',
      });
    }

    return issues;
  }

  /**
   * Rule: Tasks should have responsible roles assigned
   */
  private validateRoleAssignments(steps: any[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const taskTypes = ['task', 'usertask', 'user_task'];
    const userTasksWithoutRole = steps.filter((s) => {
      const type = s.type?.toLowerCase();
      const isUserTask = taskTypes.some((tt) => type?.includes(tt)) && !type?.includes('system');
      return isUserTask && (!s.responsibleRole || s.responsibleRole.trim().length === 0);
    });

    if (userTasksWithoutRole.length > 2) {
      issues.push({
        id: 'missing-roles',
        type: 'accountability',
        severity: 'info',
        message: `${userTasksWithoutRole.length} user task(s) have no responsible role assigned`,
        suggestion: 'Assign roles to clarify accountability for each task',
      });
    }

    return issues;
  }

  /**
   * Rule: No duplicate step names
   */
  private validateDuplicateNames(steps: any[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const nameCounts: Record<string, number> = {};
    steps.forEach((s) => {
      const name = s.name?.toLowerCase() || '';
      nameCounts[name] = (nameCounts[name] || 0) + 1;
    });

    const duplicates = Object.entries(nameCounts)
      .filter(([_, count]) => count > 1)
      .map(([name]) => name);

    duplicates.forEach((name) => {
      const count = nameCounts[name];
      issues.push({
        id: `duplicate-name-${name}`,
        type: 'naming',
        severity: 'warning',
        message: `${count} steps share the name "${name}"`,
        suggestion: 'Use unique names to avoid confusion when referencing steps',
      });
    });

    return issues;
  }

  /**
   * Rule: No self-loops (connection from node to itself)
   */
  private validateSelfLoops(connections: any[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const selfLoops = connections.filter((c) => c.sourceStepId === c.targetStepId);

    selfLoops.forEach((conn) => {
      issues.push({
        id: `self-loop-${conn.id}`,
        type: 'logic',
        severity: 'error',
        message: 'Connection creates a self-loop (node connects to itself)',
        connectionId: conn.id,
        suggestion: 'Remove this connection or route through an intermediate step',
      });
    });

    return issues;
  }
}

export default new ProcessValidationService();
