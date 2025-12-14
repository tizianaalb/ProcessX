import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  Key,
  Save,
  X,
  Eye,
  EyeOff,
  Shield,
  UserCog,
  Database,
  Download,
  Upload,
  AlertTriangle,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
  };
}

interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    processes: number;
  };
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetPasswordValue, setShowResetPasswordValue] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  // Backup/Restore state
  const [showBackupRestore, setShowBackupRestore] = useState(false);
  const [backupData, setBackupData] = useState<any>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user' as 'super_admin' | 'admin' | 'user',
    password: '',
    organizationId: '',
  });

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      fetchUsers();
      if (user?.role === 'super_admin') {
        fetchOrganizations();
      }
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setIsSuperAdmin(data.isSuperAdmin || false);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/organizations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ User created successfully!');
        setShowForm(false);
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          role: 'user',
          password: '',
          organizationId: '',
        });
        fetchUsers();
      } else {
        alert(`❌ ${data.error || 'Failed to create user'}`);
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('❌ Failed to create user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const updateData: any = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
      };

      // Only include organizationId if super admin and value is set
      if (isSuperAdmin && formData.organizationId) {
        updateData.organizationId = formData.organizationId;
      }

      const response = await fetch(
        `${API_URL}/api/admin/users/${editingUser.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert('✅ User updated successfully!');
        setShowForm(false);
        setEditingUser(null);
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          role: 'user',
          password: '',
          organizationId: '',
        });
        fetchUsers();
      } else {
        alert(`❌ ${data.error || 'Failed to update user'}`);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('❌ Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ User deleted successfully!');
        fetchUsers();
      } else {
        alert(`❌ ${data.error || 'Failed to delete user'}`);
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('❌ Failed to delete user');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!resetPasswordValue || resetPasswordValue.length < 8) {
      alert('❌ Password must be at least 8 characters long');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/admin/users/${userId}/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({ newPassword: resetPasswordValue }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert('✅ Password reset successfully!');
        setShowResetPassword(false);
        setResetUserId(null);
        setResetPasswordValue('');
        setShowResetPasswordValue(false);
      } else {
        alert(`❌ ${data.error || 'Failed to reset password'}`);
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('❌ Failed to reset password');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      password: '',
      organizationId: user.organizationId,
    });
    setShowForm(true);
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Download backup as JSON file
        const blob = new Blob([JSON.stringify(data.backup, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `processx-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('✅ Backup created and downloaded successfully!');
      } else {
        alert(`❌ ${data.error || 'Failed to create backup'}`);
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
      alert('❌ Failed to create backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackupFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          setBackupData(json);
        } catch (error) {
          alert('❌ Invalid backup file format');
          setBackupFile(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRestore = async () => {
    if (!backupData) {
      alert('❌ Please select a backup file first');
      return;
    }

    const confirmMessage =
      restoreMode === 'overwrite'
        ? '⚠️ WARNING: This will DELETE ALL existing data and replace it with the backup data. This action cannot be undone!\n\nAre you absolutely sure you want to continue?'
        : '⚠️ This will merge the backup data with existing data. Existing records with the same IDs will be updated.\n\nAre you sure you want to continue?';

    if (!confirm(confirmMessage)) {
      return;
    }

    if (restoreMode === 'overwrite' && !confirm('⚠️ FINAL WARNING: All current data will be PERMANENTLY DELETED. Type "DELETE" in your mind and click OK to proceed.')) {
      return;
    }

    setIsRestoring(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          backup: backupData,
          mode: restoreMode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Database restored successfully in ${restoreMode} mode!\n\nRestored records:\n${JSON.stringify(data.restored, null, 2)}`);
        setShowBackupRestore(false);
        setBackupData(null);
        setBackupFile(null);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        alert(`❌ ${data.error || 'Failed to restore backup'}\n${data.details || ''}`);
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
      alert('❌ Failed to restore backup');
    } finally {
      setIsRestoring(false);
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
              Only administrators can access the admin panel.
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
      <div className="max-w-7xl mx-auto">
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
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-1">Manage users and permissions</p>
            </div>
          </div>
        </div>

        {/* Users Section */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">User Management</h2>
              </div>
              {!showForm && (
                <button
                  onClick={() => {
                    setShowForm(true);
                    setEditingUser(null);
                    setFormData({
                      email: '',
                      firstName: '',
                      lastName: '',
                      role: 'user',
                      password: '',
                      organizationId: '',
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  Add User
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Add/Edit User Form */}
            {showForm && (
              <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingUser(null);
                      setFormData({
                        email: '',
                        firstName: '',
                        lastName: '',
                        role: 'user',
                        password: '',
                        organizationId: '',
                      });
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2 mb-4">
                    <strong>Debug:</strong> isSuperAdmin={isSuperAdmin ? 'true' : 'false'},
                    organizations.length={organizations.length}
                  </div>
                )}

                <form
                  onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value as 'super_admin' | 'admin' | 'user' })
                      }
                      className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="user">👤 User</option>
                      <option value="admin">👑 Admin</option>
                      {isSuperAdmin && (
                        <option value="super_admin">⭐ Super Admin</option>
                      )}
                    </select>
                    {!isSuperAdmin && (
                      <p className="mt-1 text-xs text-gray-500">
                        ℹ️ Only super admins can create or manage super_admin accounts
                      </p>
                    )}
                  </div>

                  {/* Organization selector (super admin only) */}
                  {isSuperAdmin && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        🏢 Organization {organizations.length === 0 && '(Loading...)'}
                      </label>
                      {organizations.length > 0 ? (
                        <select
                          value={formData.organizationId}
                          onChange={(e) =>
                            setFormData({ ...formData, organizationId: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select Organization...</option>
                          {organizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name} ({org._count.users} users)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-gray-500">
                          No organizations available. Please ensure organizations endpoint is working.
                        </div>
                      )}
                    </div>
                  )}

                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password (min 8 characters)
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          className="w-full px-4 py-3 pr-12 bg-white border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                    >
                      <Save className="w-5 h-5" />
                      {editingUser ? 'Update User' : 'Create User'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingUser(null);
                        setFormData({
                          email: '',
                          firstName: '',
                          lastName: '',
                          role: 'user',
                          password: '',
                          organizationId: '',
                        });
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Users List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Users Found</h3>
                <p className="text-gray-600">Add your first user to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                          {u.firstName.charAt(0)}
                          {u.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-gray-900">
                              {u.firstName} {u.lastName}
                            </h3>
                            {u.role === 'super_admin' ? (
                              <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold rounded-full">
                                ⭐ SUPER ADMIN
                              </span>
                            ) : u.role === 'admin' ? (
                              <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full">
                                <Shield className="w-3 h-3" />
                                ADMIN
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                USER
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 font-medium">{u.email}</p>
                          {isSuperAdmin && u.organization && (
                            <p className="text-xs text-indigo-600 font-semibold mt-1">
                              🏢 {u.organization.name}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Created {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (!isSuperAdmin && u.role === 'super_admin') return;
                            setResetUserId(u.id);
                            setShowResetPassword(true);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            !isSuperAdmin && u.role === 'super_admin'
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-orange-600 hover:bg-orange-50'
                          }`}
                          title={!isSuperAdmin && u.role === 'super_admin' ? 'Only super admins can manage super_admin accounts' : 'Reset password'}
                          disabled={!isSuperAdmin && u.role === 'super_admin'}
                        >
                          <Key className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            if (!isSuperAdmin && u.role === 'super_admin') return;
                            handleEditUser(u);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            !isSuperAdmin && u.role === 'super_admin'
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                          title={!isSuperAdmin && u.role === 'super_admin' ? 'Only super admins can manage super_admin accounts' : 'Edit user'}
                          disabled={!isSuperAdmin && u.role === 'super_admin'}
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        {u.id !== user?.userId && (
                          <button
                            onClick={() => {
                              if (!isSuperAdmin && u.role === 'super_admin') return;
                              handleDeleteUser(u.id);
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              !isSuperAdmin && u.role === 'super_admin'
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                            title={!isSuperAdmin && u.role === 'super_admin' ? 'Only super admins can manage super_admin accounts' : 'Delete user'}
                            disabled={!isSuperAdmin && u.role === 'super_admin'}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Database Backup/Restore Section (Super Admin Only) */}
        {isSuperAdmin && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mt-8">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">Database Management</h2>
                </div>
                <span className="px-4 py-2 bg-white/20 text-white text-sm font-semibold rounded-xl backdrop-blur-sm">
                  Super Admin Only
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Create Backup Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Download className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Create Backup</h3>
                      <p className="text-sm text-gray-600">Export all database data</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-4">
                    Download a complete backup of all data including users, processes, templates, and more.
                  </p>

                  <button
                    onClick={handleCreateBackup}
                    disabled={isCreatingBackup}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingBackup ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Create & Download Backup
                      </>
                    )}
                  </button>
                </div>

                {/* Restore Backup Card */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Restore Backup</h3>
                      <p className="text-sm text-gray-600">Import data from backup file</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowBackupRestore(true)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    <Upload className="w-5 h-5" />
                    Restore from Backup
                  </button>

                  <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-800">
                        <strong>Warning:</strong> Restoring can modify or delete existing data. Always create a backup before restoring.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {showResetPassword && resetUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Reset User Password</h3>
              <button
                onClick={() => {
                  setShowResetPassword(false);
                  setResetUserId(null);
                  setResetPasswordValue('');
                  setShowResetPasswordValue(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password (min 8 characters)
              </label>
              <div className="relative">
                <input
                  type={showResetPasswordValue ? 'text' : 'password'}
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowResetPasswordValue(!showResetPasswordValue)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  title={showResetPasswordValue ? 'Hide password' : 'Show password'}
                >
                  {showResetPasswordValue ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleResetPassword(resetUserId)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
              >
                Reset Password
              </button>
              <button
                onClick={() => {
                  setShowResetPassword(false);
                  setResetUserId(null);
                  setResetPasswordValue('');
                  setShowResetPasswordValue(false);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Backup Modal */}
      {showBackupRestore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Restore Database Backup</h3>
              </div>
              <button
                onClick={() => {
                  setShowBackupRestore(false);
                  setBackupData(null);
                  setBackupFile(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Backup File
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              {backupFile && (
                <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                  <span className="text-green-500">✓</span> {backupFile.name}
                </p>
              )}
            </div>

            {/* Backup Info */}
            {backupData && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="text-sm font-bold text-blue-900 mb-2">Backup Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-semibold">Version:</span>{' '}
                    <span className="text-blue-900">{backupData.version}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-semibold">Date:</span>{' '}
                    <span className="text-blue-900">
                      {new Date(backupData.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-sm text-blue-700 font-semibold mb-2">Records in backup:</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {Object.entries(backupData.counts || {}).map(([key, value]) => (
                      <div key={key} className="bg-white px-2 py-1 rounded">
                        <span className="text-gray-600">{key}:</span>{' '}
                        <span className="font-bold text-blue-900">{value as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Restore Mode Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Restore Mode
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Merge Option */}
                <div
                  onClick={() => setRestoreMode('merge')}
                  className={`cursor-pointer p-4 border-2 rounded-xl transition-all ${
                    restoreMode === 'merge'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        restoreMode === 'merge'
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {restoreMode === 'merge' && (
                        <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span
                      className={`font-bold ${
                        restoreMode === 'merge' ? 'text-green-900' : 'text-gray-700'
                      }`}
                    >
                      Merge
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Add backup data to existing records. Updates records with matching IDs.
                  </p>
                </div>

                {/* Overwrite Option */}
                <div
                  onClick={() => setRestoreMode('overwrite')}
                  className={`cursor-pointer p-4 border-2 rounded-xl transition-all ${
                    restoreMode === 'overwrite'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        restoreMode === 'overwrite'
                          ? 'border-red-500 bg-red-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {restoreMode === 'overwrite' && (
                        <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span
                      className={`font-bold ${
                        restoreMode === 'overwrite' ? 'text-red-900' : 'text-gray-700'
                      }`}
                    >
                      Overwrite
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    ⚠️ DELETE all existing data and replace with backup data.
                  </p>
                </div>
              </div>
            </div>

            {/* Warning */}
            {restoreMode === 'overwrite' && (
              <div className="mb-6 p-4 bg-red-100 border-2 border-red-300 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-900 mb-1">DANGER ZONE</p>
                    <p className="text-xs text-red-800">
                      Overwrite mode will permanently delete ALL existing data in the database before
                      importing the backup. This action cannot be undone. Make sure you have a recent
                      backup before proceeding.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleRestore}
                disabled={!backupData || isRestoring}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  restoreMode === 'overwrite'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                }`}
              >
                {isRestoring ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Restoring...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    {restoreMode === 'overwrite' ? 'Overwrite Database' : 'Merge with Database'}
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowBackupRestore(false);
                  setBackupData(null);
                  setBackupFile(null);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                disabled={isRestoring}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
