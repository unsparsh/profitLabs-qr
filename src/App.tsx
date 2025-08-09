import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { AdminDashboard } from './components/admin/AdminDashboard';
import GuestPortal from './components/guest/GuestPortal';
import PricingPage from './components/auth/PricingPage';
import TermsAndConditions from './components/legal/TermsAndConditions';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import GoogleCallback from './components/auth/GoogleCallback';
import NotFound from './components/NotFound';

import { useParams } from 'react-router-dom';

// Guest Portal Wrapper to handle URL params
const GuestPortalWrapper: React.FC = () => {
  const { hotelId, roomId } = useParams<{ hotelId: string; roomId: string }>();
  return <GuestPortal hotelId={hotelId || ''} roomId={roomId || ''} />;
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// App Routes Component
const AppRoutes: React.FC = () => {
  const { user, hotel, logout } = useAuth();
  
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <AdminDashboard user={user!} hotel={hotel!} onLogout={logout} />
          </ProtectedRoute>
        } 
      />
      <Route path="/guest/:hotelId/:roomId" element={<GuestPortalWrapper />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/terms" element={<TermsAndConditions />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;