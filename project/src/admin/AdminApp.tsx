import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { NursesPage } from './pages/NursesPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StaffProvider } from './context/StaffContext';

const AdminRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="nurses" element={<NursesPage />} />
        <Route path="activity" element={<ActivityLogPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

export const AdminApp: React.FC = () => {
  return (
    <AuthProvider>
      <StaffProvider>
        <AdminRoutes />
      </StaffProvider>
    </AuthProvider>
  );
};

