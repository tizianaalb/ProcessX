import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, Settings, Sparkles, FileText } from 'lucide-react';
import { api } from '../lib/api';
import type { Process } from '../lib/api';
import { Button } from '../components/ui/button';
import ProcessGenerationModal from '../components/ProcessGenerationModal';
import TemplateGallery from '../components/TemplateGallery';

export const ProcessList = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);

  const [filters, setFilters] = useState<{
    status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    type?: 'AS_IS' | 'TO_BE';
  }>({});

  useEffect(() => {
    loadProcesses();
  }, []);

  const loadProcesses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getProcesses();
      setProcesses(response.processes);
    } catch (err: any) {
      setError(err.message || 'Failed to load processes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await api.deleteProcess(id);
        setProcesses(processes.filter((p) => p.id !== id));
      } catch (err: any) {
        alert('Failed to delete process: ' + err.message);
      }
    }
  };

  const filteredProcesses = processes.filter((p) => {
    if (filters.status && p.status !== filters.status) return false;
    if (filters.type && p.type !== filters.type) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'ARCHIVED':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'AS_IS':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'TO_BE':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700">Loading processes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Navigation Buttons */}
          <div className="mb-4 flex items-center gap-2">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="text-sm flex items-center gap-2"
            >
              <Home size={16} />
              Dashboard
            </Button>
            <Button
              onClick={() => navigate('/settings')}
              variant="outline"
              className="text-sm flex items-center gap-2"
            >
              <Settings size={16} />
              Settings
            </Button>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Process Maps</h1>
              <p className="mt-1 text-sm text-gray-600">
                Create and manage your process maps
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setIsTemplateGalleryOpen(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white flex items-center gap-2"
              >
                <FileText size={16} />
                Browse Templates
              </Button>
              <Button
                onClick={() => setIsGenerationModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex items-center gap-2"
              >
                <Sparkles size={16} />
                Generate with AI
              </Button>
              <Button
                onClick={() => navigate('/processes/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                + Create New Process
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: e.target.value as any || undefined,
                  })
                }
                className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    type: e.target.value as any || undefined,
                  })
                }
                className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Types</option>
                <option value="AS_IS">As-Is</option>
                <option value="TO_BE">To-Be</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Process List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {filteredProcesses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No processes found
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first process map.
            </p>
            <Button
              onClick={() => navigate('/processes/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create Your First Process
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProcesses.map((process) => (
              <div
                key={process.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {process.name}
                    </h3>
                    <div className="flex gap-1">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded border ${getTypeColor(
                          process.type
                        )}`}
                      >
                        {process.type}
                      </span>
                    </div>
                  </div>

                  {process.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {process.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(
                        process.status
                      )}`}
                    >
                      {process.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      v{process.version}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-4">
                      <span title="Steps">📍 {process._count?.steps || 0}</span>
                      <span title="Pain Points">⚠️ {process._count?.painPoints || 0}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 mb-4">
                    Updated {formatDate(process.updatedAt)}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/processes/${process.id}`)}
                      variant="outline"
                      className="flex-1 text-sm"
                    >
                      View
                    </Button>
                    <Button
                      onClick={() => navigate(`/processes/${process.id}/edit`)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(process.id, process.name)}
                      variant="outline"
                      className="text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Gallery Modal */}
      <TemplateGallery
        isOpen={isTemplateGalleryOpen}
        onClose={() => setIsTemplateGalleryOpen(false)}
        onSuccess={() => {
          setIsTemplateGalleryOpen(false);
          loadProcesses();
        }}
      />

      {/* AI Process Generation Modal */}
      <ProcessGenerationModal
        isOpen={isGenerationModalOpen}
        onClose={() => setIsGenerationModalOpen(false)}
        onSuccess={() => {
          setIsGenerationModalOpen(false);
          loadProcesses();
        }}
      />
    </div>
  );
};
