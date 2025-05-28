import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { NursesPage } from './pages/NursesPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { StaffProvider } from './context/StaffContext';

function App() {
  return (
    <StaffProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <DashboardPage />
              </Layout>
            }
          />
          
          <Route
            path="/doctors"
            element={
              <Layout>
                <DoctorsPage />
              </Layout>
            }
          />
          
          <Route
            path="/nurses"
            element={
              <Layout>
                <NursesPage />
              </Layout>
            }
          />
          
          <Route
            path="/activity"
            element={
              <Layout>
                <ActivityLogPage />
              </Layout>
            }
          />
          
          <Route
            path="/settings"
            element={
              <Layout>
                <SettingsPage />
              </Layout>
            }
          />
          
          {/* Redirect any unknown paths to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StaffProvider>
  );
}

export default App;