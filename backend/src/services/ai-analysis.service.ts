import { PrismaClient } from '@prisma/client';
import { AIService } from './ai.service';

const prisma = new PrismaClient();

export interface ProcessContext {
  process: {
    id: string;
    name: string;
    description: string | null;
    type: string;
    version: number;
    steps: any[];
    connections: any[];
    metadata: any;
  };
  subProcesses: ProcessContext[];
  painPoints: {
    userIdentified: any[];
    aiDetected: any[];
  };
  metrics: {
    totalSteps: number;
    totalConnections: number;
    totalDuration: number;
    bottleneckCount: number;
    manualTaskCount: number;
    systemIntegrationCount: number;
  };
  organization: {
    industry: string;
    size: string;
    regulations: string[];
  };
}

export interface DetectedPainPoint {
  category: string;
  severity: string;
  title: string;
  description: string;
  impact: string;
  estimatedCost: number | null;
  estimatedTime: number | null;
  frequency: string | null;
  processStepId?: string;
}

export interface ProcessRecommendation {
  category: string;
  priority: string;
  title: string;
  description: string;
  expectedBenefits: string[];
  implementation: {
    effort: string;
    timeline: string;
    steps: string[];
  };
  metrics: {
    timeSaving: number | null;
    costSaving: number | null;
    riskReduction: number | null;
  };
}

export interface GeneratedProcess {
  name: string;
  description: string;
  steps: any[];
  connections: any[];
  changesSummary: string;
  expectedImprovements: string[];
}

export interface AnalysisResult {
  understanding: any;
  painPoints: DetectedPainPoint[];
  recommendations: ProcessRecommendation[];
  toBeProcess: GeneratedProcess | null;
  timestamp: Date;
}

export class AIAnalysisService {
  constructor() {
    // AIService uses static methods, no need to instantiate
  }

  /**
   * Full process analysis pipeline
   */
  async analyzeProcess(
    processId: string,
    userId: string,
    analysisType: 'FULL' | 'PAIN_POINTS' | 'RECOMMENDATIONS' | 'TO_BE' = 'FULL'
  ): Promise<string> {
    console.log('📊 Creating analysis record...');

    // Create analysis record
    const analysis = await prisma.aIAnalysis.create({
      data: {
        processId,
        initiatedById: userId,
        analysisType,
        status: 'PENDING',
        aiProvider: 'UNKNOWN', // Will be updated when we know which provider is used
      },
    });

    console.log('✅ Analysis record created:', analysis.id);
    console.log('🚀 Starting background analysis...');

    // Start analysis in background (in production, use queue/job system)
    this.performAnalysis(analysis.id, processId, analysisType).catch(async (error) => {
      console.error('❌ Analysis failed:', error);
      console.error('Error stack:', error.stack);
      await prisma.aIAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });
    });

    return analysis.id;
  }

  /**
   * Perform the actual analysis
   */
  private async performAnalysis(
    analysisId: string,
    processId: string,
    analysisType: string
  ): Promise<void> {
    console.log(`📈 [${analysisId}] Updating status to IN_PROGRESS...`);

    // Update status to IN_PROGRESS
    await prisma.aIAnalysis.update({
      where: { id: analysisId },
      data: { status: 'IN_PROGRESS' },
    });

    console.log(`📈 [${analysisId}] Gathering process context...`);
    // 1. Gather complete context
    const context = await this.gatherProcessContext(processId);
    console.log(`📈 [${analysisId}] Context gathered: ${context.process.steps.length} steps`);

    console.log(`📈 [${analysisId}] Analyzing process understanding...`);
    // 2. Understand process
    const understanding = await this.analyzeProcessUnderstanding(context);
    console.log(`📈 [${analysisId}] Process understanding complete`);

    // 3. Detect pain points (if requested)
    let painPoints: DetectedPainPoint[] = [];
    if (analysisType === 'FULL' || analysisType === 'PAIN_POINTS') {
      console.log(`📈 [${analysisId}] Detecting pain points...`);
      painPoints = await this.detectPainPoints(context);
      console.log(`📈 [${analysisId}] Detected ${painPoints.length} pain points`);
    }

    // 4. Generate recommendations (if requested)
    let recommendations: ProcessRecommendation[] = [];
    if (analysisType === 'FULL' || analysisType === 'RECOMMENDATIONS') {
      console.log(`📈 [${analysisId}] Generating recommendations...`);
      recommendations = await this.generateRecommendations(context, painPoints);
      console.log(`📈 [${analysisId}] Generated ${recommendations.length} recommendations`);
    }

    // 5. Create TO-BE process (if requested)
    let toBeProcess: GeneratedProcess | null = null;
    if (analysisType === 'FULL' || analysisType === 'TO_BE') {
      console.log(`📈 [${analysisId}] Generating TO-BE process...`);
      toBeProcess = await this.generateToBeProcess(context, recommendations);
      console.log(`📈 [${analysisId}] TO-BE process ${toBeProcess ? 'generated' : 'skipped'}`);
    }

    // Save results
    console.log(`📈 [${analysisId}] Saving analysis results...`);
    await prisma.aIAnalysis.update({
      where: { id: analysisId },
      data: {
        status: 'COMPLETED',
        understanding,
        detectedPainPoints: painPoints,
        recommendations,
        generatedProcess: toBeProcess,
        completedAt: new Date(),
      },
    });
    console.log(`✅ [${analysisId}] Analysis completed successfully!`);

    // Save pain points to database
    if (painPoints.length > 0) {
      const process = await prisma.process.findUnique({
        where: { id: processId },
        select: { organizationId: true, createdById: true },
      });

      for (const painPoint of painPoints) {
        await prisma.painPoint.create({
          data: {
            processId,
            identifiedById: process!.createdById,
            category: painPoint.category,
            severity: painPoint.severity,
            title: painPoint.title,
            description: painPoint.description,
            impact: painPoint.impact,
            estimatedCost: painPoint.estimatedCost,
            estimatedTime: painPoint.estimatedTime,
            frequency: painPoint.frequency,
            isAiDetected: true,
            processStepId: painPoint.processStepId || null,
          },
        });
      }
    }

    // Save recommendations to database
    if (recommendations.length > 0) {
      for (const recommendation of recommendations) {
        await prisma.processRecommendation.create({
          data: {
            processId,
            analysisId,
            category: recommendation.category,
            priority: recommendation.priority,
            title: recommendation.title,
            description: recommendation.description,
            expectedBenefits: recommendation.expectedBenefits,
            implementation: recommendation.implementation,
            metrics: recommendation.metrics,
          },
        });
      }
    }
  }

  /**
   * Gather complete process context including sub-processes
   */
  async gatherProcessContext(processId: string): Promise<ProcessContext> {
    const process = await prisma.process.findUnique({
      where: { id: processId },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        connections: true,
        painPoints: {
          include: {
            processStep: true,
            identifiedBy: true,
          },
        },
        organization: true,
      },
    });

    if (!process) {
      throw new Error('Process not found');
    }

    // Recursively fetch sub-processes
    const subProcesses = await this.fetchSubProcesses(process.steps);

    // Calculate metrics
    const metrics = this.calculateProcessMetrics(process);

    return {
      process: {
        id: process.id,
        name: process.name,
        description: process.description,
        type: process.type,
        version: process.version,
        steps: process.steps,
        connections: process.connections,
        metadata: process.metadata,
      },
      subProcesses,
      painPoints: {
        userIdentified: process.painPoints.filter((p) => !p.isAiDetected),
        aiDetected: process.painPoints.filter((p) => p.isAiDetected),
      },
      metrics,
      organization: {
        industry: 'insurance', // Default, can be extended
        size: 'medium', // Default, can be extended
        regulations: [], // Default, can be extended
      },
    };
  }

  /**
   * Fetch sub-processes recursively
   */
  private async fetchSubProcesses(steps: any[]): Promise<ProcessContext[]> {
    const subProcesses: ProcessContext[] = [];

    // Look for steps that reference sub-processes (can be extended)
    // For now, return empty array
    return subProcesses;
  }

  /**
   * Calculate process metrics
   */
  private calculateProcessMetrics(process: any): ProcessContext['metrics'] {
    const totalSteps = process.steps.length;
    const totalConnections = process.connections.length;

    // Calculate total duration
    const totalDuration = process.steps.reduce(
      (sum: number, step: any) => sum + (step.duration || 0),
      0
    );

    // Count bottlenecks (steps with duration > average * 2)
    const avgDuration = totalDuration / totalSteps || 0;
    const bottleneckCount = process.steps.filter(
      (step: any) => (step.duration || 0) > avgDuration * 2
    ).length;

    // Count manual tasks
    const manualTaskCount = process.steps.filter(
      (step: any) => step.type === 'TASK' && !step.requiredSystems?.length
    ).length;

    // Count system integrations
    const systemIntegrationCount = new Set(
      process.steps.flatMap((step: any) => step.requiredSystems || [])
    ).size;

    return {
      totalSteps,
      totalConnections,
      totalDuration,
      bottleneckCount,
      manualTaskCount,
      systemIntegrationCount,
    };
  }

  /**
   * Analyze process understanding
   */
  private async analyzeProcessUnderstanding(context: ProcessContext): Promise<any> {
    const prompt = this.buildProcessUnderstandingPrompt(context);

    const process = await prisma.process.findUnique({
      where: { id: context.process.id },
      select: { organizationId: true },
    });

    const response = await AIService.callAI(process!.organizationId, prompt);

    // Parse and return understanding
    try {
      return JSON.parse(response);
    } catch {
      return { summary: response };
    }
  }

  /**
   * Build process understanding prompt
   */
  private buildProcessUnderstandingPrompt(context: ProcessContext): string {
    const stepsDescription = context.process.steps
      .map(
        (step: any, idx: number) =>
          `${idx + 1}. ${step.name} (${step.type}) - ${step.description || 'No description'}\n` +
          `   Duration: ${step.duration || 'N/A'} min | Role: ${step.responsibleRole || 'N/A'} | Department: ${step.department || 'N/A'}\n` +
          `   Systems: ${step.requiredSystems?.join(', ') || 'None'}`
      )
      .join('\n\n');

    const painPointsDescription =
      context.painPoints.userIdentified.length > 0
        ? context.painPoints.userIdentified
            .map(
              (pp: any) =>
                `- ${pp.title} (${pp.severity}): ${pp.description}\n  Impact: ${pp.impact || 'N/A'}`
            )
            .join('\n')
        : 'None identified yet';

    return `Analyze this business process and provide a comprehensive understanding:

Process: ${context.process.name}
Description: ${context.process.description || 'No description provided'}
Type: ${context.process.type}
Industry: ${context.organization.industry}

PROCESS STEPS (${context.metrics.totalSteps} total):
${stepsDescription}

CURRENT PAIN POINTS:
${painPointsDescription}

PROCESS METRICS:
- Total Steps: ${context.metrics.totalSteps}
- Total Duration: ${context.metrics.totalDuration} minutes
- Bottlenecks: ${context.metrics.bottleneckCount}
- Manual Tasks: ${context.metrics.manualTaskCount}
- System Integrations: ${context.metrics.systemIntegrationCount}

Please analyze and provide:
1. Process purpose and business value
2. Critical path and key dependencies
3. Key stakeholders and roles involved
4. Process complexity assessment
5. Current state summary with strengths and weaknesses

Return your analysis as a JSON object with these fields:
{
  "purpose": "string",
  "businessValue": "string",
  "criticalPath": ["step1", "step2", ...],
  "stakeholders": ["role1", "role2", ...],
  "complexity": "LOW|MEDIUM|HIGH",
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...]
}`;
  }

  /**
   * Detect pain points using AI
   */
  private async detectPainPoints(context: ProcessContext): Promise<DetectedPainPoint[]> {
    const prompt = this.buildPainPointDetectionPrompt(context);

    const process = await prisma.process.findUnique({
      where: { id: context.process.id },
      select: { organizationId: true },
    });

    const response = await AIService.callAI(process!.organizationId, prompt);

    // Parse and validate AI response
    const detectedPainPoints = this.parsePainPoints(response);

    // Filter out duplicates of existing pain points
    const newPainPoints = this.filterDuplicatePainPoints(
      detectedPainPoints,
      context.painPoints.userIdentified
    );

    return newPainPoints;
  }

  /**
   * Build pain point detection prompt
   */
  private buildPainPointDetectionPrompt(context: ProcessContext): string {
    const stepsDescription = context.process.steps
      .map(
        (step: any, idx: number) =>
          `${idx + 1}. ${step.name} (${step.type})\n` +
          `   Duration: ${step.duration || 'N/A'} min | Systems: ${step.requiredSystems?.join(', ') || 'None'}`
      )
      .join('\n');

    const existingPainPoints =
      context.painPoints.userIdentified.length > 0
        ? context.painPoints.userIdentified.map((pp: any) => `- ${pp.title}`).join('\n')
        : 'None identified yet';

    return `Identify ALL pain points in this process, including ones not yet documented:

Process: ${context.process.name}
Steps: ${context.metrics.totalSteps}
Total Duration: ${context.metrics.totalDuration} minutes

PROCESS STEPS:
${stepsDescription}

EXISTING PAIN POINTS:
${existingPainPoints}

For each area, identify specific pain points:
1. BOTTLENECKS - Where does the process slow down? (long durations, sequential dependencies that could be parallel)
2. REWORK - Where do errors occur requiring rework? (decision points, quality checks)
3. WASTE - What activities add no value? (redundant steps, unnecessary approvals)
4. MANUAL WORK - What could be automated? (manual data entry, calculations, copy-paste)
5. COMPLIANCE - What regulatory risks exist? (missing audit trails, inadequate approvals)
6. SYSTEMS - What integration gaps exist? (manual handoffs between systems, data silos)
7. COMMUNICATION - Where do handoffs fail? (unclear responsibilities, missing notifications)

For each pain point provide:
- category: BOTTLENECK | REWORK | WASTE | MANUAL_PROCESS | COMPLIANCE_RISK | SYSTEM_LIMITATION | COMMUNICATION_GAP
- severity: LOW | MEDIUM | HIGH | CRITICAL
- title: Brief descriptive title
- description: Detailed description
- impact: Business impact description
- estimatedCost: Annual cost (number, or null)
- estimatedTime: Time wasted per occurrence in minutes (number, or null)
- frequency: DAILY | WEEKLY | MONTHLY | QUARTERLY | ANNUALLY | null
- processStepId: ID of the affected step (if applicable, use step ID from above)

Return as JSON array of pain points. Only include NEW pain points not already in the existing list.
Example: [{"category": "BOTTLENECK", "severity": "HIGH", "title": "...", ...}]`;
  }

  /**
   * Parse pain points from AI response
   */
  private parsePainPoints(response: string): DetectedPainPoint[] {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // If not JSON, try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    }
  }

  /**
   * Filter out duplicate pain points
   */
  private filterDuplicatePainPoints(
    detected: DetectedPainPoint[],
    existing: any[]
  ): DetectedPainPoint[] {
    return detected.filter((newPP) => {
      // Check if similar pain point already exists
      const isDuplicate = existing.some((existingPP) => {
        const titleSimilarity = this.calculateSimilarity(
          newPP.title.toLowerCase(),
          existingPP.title.toLowerCase()
        );
        return titleSimilarity > 0.7; // 70% similarity threshold
      });
      return !isDuplicate;
    });
  }

  /**
   * Calculate similarity between two strings (simple Jaccard similarity)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Generate improvement recommendations
   */
  private async generateRecommendations(
    context: ProcessContext,
    painPoints: DetectedPainPoint[]
  ): Promise<ProcessRecommendation[]> {
    const prompt = this.buildRecommendationsPrompt(context, painPoints);

    const process = await prisma.process.findUnique({
      where: { id: context.process.id },
      select: { organizationId: true },
    });

    const response = await AIService.callAI(process!.organizationId, prompt);

    const recommendations = this.parseRecommendations(response);

    // Prioritize and categorize
    return this.prioritizeRecommendations(recommendations);
  }

  /**
   * Build recommendations prompt
   */
  private buildRecommendationsPrompt(
    context: ProcessContext,
    painPoints: DetectedPainPoint[]
  ): string {
    const painPointsDescription =
      painPoints.length > 0
        ? painPoints
            .map((pp) => `- ${pp.title} (${pp.severity}): ${pp.description}`)
            .join('\n')
        : 'No specific pain points detected';

    const stepsDescription = context.process.steps
      .map((step: any) => `${step.order}. ${step.name} (${step.type})`)
      .join('\n');

    return `Based on this process analysis and pain points, provide improvement recommendations:

Process: ${context.process.name}
Type: ${context.process.type}

PAIN POINTS:
${painPointsDescription}

PROCESS FLOW:
${stepsDescription}

PROCESS METRICS:
- Total Duration: ${context.metrics.totalDuration} minutes
- Manual Tasks: ${context.metrics.manualTaskCount}
- Bottlenecks: ${context.metrics.bottleneckCount}

Recommend improvements in these categories:
1. QUICK_WIN - Low effort, high impact improvements (can be done quickly)
2. STRATEGIC - High-value transformational changes (requires planning)
3. AUTOMATION - Tasks suitable for automation (RPA, API integration)
4. INTEGRATION - System integration opportunities (reduce manual handoffs)
5. REDESIGN - Process flow optimizations (reorder, parallelize)

For each recommendation provide:
- category: QUICK_WIN | STRATEGIC | AUTOMATION | INTEGRATION | REDESIGN
- priority: HIGH | MEDIUM | LOW
- title: Brief descriptive title
- description: Detailed description
- expectedBenefits: Array of benefit descriptions
- implementation: {
    effort: "LOW" | "MEDIUM" | "HIGH",
    timeline: "Days" | "Weeks" | "Months",
    steps: ["step1", "step2", ...]
  }
- metrics: {
    timeSaving: percentage (0-100) or null,
    costSaving: annual amount or null,
    riskReduction: percentage (0-100) or null
  }

Return as JSON array of recommendations.
Example: [{"category": "QUICK_WIN", "priority": "HIGH", "title": "...", ...}]`;
  }

  /**
   * Parse recommendations from AI response
   */
  private parseRecommendations(response: string): ProcessRecommendation[] {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    }
  }

  /**
   * Prioritize recommendations
   */
  private prioritizeRecommendations(
    recommendations: ProcessRecommendation[]
  ): ProcessRecommendation[] {
    // Sort by priority: HIGH > MEDIUM > LOW
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return recommendations.sort(
      (a, b) =>
        (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) -
        (priorityOrder[b.priority as keyof typeof priorityOrder] || 0)
    );
  }

  /**
   * Generate TO-BE process
   */
  private async generateToBeProcess(
    context: ProcessContext,
    recommendations: ProcessRecommendation[]
  ): Promise<GeneratedProcess | null> {
    // Only generate TO-BE for AS-IS processes
    if (context.process.type === 'TO_BE') {
      return null;
    }

    // Filter to high-priority recommendations
    const approvedRecs = recommendations.filter((r) => r.priority === 'HIGH');

    if (approvedRecs.length === 0) {
      return null;
    }

    const prompt = this.buildToBeProcessPrompt(context, approvedRecs);

    const process = await prisma.process.findUnique({
      where: { id: context.process.id },
      select: { organizationId: true },
    });

    const response = await AIService.callAI(process!.organizationId, prompt);

    return this.parseGeneratedProcess(response, context);
  }

  /**
   * Build TO-BE process generation prompt
   */
  private buildToBeProcessPrompt(
    context: ProcessContext,
    recommendations: ProcessRecommendation[]
  ): string {
    const stepsDescription = context.process.steps
      .map(
        (step: any) =>
          `${step.order}. ${step.name} (${step.type})\n` +
          `   Duration: ${step.duration || 'N/A'} min | Role: ${step.responsibleRole || 'N/A'}`
      )
      .join('\n');

    const recsDescription = recommendations
      .map((rec) => `- ${rec.title}: ${rec.description}`)
      .join('\n');

    return `Generate an optimized TO-BE process based on these inputs:

AS-IS PROCESS: ${context.process.name}
${stepsDescription}

HIGH-PRIORITY RECOMMENDATIONS TO IMPLEMENT:
${recsDescription}

Generate a TO-BE process that:
1. Addresses all high-priority recommendations
2. Maintains business logic and compliance requirements
3. Optimizes for efficiency and quality
4. Reduces manual work and bottlenecks

Provide:
- name: Optimized process name
- description: What changed and why
- steps: Array of process steps (similar structure to AS-IS)
- connections: Array of connections between steps
- changesSummary: Brief summary of key changes
- expectedImprovements: Array of expected improvement descriptions

Return as JSON object.`;
  }

  /**
   * Parse generated TO-BE process
   */
  private parseGeneratedProcess(
    response: string,
    context: ProcessContext
  ): GeneratedProcess | null {
    try {
      const parsed = JSON.parse(response);
      return parsed;
    } catch {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          return parsed;
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  /**
   * Get analysis results
   */
  async getAnalysis(analysisId: string): Promise<any> {
    return await prisma.aIAnalysis.findUnique({
      where: { id: analysisId },
      include: {
        process: {
          select: {
            name: true,
            type: true,
          },
        },
        initiatedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        processRecommendations: {
          orderBy: {
            priority: 'desc',
          },
        },
      },
    });
  }

  /**
   * Get all analyses for a process
   */
  async getProcessAnalyses(processId: string): Promise<any[]> {
    return await prisma.aIAnalysis.findMany({
      where: { processId },
      include: {
        initiatedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
