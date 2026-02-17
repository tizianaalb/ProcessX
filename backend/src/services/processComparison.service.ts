import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ComparisonMetrics {
  stepsAdded: number;
  stepsRemoved: number;
  stepsModified: number;
  totalDurationAsIs: number;
  totalDurationToBe: number;
  durationSavings: number;
  durationSavingsPercent: number;
  automationImprovement: number;
  bottlenecksReduced: number;
}

export interface ProcessComparisonResult {
  asIsProcess: {
    id: string;
    name: string;
    description: string | null;
    steps: any[];
    connections: any[];
    totalDuration: number;
    stepCount: number;
    automatedSteps: number;
    manualSteps: number;
  };
  toBeProcess: {
    id?: string;
    name: string;
    description: string | null;
    steps: any[];
    connections: any[];
    totalDuration: number;
    stepCount: number;
    automatedSteps: number;
    manualSteps: number;
    source: 'ai_generated' | 'linked_process';
  } | null;
  metrics: ComparisonMetrics | null;
  hasComparison: boolean;
}

export class ProcessComparisonService {
  /**
   * Get comparison data for a process
   * Looks for TO-BE process from AI analysis or linked TO-BE process
   */
  async getProcessComparison(processId: string): Promise<ProcessComparisonResult> {
    // Get the AS-IS process with steps and connections
    const asIsProcess = await prisma.process.findUnique({
      where: { id: processId },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        connections: true,
        aiAnalyses: {
          where: {
            status: 'COMPLETED',
            generatedProcess: { not: null },
          },
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!asIsProcess) {
      throw new Error('Process not found');
    }

    // Calculate AS-IS metrics
    const asIsMetrics = this.calculateProcessMetrics(asIsProcess.steps);

    const asIsData = {
      id: asIsProcess.id,
      name: asIsProcess.name,
      description: asIsProcess.description,
      steps: asIsProcess.steps,
      connections: asIsProcess.connections,
      totalDuration: asIsMetrics.totalDuration,
      stepCount: asIsProcess.steps.length,
      automatedSteps: asIsMetrics.automatedSteps,
      manualSteps: asIsMetrics.manualSteps,
    };

    // Check for AI-generated TO-BE process
    let toBeData = null;
    let source: 'ai_generated' | 'linked_process' = 'ai_generated';

    if (asIsProcess.aiAnalyses.length > 0 && asIsProcess.aiAnalyses[0].generatedProcess) {
      const generatedProcess = asIsProcess.aiAnalyses[0].generatedProcess as any;
      const toBeSteps = generatedProcess.steps || [];
      const toBeConnections = generatedProcess.connections || [];
      const toBeMetrics = this.calculateProcessMetrics(toBeSteps);

      toBeData = {
        name: generatedProcess.name || `${asIsProcess.name} (Optimized)`,
        description: generatedProcess.description || 'AI-generated optimized process',
        steps: toBeSteps,
        connections: toBeConnections,
        totalDuration: toBeMetrics.totalDuration,
        stepCount: toBeSteps.length,
        automatedSteps: toBeMetrics.automatedSteps,
        manualSteps: toBeMetrics.manualSteps,
        source: 'ai_generated' as const,
      };
    } else {
      // Check for linked TO-BE process (child version with type TO_BE)
      const linkedToBe = await prisma.process.findFirst({
        where: {
          parentProcessId: processId,
          type: 'TO_BE',
        },
        include: {
          steps: { orderBy: { order: 'asc' } },
          connections: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (linkedToBe) {
        const toBeMetrics = this.calculateProcessMetrics(linkedToBe.steps);
        source = 'linked_process';
        toBeData = {
          id: linkedToBe.id,
          name: linkedToBe.name,
          description: linkedToBe.description,
          steps: linkedToBe.steps,
          connections: linkedToBe.connections,
          totalDuration: toBeMetrics.totalDuration,
          stepCount: linkedToBe.steps.length,
          automatedSteps: toBeMetrics.automatedSteps,
          manualSteps: toBeMetrics.manualSteps,
          source: 'linked_process' as const,
        };
      }
    }

    // Calculate comparison metrics if TO-BE exists
    let metrics: ComparisonMetrics | null = null;
    if (toBeData) {
      metrics = this.calculateComparisonMetrics(asIsData, toBeData);
    }

    return {
      asIsProcess: asIsData,
      toBeProcess: toBeData,
      metrics,
      hasComparison: toBeData !== null,
    };
  }

  /**
   * Calculate metrics for a process
   */
  private calculateProcessMetrics(steps: any[]): {
    totalDuration: number;
    automatedSteps: number;
    manualSteps: number;
  } {
    const totalDuration = steps.reduce((sum, step) => sum + (step.duration || 0), 0);

    const automatedTypes = ['systemtask', 'system_task', 'automated', 'service'];
    const automatedSteps = steps.filter((s) => {
      const type = (s.type || '').toLowerCase();
      return automatedTypes.some((t) => type.includes(t)) ||
             (s.requiredSystems && s.requiredSystems.length > 0);
    }).length;

    const manualSteps = steps.length - automatedSteps;

    return { totalDuration, automatedSteps, manualSteps };
  }

  /**
   * Calculate comparison metrics between AS-IS and TO-BE
   */
  private calculateComparisonMetrics(
    asIs: { steps: any[]; totalDuration: number; automatedSteps: number; manualSteps: number },
    toBe: { steps: any[]; totalDuration: number; automatedSteps: number; manualSteps: number }
  ): ComparisonMetrics {
    // Find matching steps by name (simplified comparison)
    const asIsStepNames = new Set(asIs.steps.map((s) => s.name.toLowerCase()));
    const toBeStepNames = new Set(toBe.steps.map((s) => s.name.toLowerCase()));

    const stepsRemoved = asIs.steps.filter(
      (s) => !toBeStepNames.has(s.name.toLowerCase())
    ).length;

    const stepsAdded = toBe.steps.filter(
      (s) => !asIsStepNames.has(s.name.toLowerCase())
    ).length;

    // Steps that exist in both but may have changed
    const stepsModified = toBe.steps.filter((toBeStep) => {
      const asIsStep = asIs.steps.find(
        (s) => s.name.toLowerCase() === toBeStep.name.toLowerCase()
      );
      if (!asIsStep) return false;
      // Check if duration or type changed
      return asIsStep.duration !== toBeStep.duration || asIsStep.type !== toBeStep.type;
    }).length;

    // Duration savings
    const durationSavings = asIs.totalDuration - toBe.totalDuration;
    const durationSavingsPercent = asIs.totalDuration > 0
      ? Math.round((durationSavings / asIs.totalDuration) * 100)
      : 0;

    // Automation improvement
    const asIsAutomationRatio = asIs.steps.length > 0 ? asIs.automatedSteps / asIs.steps.length : 0;
    const toBeAutomationRatio = toBe.steps.length > 0 ? toBe.automatedSteps / toBe.steps.length : 0;
    const automationImprovement = Math.round((toBeAutomationRatio - asIsAutomationRatio) * 100);

    // Bottlenecks reduced (simplified: steps with duration > 60 min)
    const asIsBottlenecks = asIs.steps.filter((s) => (s.duration || 0) > 60).length;
    const toBeBottlenecks = toBe.steps.filter((s) => (s.duration || 0) > 60).length;
    const bottlenecksReduced = Math.max(0, asIsBottlenecks - toBeBottlenecks);

    return {
      stepsAdded,
      stepsRemoved,
      stepsModified,
      totalDurationAsIs: asIs.totalDuration,
      totalDurationToBe: toBe.totalDuration,
      durationSavings,
      durationSavingsPercent,
      automationImprovement,
      bottlenecksReduced,
    };
  }
}

export default new ProcessComparisonService();
