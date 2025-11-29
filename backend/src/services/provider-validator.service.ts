import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  models?: ModelInfo[];
}

export class ProviderValidatorService {
  /**
   * Validate API key and fetch available models for a provider
   */
  static async validateAndFetchModels(
    provider: string,
    apiKey: string,
    config?: any
  ): Promise<ValidationResult> {
    try {
      switch (provider.toUpperCase()) {
        case 'ANTHROPIC':
          return await this.validateAnthropic(apiKey);
        case 'GOOGLE_GEMINI':
          return await this.validateGemini(apiKey);
        case 'OPENAI':
          return await this.validateOpenAI(apiKey);
        case 'AZURE_OPENAI':
          return await this.validateAzureOpenAI(apiKey, config);
        default:
          return {
            valid: false,
            error: `Unsupported provider: ${provider}`,
          };
      }
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Failed to validate API key',
      };
    }
  }

  /**
   * Validate Anthropic API key
   * Note: Anthropic doesn't have a models list endpoint, so we test with a minimal request
   */
  private static async validateAnthropic(apiKey: string): Promise<ValidationResult> {
    try {
      const anthropic = new Anthropic({ apiKey });

      // Test the API key with a minimal request
      await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022', // Use cheapest model for validation
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });

      // Return static list of known Anthropic models
      return {
        valid: true,
        models: [
          {
            id: 'claude-3-5-sonnet-20241022',
            name: 'Claude 3.5 Sonnet',
            description: 'Most intelligent model, best for complex analysis',
          },
          {
            id: 'claude-3-5-haiku-20241022',
            name: 'Claude 3.5 Haiku',
            description: 'Fastest model, good for simple tasks',
          },
          {
            id: 'claude-3-opus-20240229',
            name: 'Claude 3 Opus',
            description: 'Previous generation, powerful but slower',
          },
        ],
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Invalid Anthropic API key',
      };
    }
  }

  /**
   * Validate Google Gemini API key and fetch available models
   */
  private static async validateGemini(apiKey: string): Promise<ValidationResult> {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);

      // Fetch list of available models
      const modelsResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );

      if (!modelsResponse.ok) {
        throw new Error('Invalid Google Gemini API key');
      }

      const data = await modelsResponse.json();
      const models: ModelInfo[] = data.models
        ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => ({
          id: m.name.replace('models/', ''),
          name: m.displayName || m.name,
          description: m.description || '',
        })) || [];

      // If no models found, return static list
      if (models.length === 0) {
        return {
          valid: true,
          models: [
            {
              id: 'gemini-2.0-flash-exp',
              name: 'Gemini 2.0 Flash (Experimental)',
              description: 'Latest experimental model with multimodal capabilities',
            },
            {
              id: 'gemini-1.5-pro',
              name: 'Gemini 1.5 Pro',
              description: 'Advanced reasoning and long context window',
            },
            {
              id: 'gemini-1.5-flash',
              name: 'Gemini 1.5 Flash',
              description: 'Fast and efficient for everyday tasks',
            },
          ],
        };
      }

      return {
        valid: true,
        models,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Invalid Google Gemini API key',
      };
    }
  }

  /**
   * Validate OpenAI API key and fetch available models
   */
  private static async validateOpenAI(apiKey: string): Promise<ValidationResult> {
    try {
      const openai = new OpenAI({ apiKey });

      // Fetch list of available models
      const modelsList = await openai.models.list();
      const models: ModelInfo[] = modelsList.data
        .filter((m) => m.id.includes('gpt'))
        .map((m) => ({
          id: m.id,
          name: this.formatOpenAIModelName(m.id),
          description: this.getOpenAIModelDescription(m.id),
        }))
        .sort((a, b) => {
          // Sort by priority: GPT-4 > GPT-3.5
          if (a.id.includes('gpt-4') && !b.id.includes('gpt-4')) return -1;
          if (!a.id.includes('gpt-4') && b.id.includes('gpt-4')) return 1;
          return a.id.localeCompare(b.id);
        });

      return {
        valid: true,
        models,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Invalid OpenAI API key',
      };
    }
  }

  /**
   * Validate Azure OpenAI API key
   */
  private static async validateAzureOpenAI(
    apiKey: string,
    config?: any
  ): Promise<ValidationResult> {
    try {
      // Azure OpenAI requires endpoint and deployment info
      if (!config?.endpoint) {
        return {
          valid: false,
          error: 'Azure OpenAI requires an endpoint URL in the config field',
        };
      }

      // Test the API key with a request to the deployments endpoint
      const response = await fetch(
        `${config.endpoint}/openai/deployments?api-version=2023-05-15`,
        {
          headers: {
            'api-key': apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Invalid Azure OpenAI API key or endpoint');
      }

      const data = await response.json();
      const models: ModelInfo[] = data.data?.map((d: any) => ({
        id: d.id,
        name: d.model || d.id,
        description: `Deployment: ${d.id}`,
      })) || [];

      return {
        valid: true,
        models: models.length > 0 ? models : [
          {
            id: 'gpt-4',
            name: 'GPT-4 (Azure)',
            description: 'GPT-4 via Azure OpenAI Service',
          },
          {
            id: 'gpt-35-turbo',
            name: 'GPT-3.5 Turbo (Azure)',
            description: 'GPT-3.5 via Azure OpenAI Service',
          },
        ],
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Invalid Azure OpenAI configuration',
      };
    }
  }

  /**
   * Helper: Format OpenAI model name for display
   */
  private static formatOpenAIModelName(modelId: string): string {
    if (modelId.includes('gpt-4-turbo')) return 'GPT-4 Turbo';
    if (modelId.includes('gpt-4')) return 'GPT-4';
    if (modelId.includes('gpt-3.5-turbo')) return 'GPT-3.5 Turbo';
    return modelId;
  }

  /**
   * Helper: Get OpenAI model description
   */
  private static getOpenAIModelDescription(modelId: string): string {
    if (modelId.includes('gpt-4-turbo')) return 'Most capable GPT-4 model';
    if (modelId.includes('gpt-4')) return 'Advanced reasoning and analysis';
    if (modelId.includes('gpt-3.5-turbo')) return 'Fast and cost-effective';
    return '';
  }
}
