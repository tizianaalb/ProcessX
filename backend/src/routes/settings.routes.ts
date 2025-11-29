import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as settingsController from '../controllers/settings.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/settings/api-configurations - Get all API configurations
router.get(
  '/api-configurations',
  settingsController.getAPIConfigurations
);

// POST /api/settings/api-configurations - Create new API configuration
router.post(
  '/api-configurations',
  settingsController.createAPIConfiguration
);

// PATCH /api/settings/api-configurations/:configId - Update API configuration
router.patch(
  '/api-configurations/:configId',
  settingsController.updateAPIConfiguration
);

// DELETE /api/settings/api-configurations/:configId - Delete API configuration
router.delete(
  '/api-configurations/:configId',
  settingsController.deleteAPIConfiguration
);

// POST /api/settings/api-configurations/:configId/set-default - Set as default
router.post(
  '/api-configurations/:configId/set-default',
  settingsController.setDefaultConfiguration
);

// GET /api/settings/available-models/:provider - Get available models for provider
router.get(
  '/available-models/:provider',
  settingsController.getAvailableModels
);

// POST /api/settings/validate-and-fetch-models - Validate API key and fetch models dynamically
router.post(
  '/validate-and-fetch-models',
  settingsController.validateAndFetchModels
);

// GET /api/settings/api-configurations/:configId/models - Fetch models using stored API key
router.get(
  '/api-configurations/:configId/models',
  settingsController.fetchModelsForConfiguration
);

export default router;
