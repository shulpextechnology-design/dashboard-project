import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import Helium10Page from './pages/Helium10Page';
import ExtensionPage from './pages/ExtensionPage';
import SettingsPage from './pages/SettingsPage';
import PlaceholderPage from './pages/PlaceholderPage';
import SidebarLayout from './components/SidebarLayout';
import { useAuth, AuthProvider } from './auth';

function PrivateRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0d1117',
        color: '#c9d1d9',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{
            border: '4px solid rgba(255,255,255,0.1)',
            borderTop: '4px solid #58a6ff',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Initialising secure session...</p>
          <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PrivateRoute>
            <SidebarLayout>
              <DashboardPage />
            </SidebarLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute role="admin">
            <SidebarLayout>
              <AdminPage />
            </SidebarLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <PrivateRoute>
            <SidebarLayout>
              <PlaceholderPage title="Transaction History" />
            </SidebarLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/subscribe"
        element={
          <PrivateRoute>
            <SidebarLayout>
              <PlaceholderPage title="Subscribe/Renew" />
            </SidebarLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <SidebarLayout>
              <SettingsPage />
            </SidebarLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/account-settings"
        element={
          <PrivateRoute>
            <SidebarLayout>
              <SettingsPage />
            </SidebarLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/help"
        element={
          <PrivateRoute>
            <SidebarLayout>
              <PlaceholderPage title="Help Desk" />
            </SidebarLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/faqs"
        element={
          <PrivateRoute>
            <SidebarLayout>
              <PlaceholderPage title="FAQs" />
            </SidebarLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/helium10"
        element={
          <PrivateRoute>
            <SidebarLayout>
              <Helium10Page />
            </SidebarLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/extension"
        element={
          <PrivateRoute>
            <SidebarLayout>
              <ExtensionPage />
            </SidebarLayout>
          </PrivateRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}


