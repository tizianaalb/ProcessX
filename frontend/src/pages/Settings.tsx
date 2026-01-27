import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Settings as SettingsIcon,
  Key,
  ChevronLeft,
  Plus,
  Trash2,
  Check,
  Save,
  X,
  Sparkles,
  Eye,
  EyeOff,
  Edit,
  Lock,
} from 'lucide-react';

interface APIConfiguration {
  id: string;
  provider: string;
  modelId?: string;
  isActive: boolean;
  isDefault: boolean;
  config?: any;
  createdAt: string;
  updatedAt: string;
  apiKey?: string; // Masked API key
  maskedApiKey?: string;
}

interface Model {
  id: string;
  name: string;
  description: string;
}

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [configurations, setConfigurations] = useState<APIConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [showApiKey, setShowApiKey] = useState(false);
  const [editingConfig, setEditingConfig] = useState<APIConfiguration | null>(null);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    provider: 'ANTHROPIC',
    apiKey: '',
    modelId: '',
  });

  // Password form state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings/api-configurations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConfigurations(data.configurations);
      }
    } catch (error) {
      console.error('Failed to fetch configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableModels = async (provider: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/settings/available-models/${provider}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableModels(data.models);
        // Set default model
        if (data.models.length > 0) {
          setFormData((prev) => ({ ...prev, modelId: data.models[0].id }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch available models:', error);
    }
  };

  useEffect(() => {
    if (showAddForm) {
      fetchAvailableModels(formData.provider);
    }
  }, [formData.provider, showAddForm]);

  const validateAndFetchModels = async () => {
    if (!formData.apiKey || formData.apiKey.trim() === '') {
      setValidationError('Please enter an API key first');
      return;
    }

    setFetchingModels(true);
    setValidationError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/settings/validate-and-fetch-models`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({
            provider: formData.provider,
            apiKey: formData.apiKey,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.valid) {
        setAvailableModels(data.models || []);
        if (data.models && data.models.length > 0) {
          setFormData((prev) => ({ ...prev, modelId: data.models[0].id }));
        }
        setValidationError(null);
        alert('✅ API key validated successfully! Models loaded.');
      } else {
        setValidationError(data.error || 'Failed to validate API key');
        alert(`❌ ${data.error || 'Failed to validate API key'}`);
      }
    } catch (error) {
      console.error('Failed to validate and fetch models:', error);
      setValidationError('Network error. Please try again.');
      alert('❌ Failed to validate API key. Please check your connection.');
    } finally {
      setFetchingModels(false);
    }
  };

  const fetchModelsUsingCurrentKey = async () => {
    if (!editingConfig) return;

    setFetchingModels(true);
    setValidationError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/settings/api-configurations/${editingConfig.id}/models`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.valid) {
        setAvailableModels(data.models || []);
        if (data.models && data.models.length > 0 && !formData.modelId) {
          setFormData((prev) => ({ ...prev, modelId: data.models[0].id }));
        }
        setValidationError(null);
        alert(`✅ Models loaded successfully! Found ${data.models?.length || 0} models.`);
      } else {
        setValidationError(data.error || 'Failed to fetch models');
        alert(`❌ ${data.error || 'Failed to fetch models'}`);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setValidationError('Network error. Please try again.');
      alert('❌ Failed to fetch models. Please check your connection.');
    } finally {
      setFetchingModels(false);
    }
  };

  const handleAddConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/settings/api-configurations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          ...formData,
          isDefault: configurations.length === 0, // First config is default
        }),
      });

      if (response.ok) {
        setShowAddForm(false);
        setFormData({ provider: 'ANTHROPIC', apiKey: '', modelId: '' });
        fetchConfigurations();
        alert('✅ API configuration saved successfully!');
      } else {
        const error = await response.json();
        const errorMsg = error.error || 'Failed to add configuration';
        const errorDetails = error.message ? `\n\n${error.message}` : '';
        alert(`❌ Error: ${errorMsg}${errorDetails}\n\nStatus: ${response.status}`);
        console.error('API Configuration Error:', error);
      }
    } catch (error) {
      console.error('Failed to add configuration:', error);
      alert(`❌ Failed to add configuration.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your network connection and try again.`);
    }
  };

  const handleEditConfiguration = (config: APIConfiguration) => {
    setEditingConfig(config);
    setFormData({
      provider: config.provider,
      apiKey: '', // DON'T pre-fill - keep empty for new input
      modelId: config.modelId || '',
    });
    setShowAddForm(true);
    fetchAvailableModels(config.provider);
    setValidationError(null);
  };

  const handleUpdateConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;

    try {
      const updatePayload: any = {};

      // Only include fields that have values
      if (formData.apiKey) {
        updatePayload.apiKey = formData.apiKey;
      }
      if (formData.modelId) {
        updatePayload.modelId = formData.modelId;
      }

      const response = await fetch(
        `${API_URL}/api/settings/api-configurations/${editingConfig.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify(updatePayload),
        }
      );

      if (response.ok) {
        setShowAddForm(false);
        setEditingConfig(null);
        setFormData({ provider: 'ANTHROPIC', apiKey: '', modelId: '' });
        fetchConfigurations();
        alert('✅ API configuration updated successfully!');
      } else {
        const error = await response.json();
        const errorMsg = error.error || 'Failed to update configuration';
        const errorDetails = error.message ? `\n\n${error.message}` : '';
        alert(`❌ Error: ${errorMsg}${errorDetails}\n\nStatus: ${response.status}`);
        console.error('API Configuration Error:', error);
      }
    } catch (error) {
      console.error('Failed to update configuration:', error);
      alert(`❌ Failed to update configuration.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your network connection and try again.`);
    }
  };

  const handleDeleteConfiguration = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this API configuration?')) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/settings/api-configurations/${configId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );

      if (response.ok) {
        fetchConfigurations();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete configuration');
      }
    } catch (error) {
      console.error('Failed to delete configuration:', error);
      alert('Failed to delete configuration');
    }
  };

  const handleSetDefault = async (configId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/settings/api-configurations/${configId}/set-default`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );

      if (response.ok) {
        fetchConfigurations();
      }
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'ANTHROPIC':
        return '🔮';
      case 'GOOGLE_GEMINI':
        return '✨';
      case 'OPENAI':
        return '🤖';
      case 'AZURE_OPENAI':
        return '☁️';
      default:
        return '🔧';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'ANTHROPIC':
        return 'Anthropic Claude';
      case 'GOOGLE_GEMINI':
        return 'Google Gemini';
      case 'OPENAI':
        return 'OpenAI';
      case 'AZURE_OPENAI':
        return 'Azure OpenAI';
      default:
        return provider;
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    // Validate password length
    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/settings/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Password updated successfully!');
        setShowPasswordForm(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setPasswordError(data.error || 'Failed to update password');
        alert(`❌ ${data.error || 'Failed to update password'}`);
      }
    } catch (error) {
      console.error('Failed to update password:', error);
      setPasswordError('Network error. Please try again.');
      alert('❌ Failed to update password. Please check your connection.');
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
            <p className="text-gray-600 mb-6">
              Only administrators can access settings and manage API configurations.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <SettingsIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage your API configurations and preferences</p>
            </div>
          </div>
        </div>

        {/* API Configurations Section */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">AI Provider Configuration</h2>
              </div>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  Add Provider
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Admin Permission Warning */}
            {user && user.role !== 'admin' && user.role !== 'super_admin' && (
              <div className="mb-4 bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="text-yellow-600 text-2xl">⚠️</div>
                  <div>
                    <h4 className="font-bold text-yellow-900 mb-1">Admin Privileges Required</h4>
                    <p className="text-sm text-yellow-800">
                      Only administrators can manage AI provider configurations. Your current role is: <strong>{user.role}</strong>
                    </p>
                    <p className="text-xs text-yellow-700 mt-2">
                      Please contact your organization administrator to configure AI providers or to upgrade your account.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Add/Edit Configuration Form */}
            {showAddForm && (
              <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingConfig ? 'Edit AI Provider' : 'Add New AI Provider'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingConfig(null);
                      setFormData({ provider: 'ANTHROPIC', apiKey: '', modelId: '' });
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={editingConfig ? handleUpdateConfiguration : handleAddConfiguration} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Provider
                    </label>
                    <select
                      value={formData.provider}
                      onChange={(e) =>
                        setFormData({ ...formData, provider: e.target.value })
                      }
                      disabled={!!editingConfig}
                      className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="ANTHROPIC">🔮 Anthropic Claude</option>
                      <option value="GOOGLE_GEMINI">✨ Google Gemini</option>
                      <option value="OPENAI">🤖 OpenAI</option>
                      <option value="AZURE_OPENAI">☁️ Azure OpenAI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      API Key
                    </label>
                    {editingConfig && editingConfig.maskedApiKey && (
                      <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-700 font-semibold">Current API Key:</p>
                        <p className="text-sm font-mono text-blue-900">{editingConfig.maskedApiKey}</p>
                      </div>
                    )}
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={formData.apiKey}
                        onChange={(e) => {
                          setFormData({ ...formData, apiKey: e.target.value });
                          setValidationError(null);
                        }}
                        placeholder={editingConfig ? "Enter new API key to update (or leave empty)" : "sk-ant-..."}
                        className="w-full pl-11 pr-12 py-3 bg-white border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        required={!editingConfig}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {editingConfig && (
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty to keep current API key, or enter a new one and click "Validate & Fetch Models"
                      </p>
                    )}
                    {validationError && (
                      <p className="text-xs text-red-600 mt-1">❌ {validationError}</p>
                    )}

                    {/* Validate & Fetch Models Buttons */}
                    <div className="mt-2 flex gap-2">
                      {editingConfig && (
                        <button
                          type="button"
                          onClick={fetchModelsUsingCurrentKey}
                          disabled={fetchingModels}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Load models using the current stored API key"
                        >
                          {fetchingModels ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Loading...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Load Models (Current Key)
                            </>
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={validateAndFetchModels}
                        disabled={fetchingModels || !formData.apiKey}
                        className={`${editingConfig ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Validate a new API key and fetch models"
                      >
                        {fetchingModels ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Validating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            {editingConfig ? 'Validate New Key' : 'Validate & Fetch Models'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Model {availableModels.length > 0 && <span className="text-xs text-green-600 font-semibold">✓ {availableModels.length} models loaded</span>}
                    </label>
                    {availableModels.length > 0 ? (
                      <select
                        value={formData.modelId}
                        onChange={(e) =>
                          setFormData({ ...formData, modelId: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                      >
                        <option value="">Use provider default</option>
                        {availableModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name} {model.description && `- ${model.description}`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.modelId}
                        onChange={(e) =>
                          setFormData({ ...formData, modelId: e.target.value })
                        }
                        placeholder="e.g., claude-3-5-sonnet-20241022 (or validate API key to load models)"
                        className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {availableModels.length > 0
                        ? 'Select a model from the validated list above'
                        : 'Click "Validate & Fetch Models" to load available models, or enter manually'}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                    >
                      <Save className="w-5 h-5" />
                      {editingConfig ? 'Update Configuration' : 'Save Configuration'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingConfig(null);
                        setFormData({ provider: 'ANTHROPIC', apiKey: '', modelId: '' });
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Configurations List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading configurations...</p>
              </div>
            ) : configurations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔧</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No API Configurations</h3>
                <p className="text-gray-600 mb-6">
                  Add your first AI provider to start using AI-powered features
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {configurations.map((config) => (
                  <div
                    key={config.id}
                    className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-200 ${
                      config.isDefault
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">{getProviderIcon(config.provider)}</div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-bold text-gray-900">
                                {getProviderName(config.provider)}
                              </h3>
                              {config.isDefault && (
                                <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full">
                                  <Check className="w-3 h-3" />
                                  DEFAULT
                                </span>
                              )}
                              {config.isActive && !config.isDefault && (
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            {config.modelId && (
                              <p className="text-sm text-gray-600 font-medium">
                                Model: <span className="font-mono">{config.modelId}</span>
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Added {new Date(config.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditConfiguration(config)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit configuration"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          {!config.isDefault && (
                            <button
                              onClick={() => handleSetDefault(config.id)}
                              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors text-sm"
                            >
                              Set as Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteConfiguration(config.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete configuration"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
          <div className="flex gap-4">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">About AI Providers</h3>
              <p className="text-sm text-gray-700">
                Configure AI providers to enable intelligent process analysis, pain point detection,
                and optimization recommendations. Your API keys are stored securely and only
                accessible by administrators in your organization.
              </p>
            </div>
          </div>
        </div>

        {/* Password Update Section */}
        <div className="mt-6 bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Security Settings</h2>
              </div>
              {!showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                >
                  <Key className="w-5 h-5" />
                  Change Password
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {showPasswordForm ? (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Update Password</h3>
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                      setPasswordError(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  {passwordError && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                      <p className="text-sm text-red-700 font-medium">❌ {passwordError}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => {
                          setPasswordData({ ...passwordData, currentPassword: e.target.value });
                          setPasswordError(null);
                        }}
                        placeholder="Enter your current password"
                        className="w-full pl-11 pr-12 py-3 bg-white border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => {
                          setPasswordData({ ...passwordData, newPassword: e.target.value });
                          setPasswordError(null);
                        }}
                        placeholder="Enter new password (min 8 characters)"
                        className="w-full pl-11 pr-12 py-3 bg-white border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => {
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                          setPasswordError(null);
                        }}
                        placeholder="Confirm your new password"
                        className="w-full pl-11 pr-12 py-3 bg-white border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                    >
                      <Save className="w-5 h-5" />
                      Update Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                        setPasswordError(null);
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🔒</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Password Security</h3>
                <p className="text-gray-600 mb-4">
                  Keep your account secure by updating your password regularly
                </p>
                <p className="text-sm text-gray-500">
                  Click "Change Password" above to update your credentials
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
