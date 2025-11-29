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
}

interface Model {
  id: string;
  name: string;
  description: string;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [configurations, setConfigurations] = useState<APIConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [showApiKey, setShowApiKey] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    provider: 'ANTHROPIC',
    apiKey: '',
    modelId: '',
  });

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      const response = await fetch('http://localhost:3100/api/settings/api-configurations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
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
        `http://localhost:3100/api/settings/available-models/${provider}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
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

  const handleAddConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3100/api/settings/api-configurations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
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

  const handleDeleteConfiguration = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this API configuration?')) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3100/api/settings/api-configurations/${configId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
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
        `http://localhost:3100/api/settings/api-configurations/${configId}/set-default`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
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

  if (user?.role !== 'admin') {
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
            {user && user.role !== 'admin' && (
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

            {/* Add Configuration Form */}
            {showAddForm && (
              <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Add New AI Provider</h3>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddConfiguration} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Provider
                    </label>
                    <select
                      value={formData.provider}
                      onChange={(e) =>
                        setFormData({ ...formData, provider: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
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
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={formData.apiKey}
                        onChange={(e) =>
                          setFormData({ ...formData, apiKey: e.target.value })
                        }
                        placeholder="sk-ant-..."
                        className="w-full pl-11 pr-12 py-3 bg-white border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Model ID (optional)
                    </label>
                    <input
                      type="text"
                      list="model-suggestions"
                      value={formData.modelId}
                      onChange={(e) =>
                        setFormData({ ...formData, modelId: e.target.value })
                      }
                      placeholder="e.g., claude-3-5-sonnet-20241022, gemini-1.5-pro"
                      className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                    {availableModels.length > 0 && (
                      <datalist id="model-suggestions">
                        {availableModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name} - {model.description}
                          </option>
                        ))}
                      </datalist>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to use the provider's default model
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                    >
                      <Save className="w-5 h-5" />
                      Save Configuration
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
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
      </div>
    </div>
  );
};

export default Settings;
