import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AutomationCandidate {
  stepId: string;
  stepName: string;
  stepType: string;
  currentDuration: number;
  estimatedSavings: number;
  automationPotential: 'high' | 'medium' | 'low';
  automationType: string;
  reason: string;
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface AutomationOpportunityResult {
  processId: string;
  processName: string;
  overallScore: number;
  currentAutomationRatio: number;
  potentialAutomationRatio: number;
  totalManualSteps: number;
  automationCandidates: AutomationCandidate[];
  estimatedTimeSavings: number;
  estimatedAnnualCostSavings: number;
  quickWins: AutomationCandidate[];
  summary: {
    highPotential: number;
    mediumPotential: number;
    lowPotential: number;
  };
}

export class AutomationOpportunityService {
  // Average hourly cost for manual work (configurable)
  private readonly HOURLY_COST = 50;
  // Working hours per year
  private readonly WORKING_HOURS_PER_YEAR = 2080;

  /**
   * Analyze automation opportunities for a process
   */
  async analyzeProcess(processId: string): Promise<AutomationOpportunityResult> {
    const process = await prisma.process.findUnique({
      where: { id: processId },
      include: {
        steps: { orderBy: { order: 'asc' } },
        painPoints: {
          where: { status: 'OPEN' },
        },
      },
    });

    if (!process) {
      throw new Error('Process not found');
    }

    const candidates = this.identifyAutomationCandidates(process.steps, process.painPoints);

    // Calculate metrics
    const totalSteps = process.steps.length;
    const automatedTypes = ['systemtask', 'system_task', 'automated', 'service'];
    const currentAutomatedSteps = process.steps.filter((s) => {
      const type = (s.type || '').toLowerCase();
      return automatedTypes.some((t) => type.includes(t)) ||
             (s.requiredSystems && s.requiredSystems.length > 0);
    }).length;

    const manualSteps = totalSteps - currentAutomatedSteps;
    const currentAutomationRatio = totalSteps > 0 ? currentAutomatedSteps / totalSteps : 0;

    // Calculate potential automation ratio
    const highPotentialCount = candidates.filter((c) => c.automationPotential === 'high').length;
    const mediumPotentialCount = candidates.filter((c) => c.automationPotential === 'medium').length;
    const potentialNewAutomated = highPotentialCount + (mediumPotentialCount * 0.5);
    const potentialAutomationRatio = totalSteps > 0
      ? (currentAutomatedSteps + potentialNewAutomated) / totalSteps
      : currentAutomationRatio;

    // Calculate savings
    const estimatedTimeSavings = candidates.reduce((sum, c) => sum + c.estimatedSavings, 0);
    // Assume each step runs once per day on average
    const annualOccurrences = 250; // Working days
    const estimatedAnnualCostSavings = Math.round(
      (estimatedTimeSavings / 60) * this.HOURLY_COST * annualOccurrences
    );

    // Identify quick wins (high potential + simple complexity)
    const quickWins = candidates
      .filter((c) => c.automationPotential === 'high' && c.complexity === 'simple')
      .slice(0, 5);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(
      candidates,
      currentAutomationRatio,
      manualSteps
    );

    return {
      processId: process.id,
      processName: process.name,
      overallScore,
      currentAutomationRatio: Math.round(currentAutomationRatio * 100) / 100,
      potentialAutomationRatio: Math.round(potentialAutomationRatio * 100) / 100,
      totalManualSteps: manualSteps,
      automationCandidates: candidates,
      estimatedTimeSavings,
      estimatedAnnualCostSavings,
      quickWins,
      summary: {
        highPotential: highPotentialCount,
        mediumPotential: mediumPotentialCount,
        lowPotential: candidates.filter((c) => c.automationPotential === 'low').length,
      },
    };
  }

  /**
   * Identify steps that are good candidates for automation
   */
  private identifyAutomationCandidates(steps: any[], painPoints: any[]): AutomationCandidate[] {
    const candidates: AutomationCandidate[] = [];

    // Map pain points to steps
    const stepPainPoints: Record<string, any[]> = {};
    painPoints.forEach((pp) => {
      if (pp.processStepId) {
        stepPainPoints[pp.processStepId] = stepPainPoints[pp.processStepId] || [];
        stepPainPoints[pp.processStepId].push(pp);
      }
    });

    steps.forEach((step) => {
      const type = (step.type || '').toLowerCase();

      // Skip already automated steps
      const automatedTypes = ['systemtask', 'system_task', 'automated', 'service', 'start', 'end'];
      if (automatedTypes.some((t) => type.includes(t))) {
        return;
      }

      // Skip non-task nodes
      const taskTypes = ['task', 'usertask', 'user_task'];
      if (!taskTypes.some((t) => type.includes(t))) {
        return;
      }

      const analysis = this.analyzeStepForAutomation(step, stepPainPoints[step.id] || []);

      if (analysis.potential !== 'none') {
        candidates.push({
          stepId: step.id,
          stepName: step.name,
          stepType: step.type,
          currentDuration: step.duration || 0,
          estimatedSavings: analysis.estimatedSavings,
          automationPotential: analysis.potential,
          automationType: analysis.automationType,
          reason: analysis.reason,
          complexity: analysis.complexity,
        });
      }
    });

    // Sort by potential (high first) then by savings (highest first)
    return candidates.sort((a, b) => {
      const potentialOrder = { high: 0, medium: 1, low: 2 };
      const potentialDiff = potentialOrder[a.automationPotential] - potentialOrder[b.automationPotential];
      if (potentialDiff !== 0) return potentialDiff;
      return b.estimatedSavings - a.estimatedSavings;
    });
  }

  /**
   * Analyze a single step for automation potential
   */
  private analyzeStepForAutomation(
    step: any,
    painPoints: any[]
  ): {
    potential: 'high' | 'medium' | 'low' | 'none';
    automationType: string;
    reason: string;
    estimatedSavings: number;
    complexity: 'simple' | 'moderate' | 'complex';
  } {
    const name = (step.name || '').toLowerCase();
    const description = (step.description || '').toLowerCase();
    const duration = step.duration || 0;
    const hasPainPoints = painPoints.length > 0;
    const hasManualPainPoint = painPoints.some((pp) => pp.category === 'MANUAL_PROCESS');

    // Keywords indicating automation potential
    const dataEntryKeywords = ['enter', 'input', 'fill', 'data entry', 'type', 'record'];
    const verificationKeywords = ['verify', 'check', 'validate', 'confirm', 'review'];
    const notificationKeywords = ['notify', 'email', 'send', 'alert', 'communicate'];
    const copyKeywords = ['copy', 'transfer', 'move', 'duplicate', 'sync'];
    const approvalKeywords = ['approve', 'sign', 'authorize', 'consent'];
    const reportKeywords = ['report', 'generate', 'create report', 'extract', 'compile'];

    let potential: 'high' | 'medium' | 'low' | 'none' = 'none';
    let automationType = '';
    let reason = '';
    let complexity: 'simple' | 'moderate' | 'complex' = 'moderate';
    let savingsMultiplier = 0.5;

    // Check for data entry (high potential)
    if (dataEntryKeywords.some((k) => name.includes(k) || description.includes(k))) {
      potential = 'high';
      automationType = 'RPA / Data Integration';
      reason = 'Repetitive data entry can be automated with RPA or API integration';
      complexity = 'simple';
      savingsMultiplier = 0.8;
    }
    // Check for notifications (high potential)
    else if (notificationKeywords.some((k) => name.includes(k) || description.includes(k))) {
      potential = 'high';
      automationType = 'Workflow Automation';
      reason = 'Notifications can be automated with workflow triggers';
      complexity = 'simple';
      savingsMultiplier = 0.9;
    }
    // Check for copy/transfer (high potential)
    else if (copyKeywords.some((k) => name.includes(k) || description.includes(k))) {
      potential = 'high';
      automationType = 'Integration / ETL';
      reason = 'Data transfer between systems can be automated';
      complexity = 'moderate';
      savingsMultiplier = 0.75;
    }
    // Check for report generation (high potential)
    else if (reportKeywords.some((k) => name.includes(k) || description.includes(k))) {
      potential = 'high';
      automationType = 'Scheduled Automation';
      reason = 'Report generation can be scheduled and automated';
      complexity = 'moderate';
      savingsMultiplier = 0.7;
    }
    // Check for verification (medium potential)
    else if (verificationKeywords.some((k) => name.includes(k) || description.includes(k))) {
      potential = 'medium';
      automationType = 'Rule-based Validation';
      reason = 'Verification against rules can be partially automated';
      complexity = 'moderate';
      savingsMultiplier = 0.5;
    }
    // Check for approval (low potential - needs human judgment)
    else if (approvalKeywords.some((k) => name.includes(k) || description.includes(k))) {
      potential = 'low';
      automationType = 'Digital Workflow';
      reason = 'Can be streamlined with digital signatures, but requires human decision';
      complexity = 'simple';
      savingsMultiplier = 0.3;
    }
    // High duration tasks are candidates
    else if (duration > 30) {
      potential = 'medium';
      automationType = 'Process Optimization';
      reason = 'Long-running task may have automation opportunities';
      complexity = 'complex';
      savingsMultiplier = 0.4;
    }
    // Tasks with manual process pain points
    else if (hasManualPainPoint) {
      potential = 'high';
      automationType = 'RPA / Integration';
      reason = 'Identified as a manual process pain point';
      complexity = 'moderate';
      savingsMultiplier = 0.6;
    }
    // Tasks with other pain points
    else if (hasPainPoints) {
      potential = 'medium';
      automationType = 'Process Improvement';
      reason = 'Has associated pain points that may be resolved through automation';
      complexity = 'moderate';
      savingsMultiplier = 0.4;
    }
    // Generic tasks with systems
    else if (step.requiredSystems && step.requiredSystems.length > 1) {
      potential = 'medium';
      automationType = 'System Integration';
      reason = 'Uses multiple systems that could be integrated';
      complexity = 'complex';
      savingsMultiplier = 0.35;
    }

    const estimatedSavings = Math.round(duration * savingsMultiplier);

    return {
      potential,
      automationType,
      reason,
      estimatedSavings,
      complexity,
    };
  }

  /**
   * Calculate overall automation opportunity score
   */
  private calculateOverallScore(
    candidates: AutomationCandidate[],
    currentAutomationRatio: number,
    manualSteps: number
  ): number {
    if (manualSteps === 0) return 100; // Already fully automated

    const highCount = candidates.filter((c) => c.automationPotential === 'high').length;
    const mediumCount = candidates.filter((c) => c.automationPotential === 'medium').length;

    // Score based on opportunity (inverse of current automation)
    const automationGap = 1 - currentAutomationRatio;

    // Weight by potential
    const opportunityScore =
      (highCount * 20 + mediumCount * 10) / Math.max(1, manualSteps);

    // Combine scores
    const score = Math.min(100, Math.round(
      (automationGap * 50) + (opportunityScore * 50)
    ));

    return score;
  }

  /**
   * Get organization-wide automation summary
   */
  async getOrganizationSummary(organizationId: string): Promise<any> {
    const processes = await prisma.process.findMany({
      where: { organizationId },
      include: {
        steps: true,
      },
    });

    let totalSteps = 0;
    let totalAutomated = 0;
    let totalManual = 0;

    const automatedTypes = ['systemtask', 'system_task', 'automated', 'service'];

    processes.forEach((process) => {
      process.steps.forEach((step) => {
        totalSteps++;
        const type = (step.type || '').toLowerCase();
        if (automatedTypes.some((t) => type.includes(t)) ||
            (step.requiredSystems && step.requiredSystems.length > 0)) {
          totalAutomated++;
        } else if (['task', 'usertask', 'user_task'].some((t) => type.includes(t))) {
          totalManual++;
        }
      });
    });

    return {
      totalProcesses: processes.length,
      totalSteps,
      totalAutomated,
      totalManual,
      automationRatio: totalSteps > 0 ? Math.round((totalAutomated / totalSteps) * 100) : 0,
      manualRatio: totalSteps > 0 ? Math.round((totalManual / totalSteps) * 100) : 0,
    };
  }
}

export default new AutomationOpportunityService();
