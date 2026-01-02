import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ProcessList } from './pages/ProcessList';
import { ProcessEditor } from './pages/ProcessEditor';
import { ProcessAnalyze } from './pages/ProcessAnalyze';
import { ProcessRecommendations } from './pages/ProcessRecommendations';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import Analytics from './pages/Analytics';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/processes"
            element={
              <ProtectedRoute>
                <ProcessList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/processes/new"
            element={
              <ProtectedRoute>
                <ProcessEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/processes/:id"
            element={
              <ProtectedRoute>
                <ProcessEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/processes/:id/edit"
            element={
              <ProtectedRoute>
                <ProcessEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/processes/:processId/analyze"
            element={
              <ProtectedRoute>
                <ProcessAnalyze />
              </ProtectedRoute>
            }
          />
          <Route
            path="/processes/:processId/recommendations"
            element={
              <ProtectedRoute>
                <ProcessRecommendations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
