import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { prisma } from './prisma';

export interface PainPointAnalysisResult {
  detectedPainPoints: {
    stepId: string;
    stepName: string;
    category: string;
    severity: string;
    title: string;
    description: string;
    estimatedImpact: string;
    recommendations: string[];
  }[];
  overallAssessment: string;
  prioritizedActions: string[];
}

export interface OptimizationRecommendation {
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
    estimatedTimeSaving?: string;
    estimatedCostSaving?: string;
    riskReduction?: string;
  };
}

interface AIProviderConfig {
  provider: string;
  apiKey: string;
  modelId?: string;
  config?: any;
}

export class AIService {
  /**
   * Get the default AI configuration for an organization
   */
  private static async getAIConfig(organizationId: string): Promise<AIProviderConfig> {
    const config = await prisma.aPIConfiguration.findFirst({
      where: {
        organizationId,
        isActive: true,
        isDefault: true,
      },
    });

    if (!config) {
      // Fallback to environment variable if no config exists
      if (process.env.ANTHROPIC_API_KEY) {
        return {
          provider: 'ANTHROPIC',
          apiKey: process.env.ANTHROPIC_API_KEY,
          modelId: 'claude-3-5-sonnet-20241022',
        };
      }
      throw new Error('No AI configuration found. Please configure an AI provider in Settings.');
    }

    return {
      provider: config.provider,
      apiKey: config.apiKey,
      modelId: config.modelId || undefined,
      config: config.config,
    };
  }

  /**
   * Call AI provider with a prompt and get JSON response
   */
  private static async callAI(
    organizationId: string,
    prompt: string
  ): Promise<any> {
    const config = await this.getAIConfig(organizationId);

    switch (config.provider) {
      case 'ANTHROPIC':
        return this.callAnthropic(config, prompt);
      case 'GOOGLE_GEMINI':
        return this.callGemini(config, prompt);
      case 'OPENAI':
        return this.callOpenAI(config, prompt);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  /**
   * Call Anthropic Claude API
   */
  private static async callAnthropic(
    config: AIProviderConfig,
    prompt: string
  ): Promise<any> {
    const anthropic = new Anthropic({
      apiKey: config.apiKey,
    });

    const message = await anthropic.messages.create({
      model: config.modelId || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    throw new Error('Failed to parse Anthropic response');
  }

  /**
   * Call Google Gemini API
   */
  private static async callGemini(
    config: AIProviderConfig,
    prompt: string
  ): Promise<any> {
    const genAI = new GoogleGenerativeAI(config.apiKey);
    const model = genAI.getGenerativeModel({
      model: config.modelId || 'gemini-1.5-pro',
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Failed to parse Gemini response');
  }

  /**
   * Call OpenAI API
   */
  private static async callOpenAI(
    config: AIProviderConfig,
    prompt: string
  ): Promise<any> {
    const openai = new OpenAI({
      apiKey: config.apiKey,
    });

    const completion = await openai.chat.completions.create({
      model: config.modelId || 'gpt-4-turbo',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content);
    }

    throw new Error('Failed to parse OpenAI response');
  }

  /**
   * Analyze a process and detect potential pain points using AI
   */
  static async analyzePainPoints(
    organizationId: string,
    process: {
      name: string;
      description?: string;
      steps: Array<{
        id: string;
        name: string;
        description?: string;
        duration?: number;
        type: string;
        responsibleRole?: string;
        requiredSystems?: string[];
      }>;
      existingPainPoints?: Array<{
        category: string;
        severity: string;
        title: string;
        description: string;
      }>;
    }
  ): Promise<PainPointAnalysisResult> {
    const prompt = `You are an expert business process analyst specializing in insurance operations. Analyze the following process and identify potential pain points, inefficiencies, and optimization opportunities.

Process Name: ${process.name}
Description: ${process.description || 'N/A'}

Process Steps:
${process.steps
  .map(
    (step, idx) => `
${idx + 1}. ${step.name} (${step.type})
   - Description: ${step.description || 'N/A'}
   - Duration: ${step.duration ? `${step.duration} minutes` : 'Not specified'}
   - Responsible: ${step.responsibleRole || 'Not specified'}
   - Systems: ${step.requiredSystems?.join(', ') || 'None specified'}
`
  )
  .join('\n')}

${
  process.existingPainPoints && process.existingPainPoints.length > 0
    ? `
Existing Pain Points Already Identified:
${process.existingPainPoints
  .map(
    (pp, idx) => `
${idx + 1}. ${pp.title} (${pp.severity})
   Category: ${pp.category}
   Description: ${pp.description}
`
  )
  .join('\n')}`
    : ''
}

Please analyze this process and:
1. Identify potential pain points not yet documented
2. Categorize them (BOTTLENECK, REWORK, WASTE, MANUAL_PROCESS, COMPLIANCE_RISK, SYSTEM_LIMITATION, COMMUNICATION_GAP)
3. Assign severity levels (LOW, MEDIUM, HIGH, CRITICAL)
4. Provide specific recommendations for each pain point
5. Give an overall process assessment
6. Suggest prioritized actions

Return your analysis in the following JSON format:
{
  "detectedPainPoints": [
    {
      "stepId": "step id or empty string if process-wide",
      "stepName": "step name",
      "category": "category",
      "severity": "severity level",
      "title": "brief title",
      "description": "detailed description",
      "estimatedImpact": "description of business impact",
      "recommendations": ["recommendation 1", "recommendation 2"]
    }
  ],
  "overallAssessment": "overall process health assessment",
  "prioritizedActions": ["action 1", "action 2", "action 3"]
}`;

    try {
      return await this.callAI(organizationId, prompt);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error('Failed to analyze process with AI');
    }
  }

  /**
   * Generate optimization recommendations for a process
   */
  static async generateRecommendations(
    organizationId: string,
    process: {
      name: string;
      description?: string;
      category?: string;
    },
    painPoints: Array<{
      category: string;
      severity: string;
      title: string;
      description: string;
      impact?: string;
    }>
  ): Promise<OptimizationRecommendation[]> {
    const prompt = `You are an expert business process optimization consultant specializing in insurance operations. Based on the process details and identified pain points, generate comprehensive optimization recommendations.

Process Name: ${process.name}
Description: ${process.description || 'N/A'}
Category: ${process.category || 'General'}

Identified Pain Points:
${painPoints
  .map(
    (pp, idx) => `
${idx + 1}. ${pp.title} (${pp.severity} - ${pp.category})
   Description: ${pp.description}
   Impact: ${pp.impact || 'Not specified'}
`
  )
  .join('\n')}

Please generate 3-5 optimization recommendations that:
1. Address the most critical pain points
2. Provide specific, actionable improvements
3. Consider both quick wins and strategic changes
4. Include implementation guidance
5. Estimate benefits and effort

Categories for recommendations:
- AUTOMATION - Automate manual processes
- INTEGRATION - Improve system integration
- WORKFLOW_REDESIGN - Redesign process flow
- TRAINING - Improve training and documentation
- TECHNOLOGY - Implement new technology
- POLICY - Update policies and procedures
- RESOURCE - Optimize resource allocation

Return your recommendations in the following JSON format:
{
  "recommendations": [
    {
      "category": "category",
      "priority": "HIGH/MEDIUM/LOW",
      "title": "recommendation title",
      "description": "detailed description",
      "expectedBenefits": ["benefit 1", "benefit 2"],
      "implementation": {
        "effort": "LOW/MEDIUM/HIGH",
        "timeline": "estimated timeline (e.g., '2-4 weeks')",
        "steps": ["step 1", "step 2", "step 3"]
      },
      "metrics": {
        "estimatedTimeSaving": "e.g., '30% reduction in processing time'",
        "estimatedCostSaving": "e.g., '$50,000 annually'",
        "riskReduction": "e.g., '40% reduction in errors'"
      }
    }
  ]
}`;

    try {
      const result = await this.callAI(organizationId, prompt);
      return result.recommendations || [];
    } catch (error) {
      console.error('AI Recommendation Error:', error);
      throw new Error('Failed to generate recommendations with AI');
    }
  }

  /**
   * Generate a target (TO_BE) process based on recommendations
   */
  static async generateTargetProcess(
    organizationId: string,
    sourceProcess: {
      name: string;
      description?: string;
      steps: Array<{
        name: string;
        description?: string;
        type: string;
        duration?: number;
      }>;
    },
    recommendations: Array<{
      title: string;
      description: string;
      category: string;
    }>
  ): Promise<{
    name: string;
    description: string;
    steps: Array<{
      name: string;
      description: string;
      type: string;
      duration?: number;
      improvements: string[];
    }>;
    summary: string;
    expectedImprovements: string[];
  }> {
    const prompt = `You are an expert business process designer. Based on the current (AS-IS) process and optimization recommendations, design an improved target (TO-BE) process.

Current Process: ${sourceProcess.name}
Description: ${sourceProcess.description || 'N/A'}

Current Steps:
${sourceProcess.steps
  .map(
    (step, idx) => `
${idx + 1}. ${step.name} (${step.type})
   ${step.description || ''}
   Duration: ${step.duration ? `${step.duration} min` : 'N/A'}
`
  )
  .join('\n')}

Optimization Recommendations:
${recommendations
  .map(
    (rec, idx) => `
${idx + 1}. ${rec.title} (${rec.category})
   ${rec.description}
`
  )
  .join('\n')}

Design an optimized TO-BE process that:
1. Incorporates the recommendations
2. Streamlines the workflow
3. Reduces manual work and bottlenecks
4. Improves efficiency and quality
5. Maintains or improves compliance

Return the process design in JSON format:
{
  "name": "optimized process name",
  "description": "description of the improved process",
  "steps": [
    {
      "name": "step name",
      "description": "step description",
      "type": "START/TASK/DECISION/END",
      "duration": estimated_duration_in_minutes,
      "improvements": ["improvement 1", "improvement 2"]
    }
  ],
  "summary": "summary of key changes",
  "expectedImprovements": ["improvement 1", "improvement 2"]
}`;

    try {
      return await this.callAI(organizationId, prompt);
    } catch (error) {
      console.error('AI Target Process Generation Error:', error);
      throw new Error('Failed to generate target process with AI');
    }
  }
}
