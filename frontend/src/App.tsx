import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ProcessList } from './pages/ProcessList';
import { ProcessEditor } from './pages/ProcessEditor';
import Settings from './pages/Settings';
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
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
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
