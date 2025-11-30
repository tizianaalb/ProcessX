import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { GeneratedProcessPreview } from '../lib/api';
import { Button } from './ui/button';

interface ProcessGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ProcessGenerationModal: React.FC<ProcessGenerationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [description, setDescription] = useState('');
  const [processType, setProcessType] = useState<'AS_IS' | 'TO_BE'>('AS_IS');
  const [industryContext, setIndustryContext] = useState('insurance');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<GeneratedProcessPreview | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleGenerate = async () => {
    if (description.length < 50) {
      setError('Description must be at least 50 characters');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const result = await api.generateProcessFromDescription({
        description,
        processType,
        industryContext,
        createImmediately: false,
      });

      if (result.success && result.preview) {
        setPreview(result.preview);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate process');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateProcess = async () => {
    if (!preview) return;

    setError(null);
    setIsCreating(true);

    try {
      const result = await api.generateProcessFromDescription({
        description,
        processType,
        industryContext,
        createImmediately: true,
      });

      if (result.success) {
        onSuccess();
        handleClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create process');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setDescription('');
    setProcessType('AS_IS');
    setIndustryContext('insurance');
    setPreview(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex items-center justify-between border-b border-purple-700">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-100" />
            <h2 className="text-2xl font-bold text-white">
              Generate Process with AI
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-purple-100 hover:text-white transition-colors"
            disabled={isGenerating || isCreating}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Input Section */}
          {!preview && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Process Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the process you want to create. For example: 'Create a process for handling auto insurance claims from initial report through settlement, including validation, investigation, adjuster assignment, damage assessment, and payment steps.'"
                  className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
                  disabled={isGenerating}
                />
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span
                    className={`${
                      description.length < 50
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {description.length} / 50 characters minimum
                  </span>
                  <span className="text-gray-500">
                    {description.length} / 2000 characters
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Process Type
                  </label>
                  <select
                    value={processType}
                    onChange={(e) =>
                      setProcessType(e.target.value as 'AS_IS' | 'TO_BE')
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    disabled={isGenerating}
                  >
                    <option value="AS_IS">AS-IS (Current State)</option>
                    <option value="TO_BE">TO-BE (Future State)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Industry Context
                  </label>
                  <select
                    value={industryContext}
                    onChange={(e) => setIndustryContext(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    disabled={isGenerating}
                  >
                    <option value="insurance">Insurance</option>
                    <option value="banking">Banking & Finance</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="technology">Technology</option>
                    <option value="general">General Business</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={description.length < 50 || isGenerating}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Process
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Preview Section */}
          {preview && (
            <>
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-green-800">
                    Process Generated Successfully!
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    Review the generated process below and click "Create Process" to add it to your workspace.
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {preview.name}
                </h3>
                <p className="text-gray-600 mb-4">{preview.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-sm font-semibold text-purple-900 mb-1">
                      Total Steps
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      {preview.steps.length}
                    </div>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="text-sm font-semibold text-indigo-900 mb-1">
                      Connections
                    </div>
                    <div className="text-2xl font-bold text-indigo-700">
                      {preview.connections.length}
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm font-semibold text-blue-900 mb-1">
                      Est. Duration
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {preview.steps.reduce(
                        (sum, step) => sum + (step.duration || 0),
                        0
                      )}{' '}
                      min
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">
                    Process Steps
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {preview.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="flex items-start gap-3 bg-white p-3 rounded border border-gray-200"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-700">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            {step.name}
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {step.type}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {step.description}
                          </div>
                          {step.duration && (
                            <div className="text-xs text-gray-500 mt-1">
                              Duration: {step.duration} minutes
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setPreview(null)}
                  variant="outline"
                  disabled={isCreating}
                >
                  Edit Description
                </Button>
                <Button
                  onClick={handleCreateProcess}
                  disabled={isCreating}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  {isCreating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Create Process
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessGenerationModal;
