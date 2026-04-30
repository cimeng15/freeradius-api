import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Layout from './components/Layout';
import StaffLogin from './pages/StaffLogin';
import ClientLogin from './pages/ClientLogin';
import Dashboard from './pages/Dashboard';
import ClientDashboard from './pages/ClientDashboard';
import Packages from './pages/Packages';
import Clients from './pages/Clients';
import Routers from './pages/Routers';
import Vouchers from './pages/Vouchers';
import Staff from './pages/Staff';
import Monitoring from './pages/Monitoring';
import Settings from './pages/Settings';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <Layout>{children}</Layout>;
}

// Smart Dashboard: shows ClientDashboard for client role, regular Dashboard for others
function SmartDashboard() {
  const { user } = useAuth();
  if (user?.role === 'client') return <ClientDashboard />;
  return <Dashboard />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><StaffLogin /></PublicRoute>} />
            <Route path="/client-login" element={<PublicRoute><ClientLogin /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><SmartDashboard /></ProtectedRoute>} />
            <Route path="/packages" element={<ProtectedRoute roles={['superadmin', 'noc']}><Packages /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute roles={['superadmin', 'noc']}><Clients /></ProtectedRoute>} />
            <Route path="/routers" element={<ProtectedRoute roles={['superadmin', 'noc']}><Routers /></ProtectedRoute>} />
            <Route path="/vouchers" element={<ProtectedRoute roles={['superadmin', 'reseller']}><Vouchers /></ProtectedRoute>} />
            <Route path="/staff" element={<ProtectedRoute roles={['superadmin']}><Staff /></ProtectedRoute>} />
            <Route path="/monitoring" element={<ProtectedRoute roles={['superadmin', 'noc']}><Monitoring /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute roles={['superadmin']}><Settings /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
