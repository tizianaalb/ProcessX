import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  LayoutDashboard,
  Plus,
  FolderOpen,
  AlertTriangle,
  TrendingUp,
  LogOut,
  ArrowRight,
  Zap,
  Target,
  BarChart3,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Users,
  ChevronRight,
} from 'lucide-react';

interface ProcessSummary {
  id: string;
  name: string;
  type: string;
  status: string;
  updatedAt: string;
  _count: {
    steps: number;
    painPoints: number;
  };
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [processes, setProcesses] = useState<ProcessSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.getProcesses();
      setProcesses(response.processes);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Calculate stats
  const stats = {
    totalProcesses: processes.length,
    activeProcesses: processes.filter(p => p.status === 'ACTIVE').length,
    draftProcesses: processes.filter(p => p.status === 'DRAFT').length,
    totalPainPoints: processes.reduce((sum, p) => sum + (p._count?.painPoints || 0), 0),
    criticalIssues: Math.floor(processes.reduce((sum, p) => sum + (p._count?.painPoints || 0), 0) * 0.3),
  };

  const recentProcesses = processes.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Modern Navigation Bar */}
      <nav className="bg-white/60 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative p-3 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-lg">
                  <Activity className="text-white" size={28} strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ProcessX
                </h1>
                <p className="text-xs text-slate-500 font-medium">Enterprise Process Intelligence</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl border border-slate-300 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-xs text-slate-500">{user?.email}</span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all shadow-sm"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline font-medium">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-12 shadow-2xl">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                <span className="text-white text-sm font-semibold">Welcome Back! 👋</span>
              </div>
            </div>
            <h2 className="text-5xl font-black text-white mb-4 leading-tight">
              Hey {user?.firstName},<br />
              <span className="bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                Let's optimize your processes
              </span>
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl leading-relaxed">
              Transform your business workflows with AI-powered insights. Map processes, identify bottlenecks,
              and unlock operational excellence.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => navigate('/processes/new')}
                className="bg-white text-indigo-600 hover:bg-blue-50 px-8 py-6 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center gap-3"
              >
                <Plus size={24} strokeWidth={3} />
                Create New Process
                <ArrowRight size={20} />
              </Button>
              <Button
                onClick={() => navigate('/processes')}
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 px-8 py-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
              >
                <FolderOpen size={22} />
                View All Processes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Total Processes */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FolderOpen className="text-blue-600" size={24} strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">{stats.totalProcesses}</div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Processes</div>
          </div>

          {/* Active */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="text-green-600" size={24} strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">{stats.activeProcesses}</div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Active</div>
          </div>

          {/* Drafts */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="text-amber-600" size={24} strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">{stats.draftProcesses}</div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">In Draft</div>
          </div>

          {/* Pain Points */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <AlertTriangle className="text-orange-600" size={24} strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">{stats.totalPainPoints}</div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Pain Points</div>
          </div>

          {/* Critical Issues */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <XCircle className="text-red-600" size={24} strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">{stats.criticalIssues}</div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Critical</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Processes */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-8 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 mb-1 flex items-center gap-3">
                      <BarChart3 className="text-indigo-600" size={28} strokeWidth={2.5} />
                      Recent Activity
                    </h3>
                    <p className="text-slate-500 font-medium">Your latest process workflows</p>
                  </div>
                  {processes.length > 0 && (
                    <Button
                      onClick={() => navigate('/processes')}
                      className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold rounded-xl"
                    >
                      View All
                      <ChevronRight size={18} className="ml-1" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-8">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-slate-200 rounded-full"></div>
                      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                    </div>
                  </div>
                ) : recentProcesses.length > 0 ? (
                  <div className="space-y-4">
                    {recentProcesses.map((process, index) => (
                      <div
                        key={process.id}
                        onClick={() => navigate(`/processes/${process.id}/edit`)}
                        className="group relative p-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-400 bg-gradient-to-br from-slate-50 to-white hover:shadow-lg transition-all cursor-pointer"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {process.name}
                              </h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                process.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-700'
                                  : process.status === 'DRAFT'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {process.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-slate-600">
                              <span className="flex items-center gap-1.5 font-medium">
                                <LayoutDashboard size={16} className="text-indigo-500" />
                                {process._count?.steps || 0} steps
                              </span>
                              <span className="flex items-center gap-1.5 font-medium">
                                <AlertTriangle size={16} className="text-orange-500" />
                                {process._count?.painPoints || 0} issues
                              </span>
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                process.type === 'AS_IS'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {process.type}
                              </span>
                            </div>
                          </div>
                          <ChevronRight
                            className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"
                            size={24}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="inline-flex p-6 bg-slate-100 rounded-3xl mb-6">
                      <FolderOpen className="text-slate-400" size={48} strokeWidth={1.5} />
                    </div>
                    <h4 className="font-bold text-xl text-slate-900 mb-2">No processes yet</h4>
                    <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                      Get started by creating your first process workflow
                    </p>
                    <Button
                      onClick={() => navigate('/processes/new')}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      <Plus size={20} className="mr-2" strokeWidth={3} />
                      Create Your First Process
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Tips */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <Zap className="text-yellow-500" size={24} strokeWidth={2.5} />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/processes/new')}
                  className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Plus size={20} strokeWidth={3} />
                      </div>
                      <span className="font-bold">New Process</span>
                    </div>
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </div>
                </button>

                <button
                  onClick={() => navigate('/processes')}
                  className="w-full text-left p-4 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        <FolderOpen size={20} className="text-slate-700" strokeWidth={2.5} />
                      </div>
                      <span className="font-bold text-slate-700">Browse All</span>
                    </div>
                    <ArrowRight className="text-slate-500 group-hover:translate-x-1 transition-transform" size={20} />
                  </div>
                </button>
              </div>
            </div>

            {/* Pro Tips */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/10"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={24} strokeWidth={2.5} />
                  <h3 className="text-xl font-black">Pro Tips</h3>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <Target size={18} className="mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                    <span className="leading-relaxed">Map your as-is process first to understand current state</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                    <span className="leading-relaxed">Document pain points for AI-powered insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp size={18} className="mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                    <span className="leading-relaxed">Compare metrics to track improvement over time</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
