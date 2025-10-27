import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { LanguageProvider } from './utils/LanguageContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChangePassword from './pages/ChangePassword';
import CreateAdmin from './pages/CreateAdmin';
import AdminList from './pages/AdminList';
import UserList from './pages/UserList';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import ForgotPassword from './pages/ForgotPassword';

// Protected Route Component for Role-Based Access
const ProtectedRoute = ({ children, allowedRoles }) => {
  const admin = JSON.parse(localStorage.getItem('admin') || '{}');
  const token = localStorage.getItem('token');

  if (!token || !admin.role) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(admin.role)) {
    // Redirect to correct dashboard based on role
    if (admin.role === 'superadmin') {
      return <Navigate to="/dashboard" replace />;
    } else if (admin.role === 'admin') {
      return <Navigate to="/user-list" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* SuperAdmin Only Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-list" 
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <AdminList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-admin" 
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <CreateAdmin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/edit-profile" 
              element={
                <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <EditProfile />
                </ProtectedRoute>
              } 
            />

            {/* Admin Only Routes */}
            <Route 
              path="/user-list" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserList />
                </ProtectedRoute>
              } 
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </LanguageProvider>
    </I18nextProvider>
  );
}

export default App;
