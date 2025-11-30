import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { z } from 'zod';
import { ProviderValidatorService } from '../services/provider-validator.service';

// Validation schema for API configuration
const apiConfigSchema = z.object({
  provider: z.enum(['ANTHROPIC', 'GOOGLE_GEMINI', 'OPENAI', 'AZURE_OPENAI']),
  apiKey: z.string().min(1, 'API key is required'),
  modelId: z.string().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  config: z.record(z.any()).optional(),
});

/**
 * Helper function to mask API key for display
 */
const maskApiKey = (apiKey: string): string => {
  if (!apiKey || apiKey.length < 8) return '***';
  const start = apiKey.substring(0, 7);
  const end = apiKey.substring(apiKey.length - 4);
  return `${start}...${end}`;
};

/**
 * Get all API configurations for the organization
 */
export const getAPIConfigurations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const configurations = await prisma.aPIConfiguration.findMany({
      where: {
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        provider: true,
        modelId: true,
        isActive: true,
        isDefault: true,
        config: true,
        createdAt: true,
        updatedAt: true,
        apiKey: true, // Include for masking
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Mask API keys before sending to client
    const maskedConfigurations = configurations.map((config) => ({
      ...config,
      apiKey: maskApiKey(config.apiKey),
      maskedApiKey: maskApiKey(config.apiKey),
    }));

    res.json({
      success: true,
      configurations: maskedConfigurations,
    });
  } catch (error) {
    console.error('Get API configurations error:', error);
    res.status(500).json({ error: 'Failed to retrieve API configurations' });
  }
};

/**
 * Create a new API configuration
 */
export const createAPIConfiguration = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const data = apiConfigSchema.parse(req.body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only admins can manage API configurations
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can manage API configurations' });
    }

    // Check if configuration already exists for this provider
    const existing = await prisma.aPIConfiguration.findUnique({
      where: {
        organizationId_provider: {
          organizationId: user.organizationId,
          provider: data.provider,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        error: 'Configuration already exists for this provider',
        message: 'Please update the existing configuration instead',
      });
    }

    // If this is set as default, unset all other defaults
    if (data.isDefault) {
      await prisma.aPIConfiguration.updateMany({
        where: {
          organizationId: user.organizationId,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const configuration = await prisma.aPIConfiguration.create({
      data: {
        organizationId: user.organizationId,
        provider: data.provider,
        apiKey: data.apiKey,
        modelId: data.modelId,
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? false,
        config: data.config,
      },
      select: {
        id: true,
        provider: true,
        modelId: true,
        isActive: true,
        isDefault: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({
      success: true,
      configuration,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    console.error('Create API configuration error:', error);
    res.status(500).json({ error: 'Failed to create API configuration' });
  }
};

/**
 * Update an existing API configuration
 */
export const updateAPIConfiguration = async (req: Request, res: Response) => {
  try {
    const { configId } = req.params;
    const userId = (req as any).user.userId;

    const updateData = apiConfigSchema.partial().parse(req.body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only admins can manage API configurations
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can manage API configurations' });
    }

    // Verify configuration belongs to user's organization
    const existing = await prisma.aPIConfiguration.findFirst({
      where: {
        id: configId,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'API configuration not found' });
    }

    // If setting as default, unset all other defaults
    if (updateData.isDefault) {
      await prisma.aPIConfiguration.updateMany({
        where: {
          organizationId: user.organizationId,
          id: { not: configId },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const configuration = await prisma.aPIConfiguration.update({
      where: { id: configId },
      data: updateData,
      select: {
        id: true,
        provider: true,
        modelId: true,
        isActive: true,
        isDefault: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      configuration,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    console.error('Update API configuration error:', error);
    res.status(500).json({ error: 'Failed to update API configuration' });
  }
};

/**
 * Delete an API configuration
 */
export const deleteAPIConfiguration = async (req: Request, res: Response) => {
  try {
    const { configId } = req.params;
    const userId = (req as any).user.userId;

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only admins can manage API configurations
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can manage API configurations' });
    }

    // Verify configuration belongs to user's organization
    const existing = await prisma.aPIConfiguration.findFirst({
      where: {
        id: configId,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'API configuration not found' });
    }

    await prisma.aPIConfiguration.delete({
      where: { id: configId },
    });

    res.json({
      success: true,
      message: 'API configuration deleted successfully',
    });
  } catch (error) {
    console.error('Delete API configuration error:', error);
    res.status(500).json({ error: 'Failed to delete API configuration' });
  }
};

/**
 * Set a configuration as default
 */
export const setDefaultConfiguration = async (req: Request, res: Response) => {
  try {
    const { configId } = req.params;
    const userId = (req as any).user.userId;

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only admins can manage API configurations
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can manage API configurations' });
    }

    // Verify configuration belongs to user's organization
    const existing = await prisma.aPIConfiguration.findFirst({
      where: {
        id: configId,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'API configuration not found' });
    }

    // Unset all defaults
    await prisma.aPIConfiguration.updateMany({
      where: {
        organizationId: user.organizationId,
      },
      data: {
        isDefault: false,
      },
    });

    // Set this as default
    const configuration = await prisma.aPIConfiguration.update({
      where: { id: configId },
      data: { isDefault: true },
      select: {
        id: true,
        provider: true,
        modelId: true,
        isActive: true,
        isDefault: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      configuration,
    });
  } catch (error) {
    console.error('Set default configuration error:', error);
    res.status(500).json({ error: 'Failed to set default configuration' });
  }
};

/**
 * Get available models for a provider (static list - fallback)
 */
export const getAvailableModels = async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;

    const models: Record<string, Array<{ id: string; name: string; description: string }>> = {
      ANTHROPIC: [
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
      GOOGLE_GEMINI: [
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
      OPENAI: [
        {
          id: 'gpt-4-turbo',
          name: 'GPT-4 Turbo',
          description: 'Most capable GPT-4 model',
        },
        {
          id: 'gpt-4',
          name: 'GPT-4',
          description: 'Original GPT-4 model',
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          description: 'Fast and cost-effective',
        },
      ],
      AZURE_OPENAI: [
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

    const providerModels = models[provider.toUpperCase()] || [];

    res.json({
      success: true,
      provider,
      models: providerModels,
    });
  } catch (error) {
    console.error('Get available models error:', error);
    res.status(500).json({ error: 'Failed to retrieve available models' });
  }
};

/**
 * Validate API key and fetch available models dynamically
 */
export const validateAndFetchModels = async (req: Request, res: Response) => {
  try {
    const { provider, apiKey, config } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({
        error: 'Provider and API key are required',
      });
    }

    const result = await ProviderValidatorService.validateAndFetchModels(
      provider,
      apiKey,
      config
    );

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      valid: true,
      provider,
      models: result.models || [],
    });
  } catch (error) {
    console.error('Validate and fetch models error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate API key and fetch models',
    });
  }
};

/**
 * Fetch models for an existing configuration using its stored API key
 */
export const fetchModelsForConfiguration = async (req: Request, res: Response) => {
  try {
    const { configId } = req.params;
    const userId = (req as any).user.userId;

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the configuration with the actual API key
    const config = await prisma.aPIConfiguration.findFirst({
      where: {
        id: configId,
        organizationId: user.organizationId,
      },
    });

    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    // Fetch models using the stored API key
    const result = await ProviderValidatorService.validateAndFetchModels(
      config.provider,
      config.apiKey,
      config.config
    );

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to fetch models with current API key',
      });
    }

    res.json({
      success: true,
      valid: true,
      provider: config.provider,
      models: result.models || [],
    });
  } catch (error) {
    console.error('Fetch models for configuration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch models',
    });
  }
};

/**
 * Update user password
 */
export const updatePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters long',
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Import bcrypt dynamically
    const bcrypt = await import('bcrypt');

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        error: 'Current password is incorrect',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      error: 'Failed to update password',
    });
  }
};
