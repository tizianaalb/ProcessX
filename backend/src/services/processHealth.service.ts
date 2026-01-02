import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface HealthScoreDetails {
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
}

export interface ProcessHealthResult {
  processId: string;
  score: number;
  complexity: number;
  bottlenecks: number;
  cycleTime: number | null;
  details: HealthScoreDetails;
  trend: 'improving' | 'stable' | 'declining' | 'new';
}

export class ProcessHealthService {
  /**
   * Calculate and store health score for a process
   */
  async calculateHealthScore(processId: string): Promise<ProcessHealthResult> {
    const process = await prisma.process.findUnique({
      where: { id: processId },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        connections: true,
        painPoints: {
          where: { status: 'OPEN' },
        },
        healthMetrics: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!process) {
      throw new Error('Process not found');
    }

    const details = this.analyzeProcess(process);
    const overallScore = this.calculateOverallScore(details);
    const trend = this.calculateTrend(process.healthMetrics, overallScore);

    // Store health metric
    await prisma.processHealthMetric.create({
      data: {
        processId,
        score: overallScore,
        complexity: details.complexity.score,
        bottlenecks: details.efficiency.bottleneckCount,
        cycleTime: details.efficiency.totalDuration || null,
        details: details as any,
      },
    });

    return {
      processId,
      score: overallScore,
      complexity: details.complexity.score,
      bottlenecks: details.efficiency.bottleneckCount,
      cycleTime: details.efficiency.totalDuration || null,
      details,
      trend,
    };
  }

  /**
   * Get latest health score for a process (without recalculating)
   */
  async getLatestHealthScore(processId: string): Promise<ProcessHealthResult | null> {
    const latest = await prisma.processHealthMetric.findFirst({
      where: { processId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) {
      return null;
    }

    const recentMetrics = await prisma.processHealthMetric.findMany({
      where: { processId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      processId,
      score: latest.score,
      complexity: latest.complexity,
      bottlenecks: latest.bottlenecks,
      cycleTime: latest.cycleTime,
      details: latest.details as unknown as HealthScoreDetails,
      trend: this.calculateTrend(recentMetrics, latest.score),
    };
  }

  /**
   * Get health history for a process
   */
  async getHealthHistory(processId: string, limit: number = 30): Promise<any[]> {
    return prisma.processHealthMetric.findMany({
      where: { processId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        score: true,
        complexity: true,
        bottlenecks: true,
        cycleTime: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get organization-wide health summary
   */
  async getOrganizationHealthSummary(organizationId: string): Promise<any> {
    const processes = await prisma.process.findMany({
      where: { organizationId },
      include: {
        healthMetrics: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const processesWithHealth = processes.filter((p) => p.healthMetrics.length > 0);

    if (processesWithHealth.length === 0) {
      return {
        totalProcesses: processes.length,
        processesWithHealth: 0,
        averageScore: 0,
        healthyProcesses: 0,
        atRiskProcesses: 0,
        criticalProcesses: 0,
        distribution: { excellent: 0, good: 0, fair: 0, poor: 0, critical: 0 },
      };
    }

    const scores = processesWithHealth.map((p) => p.healthMetrics[0].score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    return {
      totalProcesses: processes.length,
      processesWithHealth: processesWithHealth.length,
      averageScore: Math.round(avgScore),
      healthyProcesses: scores.filter((s) => s >= 70).length,
      atRiskProcesses: scores.filter((s) => s >= 40 && s < 70).length,
      criticalProcesses: scores.filter((s) => s < 40).length,
      distribution: {
        excellent: scores.filter((s) => s >= 90).length,
        good: scores.filter((s) => s >= 70 && s < 90).length,
        fair: scores.filter((s) => s >= 50 && s < 70).length,
        poor: scores.filter((s) => s >= 30 && s < 50).length,
        critical: scores.filter((s) => s < 30).length,
      },
    };
  }

  /**
   * Analyze process and calculate detailed scores
   */
  private analyzeProcess(process: any): HealthScoreDetails {
    const steps = process.steps || [];
    const connections = process.connections || [];
    const painPoints = process.painPoints || [];

    // Complexity analysis
    const complexity = this.analyzeComplexity(steps, connections);

    // Efficiency analysis
    const efficiency = this.analyzeEfficiency(steps, connections, painPoints);

    // Automation analysis
    const automation = this.analyzeAutomation(steps);

    // Documentation analysis
    const documentation = this.analyzeDocumentation(steps);

    // Risk factors
    const riskFactors = this.identifyRiskFactors(complexity, efficiency, automation, painPoints);

    // Recommendations
    const recommendations = this.generateQuickRecommendations(complexity, efficiency, automation, documentation);

    return {
      overall: 0, // Will be calculated separately
      complexity,
      efficiency,
      automation,
      documentation,
      riskFactors,
      recommendations,
    };
  }

  /**
   * Analyze process complexity
   */
  private analyzeComplexity(steps: any[], connections: any[]): HealthScoreDetails['complexity'] {
    const nodeCount = steps.length;
    const connectionCount = connections.length;

    // Calculate branching factor (avg outgoing connections per node)
    const outgoingCounts: Record<string, number> = {};
    connections.forEach((conn) => {
      outgoingCounts[conn.sourceStepId] = (outgoingCounts[conn.sourceStepId] || 0) + 1;
    });
    const branchingFactor = nodeCount > 0
      ? Object.values(outgoingCounts).reduce((a, b) => a + b, 0) / nodeCount
      : 0;

    // Calculate nesting depth (based on decision nodes)
    const decisionNodes = steps.filter((s) =>
      s.type === 'DECISION' || s.type === 'decision' || s.type === 'gateway_exclusive'
    );
    const nestingDepth = decisionNodes.length;

    // Score calculation: lower complexity = higher score
    // Optimal: 5-15 steps, branching < 2, nesting < 3
    let score = 100;

    if (nodeCount > 30) score -= 30;
    else if (nodeCount > 20) score -= 15;
    else if (nodeCount < 3) score -= 20;

    if (branchingFactor > 3) score -= 20;
    else if (branchingFactor > 2) score -= 10;

    if (nestingDepth > 5) score -= 20;
    else if (nestingDepth > 3) score -= 10;

    return {
      score: Math.max(0, score),
      nodeCount,
      connectionCount,
      branchingFactor: Math.round(branchingFactor * 100) / 100,
      nestingDepth,
    };
  }

  /**
   * Analyze process efficiency
   */
  private analyzeEfficiency(steps: any[], connections: any[], painPoints: any[]): HealthScoreDetails['efficiency'] {
    const durations = steps.map((s) => s.duration || 0).filter((d) => d > 0);
    const totalDuration = durations.reduce((a, b) => a + b, 0);
    const avgStepDuration = durations.length > 0 ? totalDuration / durations.length : 0;

    // Identify bottlenecks (steps with duration > 2x average)
    const bottleneckThreshold = avgStepDuration * 2;
    const bottleneckCount = durations.filter((d) => d > bottleneckThreshold).length;

    // Add open pain points to bottleneck count
    const painPointBottlenecks = painPoints.filter((pp) =>
      pp.category === 'BOTTLENECK' && pp.status === 'OPEN'
    ).length;

    // Calculate critical path length (simplified: longest chain)
    const criticalPathLength = this.calculateCriticalPath(steps, connections);

    // Score calculation
    let score = 100;

    // Penalize for bottlenecks
    score -= (bottleneckCount + painPointBottlenecks) * 10;

    // Penalize for very long total duration (>480 min = 8 hours)
    if (totalDuration > 480) score -= 20;
    else if (totalDuration > 240) score -= 10;

    // Penalize for long critical path
    if (criticalPathLength > 15) score -= 15;
    else if (criticalPathLength > 10) score -= 10;

    return {
      score: Math.max(0, score),
      totalDuration,
      bottleneckCount: bottleneckCount + painPointBottlenecks,
      avgStepDuration: Math.round(avgStepDuration),
      criticalPathLength,
    };
  }

  /**
   * Calculate critical path length
   */
  private calculateCriticalPath(steps: any[], connections: any[]): number {
    if (steps.length === 0) return 0;

    // Build adjacency list
    const adj: Record<string, string[]> = {};
    steps.forEach((s) => {
      adj[s.id] = [];
    });
    connections.forEach((c) => {
      if (adj[c.sourceStepId]) {
        adj[c.sourceStepId].push(c.targetStepId);
      }
    });

    // Find start nodes (no incoming connections)
    const hasIncoming = new Set(connections.map((c) => c.targetStepId));
    const startNodes = steps.filter((s) => !hasIncoming.has(s.id));

    // BFS to find longest path
    let maxLength = 0;
    const visited = new Set<string>();

    const dfs = (nodeId: string, depth: number) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      maxLength = Math.max(maxLength, depth);

      const neighbors = adj[nodeId] || [];
      neighbors.forEach((neighbor) => {
        dfs(neighbor, depth + 1);
      });
      visited.delete(nodeId);
    };

    startNodes.forEach((start) => {
      dfs(start.id, 1);
    });

    return maxLength || steps.length;
  }

  /**
   * Analyze automation level
   */
  private analyzeAutomation(steps: any[]): HealthScoreDetails['automation'] {
    const automatedTypes = ['automated', 'script_task', 'service_task', 'message_event'];
    const manualTypes = ['task', 'TASK', 'user_task', 'manual_task'];

    const automatedSteps = steps.filter((s) => {
      const type = s.type?.toLowerCase();
      return automatedTypes.some((t) => type?.includes(t)) ||
             (s.requiredSystems && s.requiredSystems.length > 0);
    }).length;

    const manualSteps = steps.filter((s) => {
      const type = s.type?.toLowerCase();
      return manualTypes.some((t) => type?.includes(t)) &&
             (!s.requiredSystems || s.requiredSystems.length === 0);
    }).length;

    const automationRatio = steps.length > 0
      ? automatedSteps / steps.length
      : 0;

    // Score: 50% automation is baseline good
    let score = Math.min(100, automationRatio * 150);

    return {
      score: Math.round(score),
      automatedSteps,
      manualSteps,
      automationRatio: Math.round(automationRatio * 100) / 100,
    };
  }

  /**
   * Analyze documentation completeness
   */
  private analyzeDocumentation(steps: any[]): HealthScoreDetails['documentation'] {
    if (steps.length === 0) {
      return {
        score: 0,
        stepsWithDescriptions: 0,
        stepsWithRoles: 0,
        completenessRatio: 0,
      };
    }

    const stepsWithDescriptions = steps.filter(
      (s) => s.description && s.description.trim().length > 0
    ).length;

    const stepsWithRoles = steps.filter(
      (s) => s.responsibleRole && s.responsibleRole.trim().length > 0
    ).length;

    const completenessRatio = (stepsWithDescriptions + stepsWithRoles) / (steps.length * 2);

    // Score based on completeness
    const score = Math.round(completenessRatio * 100);

    return {
      score,
      stepsWithDescriptions,
      stepsWithRoles,
      completenessRatio: Math.round(completenessRatio * 100) / 100,
    };
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(
    complexity: HealthScoreDetails['complexity'],
    efficiency: HealthScoreDetails['efficiency'],
    automation: HealthScoreDetails['automation'],
    painPoints: any[]
  ): string[] {
    const risks: string[] = [];

    if (complexity.nodeCount > 25) {
      risks.push('High process complexity with many steps');
    }

    if (complexity.branchingFactor > 2.5) {
      risks.push('High branching complexity may cause confusion');
    }

    if (efficiency.bottleneckCount >= 3) {
      risks.push('Multiple bottlenecks detected');
    }

    if (automation.automationRatio < 0.3) {
      risks.push('Low automation level increases manual errors');
    }

    if (painPoints.length > 5) {
      risks.push('Many open pain points require attention');
    }

    if (efficiency.totalDuration > 480) {
      risks.push('Long cycle time may impact SLAs');
    }

    return risks;
  }

  /**
   * Generate quick recommendations
   */
  private generateQuickRecommendations(
    complexity: HealthScoreDetails['complexity'],
    efficiency: HealthScoreDetails['efficiency'],
    automation: HealthScoreDetails['automation'],
    documentation: HealthScoreDetails['documentation']
  ): string[] {
    const recommendations: string[] = [];

    if (complexity.score < 70) {
      recommendations.push('Consider simplifying the process by combining related steps');
    }

    if (efficiency.bottleneckCount > 0) {
      recommendations.push('Address identified bottlenecks to improve flow');
    }

    if (automation.score < 50) {
      recommendations.push('Identify tasks suitable for automation');
    }

    if (documentation.score < 60) {
      recommendations.push('Improve step descriptions and role assignments');
    }

    if (efficiency.totalDuration > 240 && automation.automationRatio < 0.5) {
      recommendations.push('Automate manual steps to reduce cycle time');
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Calculate overall health score
   */
  private calculateOverallScore(details: HealthScoreDetails): number {
    // Weighted average of component scores
    const weights = {
      complexity: 0.25,
      efficiency: 0.35,
      automation: 0.25,
      documentation: 0.15,
    };

    const score =
      details.complexity.score * weights.complexity +
      details.efficiency.score * weights.efficiency +
      details.automation.score * weights.automation +
      details.documentation.score * weights.documentation;

    // Penalty for risk factors
    const riskPenalty = Math.min(20, details.riskFactors.length * 5);

    return Math.max(0, Math.round(score - riskPenalty));
  }

  /**
   * Calculate health trend
   */
  private calculateTrend(
    historicalMetrics: any[],
    currentScore: number
  ): 'improving' | 'stable' | 'declining' | 'new' {
    if (historicalMetrics.length < 2) {
      return 'new';
    }

    // Compare with average of last 3 scores
    const recentScores = historicalMetrics.slice(0, 3).map((m) => m.score);
    const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

    const difference = currentScore - avgRecent;

    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }
}

export default new ProcessHealthService();
