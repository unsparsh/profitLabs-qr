import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import { AdminDashboard } from './components/admin/AdminDashboard';
import GuestPortal from './components/guest/GuestPortal';
import PricingPage from './components/auth/PricingPage';
import TermsAndConditions from './components/legal/TermsAndConditions';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import GoogleCallback from './components/auth/GoogleCallback';
import NotFound from './components/NotFound';

function App() {
  // Dummy data for compilation - in real app this would come from AuthContext
  const dummyUser = {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin' as const
  };

  const dummyHotel = {
    id: '1',
    name: 'Sample Hotel',
    address: '123 Main St',
    phone: '+1234567890',
    email: 'info@samplehotel.com'
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route 
                path="/admin" 
                element={<AdminDashboard user={dummyUser} hotel={dummyHotel} />} 
              />
              <Route path="/guest/:hotelId" element={<GuestPortal />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;