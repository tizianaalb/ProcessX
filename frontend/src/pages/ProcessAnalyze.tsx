import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Loader,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  RefreshCw,
  Trash2,
  Download,
  FileText,
} from 'lucide-react';
import { api } from '../lib/api';
import type { AIAnalysis, Process } from '../lib/api';
import { Button } from '../components/ui/button';

type AnalysisType = 'FULL' | 'PAIN_POINTS' | 'RECOMMENDATIONS' | 'TO_BE';

export const ProcessAnalyze = () => {
  const { processId } = useParams<{ processId: string }>();
  const navigate = useNavigate();

  const [process, setProcess] = useState<Process | null>(null);
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<AnalysisType>('FULL');
  const [pollingAnalysisId, setPollingAnalysisId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(null);

  useEffect(() => {
    if (processId) {
      loadProcess();
      loadAnalyses();
    }
  }, [processId]);

  // Poll for analysis updates
  useEffect(() => {
    if (!pollingAnalysisId) return;

    const interval = setInterval(async () => {
      try {
        const { analysis } = await api.getAnalysis(pollingAnalysisId);

        if (analysis.status === 'COMPLETED' || analysis.status === 'FAILED') {
          setPollingAnalysisId(null);
          loadAnalyses();
        }
      } catch (err) {
        console.error('Error polling analysis:', err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [pollingAnalysisId]);

  const loadProcess = async () => {
    try {
      const { process } = await api.getProcess(processId!);
      setProcess(process);
    } catch (err: any) {
      setError(err.message || 'Failed to load process');
    }
  };

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      setError(null);
      const { analyses } = await api.getProcessAnalyses(processId!);
      setAnalyses(analyses);
    } catch (err: any) {
      setError(err.message || 'Failed to load analyses');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);

      const { analysisId } = await api.startAnalysis(processId!, {
        analysisType: selectedType,
      });

      // Start polling for updates
      setPollingAnalysisId(analysisId);

      // Reload analyses to show the new one
      await loadAnalyses();
    } catch (err: any) {
      setError(err.message || 'Failed to start analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(analysisId);
      setError(null);

      await api.deleteAnalysis(analysisId);

      // Reload analyses to remove the deleted one
      await loadAnalyses();
    } catch (err: any) {
      setError(err.message || 'Failed to delete analysis');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportAnalysis = async (analysisId: string, format: 'markdown' | 'powerpoint' | 'pdf' | 'excel' | 'word') => {
    try {
      setError(null);
      console.log(`Exporting analysis ${analysisId} as ${format}`);

      // Call API to download the export
      await api.exportAnalysis(analysisId, format);
      console.log(`Export successful: ${format}`);
    } catch (err: any) {
      console.error(`Export failed for ${format}:`, err);
      setError(err.message || `Failed to export analysis as ${format}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'IN_PROGRESS':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PENDING':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'FULL':
        return 'Full Analysis';
      case 'PAIN_POINTS':
        return 'Pain Points Only';
      case 'RECOMMENDATIONS':
        return 'Recommendations Only';
      case 'TO_BE':
        return 'TO-BE Process Only';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <div className="text-xl font-semibold text-gray-700">Loading analysis...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => navigate(`/processes/${processId}/edit`)}
              variant="outline"
              className="text-sm flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Process
            </Button>
            <Button
              onClick={() => navigate(`/processes/${processId}/recommendations`)}
              variant="outline"
              className="text-sm flex items-center gap-2"
            >
              <Lightbulb size={16} />
              View Recommendations
            </Button>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Analysis</h1>
              <p className="mt-1 text-sm text-gray-600">
                {process?.name} - AI-powered process optimization
              </p>
            </div>
            <Button
              onClick={loadAnalyses}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Start New Analysis Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Start New AI Analysis
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Choose the type of analysis you want to perform on this process.
              </p>

              {/* Analysis Type Selection */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <button
                  onClick={() => setSelectedType('FULL')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedType === 'FULL'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">Full Analysis</div>
                  <div className="text-xs text-gray-600">
                    Complete analysis with pain points, recommendations & TO-BE process
                  </div>
                </button>

                <button
                  onClick={() => setSelectedType('PAIN_POINTS')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedType === 'PAIN_POINTS'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">Pain Points</div>
                  <div className="text-xs text-gray-600">
                    Detect bottlenecks, inefficiencies, and risks
                  </div>
                </button>

                <button
                  onClick={() => setSelectedType('RECOMMENDATIONS')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedType === 'RECOMMENDATIONS'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">Recommendations</div>
                  <div className="text-xs text-gray-600">
                    Generate improvement suggestions
                  </div>
                </button>

                <button
                  onClick={() => setSelectedType('TO_BE')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedType === 'TO_BE'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">TO-BE Process</div>
                  <div className="text-xs text-gray-600">
                    Create optimized process structure
                  </div>
                </button>
              </div>

              <Button
                onClick={handleStartAnalysis}
                disabled={analyzing || !!pollingAnalysisId}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white flex items-center gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Starting Analysis...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Start {getAnalysisTypeLabel(selectedType)}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Analysis History */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis History</h2>

          {analyses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No analyses yet
              </h3>
              <p className="text-gray-600">
                Start your first AI analysis to get insights and recommendations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(analysis.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getAnalysisTypeLabel(analysis.analysisType)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Started {formatDate(analysis.createdAt)}
                          {analysis.initiatedBy && (
                            <span>
                              {' '}
                              by {analysis.initiatedBy.firstName} {analysis.initiatedBy.lastName}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          analysis.status
                        )}`}
                      >
                        {analysis.status}
                      </span>
                      <Button
                        onClick={() => handleDeleteAnalysis(analysis.id)}
                        variant="outline"
                        size="sm"
                        disabled={deletingId === analysis.id}
                        className="text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300"
                      >
                        {deletingId === analysis.id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Completed Analysis Results */}
                  {analysis.status === 'COMPLETED' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-4 pt-4 border-t">
                        {analysis.detectedPainPoints && analysis.detectedPainPoints.length > 0 && (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {analysis.detectedPainPoints.length} Pain Points
                              </div>
                              <div className="text-xs text-gray-600">Detected</div>
                            </div>
                          </div>
                        )}

                        {analysis.recommendations && analysis.recommendations.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-blue-600" />
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {analysis.recommendations.length} Recommendations
                              </div>
                              <div className="text-xs text-gray-600">Generated</div>
                            </div>
                          </div>
                        )}

                        {analysis.generatedProcess && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                TO-BE Process
                              </div>
                              <div className="text-xs text-gray-600">Generated</div>
                            </div>
                          </div>
                        )}

                        {analysis.aiProvider && (
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {analysis.aiProvider}
                              </div>
                              <div className="text-xs text-gray-600">
                                {analysis.tokensUsed ? `${analysis.tokensUsed.toLocaleString()} tokens` : 'Provider'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex gap-2">
                        <Button
                          onClick={() => setExpandedAnalysisId(expandedAnalysisId === analysis.id ? null : analysis.id)}
                          variant="outline"
                          className="flex-1 text-sm"
                        >
                          {expandedAnalysisId === analysis.id ? 'Hide Details' : 'View Details'}
                        </Button>
                        <Button
                          onClick={() => handleExportAnalysis(analysis.id, 'markdown')}
                          variant="outline"
                          className="text-sm flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200"
                          title="Export as Markdown"
                        >
                          <FileText size={16} />
                          Markdown
                        </Button>
                        <Button
                          onClick={() => handleExportAnalysis(analysis.id, 'powerpoint')}
                          variant="outline"
                          className="text-sm flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200"
                          title="Export as PowerPoint"
                        >
                          <Download size={16} />
                          PowerPoint
                        </Button>
                        <Button
                          onClick={() => handleExportAnalysis(analysis.id, 'pdf')}
                          variant="outline"
                          className="text-sm flex items-center gap-2 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 border-red-200"
                          title="Export as PDF"
                        >
                          <Download size={16} />
                          PDF
                        </Button>
                        <Button
                          onClick={() => handleExportAnalysis(analysis.id, 'excel')}
                          variant="outline"
                          className="text-sm flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200"
                          title="Export as Excel"
                        >
                          <Download size={16} />
                          Excel
                        </Button>
                        <Button
                          onClick={() => handleExportAnalysis(analysis.id, 'word')}
                          variant="outline"
                          className="text-sm flex items-center gap-2 bg-gradient-to-r from-cyan-50 to-sky-50 hover:from-cyan-100 hover:to-sky-100 border-cyan-200"
                          title="Export as Word"
                        >
                          <Download size={16} />
                          Word
                        </Button>
                      </div>

                      {/* Detailed Results */}
                      {expandedAnalysisId === analysis.id && (
                        <div className="mt-4 space-y-6">
                          {/* Pain Points Details */}
                          {analysis.detectedPainPoints && analysis.detectedPainPoints.length > 0 && (
                            <div className="border-t pt-4">
                              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                                Detected Pain Points
                              </h4>
                              <div className="space-y-3">
                                {analysis.detectedPainPoints.map((painPoint: any, idx: number) => (
                                  <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-2">
                                      <h5 className="font-medium text-gray-900">{painPoint.title}</h5>
                                      <span className={`px-2 py-0.5 text-xs rounded ${
                                        painPoint.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                                        painPoint.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                        painPoint.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-blue-100 text-blue-800'
                                      }`}>
                                        {painPoint.severity}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2">{painPoint.description}</p>
                                    {painPoint.impact && (
                                      <p className="text-sm text-gray-600">
                                        <strong>Impact:</strong> {painPoint.impact}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recommendations Details */}
                          {analysis.recommendations && analysis.recommendations.length > 0 && (
                            <div className="border-t pt-4">
                              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-blue-600" />
                                Recommendations
                              </h4>
                              <div className="space-y-3">
                                {analysis.recommendations.map((rec: any, idx: number) => (
                                  <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-2">
                                      <h5 className="font-medium text-gray-900">{rec.title}</h5>
                                      <span className={`px-2 py-0.5 text-xs rounded ${
                                        rec.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                                        rec.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                      }`}>
                                        {rec.priority}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                                    {rec.expectedBenefits && rec.expectedBenefits.length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-xs font-medium text-gray-700 mb-1">Expected Benefits:</p>
                                        <ul className="text-xs text-gray-600 list-disc list-inside">
                                          {rec.expectedBenefits.map((benefit: string, bidx: number) => (
                                            <li key={bidx}>{benefit}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* TO-BE Process Details */}
                          {analysis.generatedProcess && (
                            <div className="border-t pt-4">
                              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                TO-BE Process
                              </h4>
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h5 className="font-medium text-gray-900 mb-2">{analysis.generatedProcess.name}</h5>
                                <p className="text-sm text-gray-700 mb-3">{analysis.generatedProcess.description}</p>
                                {analysis.generatedProcess.summary && (
                                  <div className="mb-3">
                                    <p className="text-xs font-medium text-gray-700 mb-1">Summary:</p>
                                    <p className="text-sm text-gray-600">{analysis.generatedProcess.summary}</p>
                                  </div>
                                )}
                                {analysis.generatedProcess.expectedImprovements && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-700 mb-1">Expected Improvements:</p>
                                    <ul className="text-sm text-gray-600 list-disc list-inside">
                                      {analysis.generatedProcess.expectedImprovements.map((imp: string, iidx: number) => (
                                        <li key={iidx}>{imp}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Failed Analysis Error */}
                  {analysis.status === 'FAILED' && analysis.errorMessage && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">
                          <strong>Error:</strong> {analysis.errorMessage}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* In Progress */}
                  {analysis.status === 'IN_PROGRESS' && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-900 mb-3">Analysis in progress...</p>
                        <div className="space-y-2">
                          {/* Gathering */}
                          <div className="flex items-center gap-2 text-sm">
                            {analysis.progressStep === 'gathering' ? (
                              <Loader className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            )}
                            <span className={analysis.progressStep === 'gathering' ? 'text-blue-800 font-medium' : 'text-gray-600'}>
                              Gathering process context
                            </span>
                          </div>

                          {/* Understanding */}
                          <div className="flex items-center gap-2 text-sm">
                            {analysis.progressStep === 'understanding' ? (
                              <Loader className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                            ) : (analysis.progressStep && ['pain_points', 'recommendations', 'to_be'].includes(analysis.progressStep)) ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                            <span className={analysis.progressStep === 'understanding' ? 'text-blue-800 font-medium' : (analysis.progressStep && ['pain_points', 'recommendations', 'to_be'].includes(analysis.progressStep)) ? 'text-gray-600' : 'text-gray-400'}>
                              Analyzing process understanding
                            </span>
                          </div>

                          {/* Pain Points */}
                          {(analysis.analysisType === 'FULL' || analysis.analysisType === 'PAIN_POINTS') && (
                            <div className="flex items-center gap-2 text-sm">
                              {analysis.progressStep === 'pain_points' ? (
                                <Loader className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                              ) : (analysis.progressStep && ['recommendations', 'to_be'].includes(analysis.progressStep)) ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              )}
                              <span className={analysis.progressStep === 'pain_points' ? 'text-blue-800 font-medium' : (analysis.progressStep && ['recommendations', 'to_be'].includes(analysis.progressStep)) ? 'text-gray-600' : 'text-gray-400'}>
                                Detecting pain points
                              </span>
                            </div>
                          )}

                          {/* Recommendations */}
                          {(analysis.analysisType === 'FULL' || analysis.analysisType === 'RECOMMENDATIONS') && (
                            <div className="flex items-center gap-2 text-sm">
                              {analysis.progressStep === 'recommendations' ? (
                                <Loader className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                              ) : (analysis.progressStep === 'to_be') ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              )}
                              <span className={analysis.progressStep === 'recommendations' ? 'text-blue-800 font-medium' : (analysis.progressStep === 'to_be') ? 'text-gray-600' : 'text-gray-400'}>
                                Generating recommendations
                              </span>
                            </div>
                          )}

                          {/* TO-BE Process */}
                          {(analysis.analysisType === 'FULL' || analysis.analysisType === 'TO_BE') && (
                            <div className="flex items-center gap-2 text-sm">
                              {analysis.progressStep === 'to_be' ? (
                                <Loader className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                              ) : (
                                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              )}
                              <span className={analysis.progressStep === 'to_be' ? 'text-blue-800 font-medium' : 'text-gray-400'}>
                                Creating TO-BE process
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
