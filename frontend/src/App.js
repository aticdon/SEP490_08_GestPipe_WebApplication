import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChangePassword from './pages/ChangePassword';
import CreateAdmin from './components/CreateAdmin';
import AdminList from './pages/AdminList';
import UserList from './pages/UserList';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';

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
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/change-password" element={<ChangePassword />} />
      
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
  );
}

export default App;
