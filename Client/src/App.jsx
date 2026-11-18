import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ApartmentRegistry from './pages/ApartmentRegistry/ApartmentRegistry';
import Overview from './pages/Overview/Overview';
import DocumentRepository from './pages/DocumentRepository/DocumentRepository';
import ResidentManagementView from './pages/ResidentManagement/ResidentManagementView';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={loadingStyles}>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Verifying session...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="apartments" element={<ApartmentRegistry />} />
            <Route path="residents" element={<ResidentManagementView />} />
            <Route path="documents" element={<DocumentRepository />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

const loadingStyles = {
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'var(--bg-canvas)',
};

export default App;
