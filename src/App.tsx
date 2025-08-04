import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { AdminDashboard } from './components/admin/AdminDashboard';
import GuestPortal from './components/guest/GuestPortal';
import  PricingPage  from './components/auth/PricingPage';
import GoogleCallback from './components/auth/GoogleCallback';
import TermsAndConditions from './components/legal/TermsAndConditions';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import { AuthProvider } from './contexts/AuthContext';
import { apiClient } from './utils/api';
import NotFound from "./components/NotFound";


type User = any;
type Hotel = any;

function GuestPortalWrapper() {
  const { hotelId, roomId } = useParams<{ hotelId: string; roomId: string }>();
  
  // Debug logging
  console.log('GuestPortalWrapper params:', { hotelId, roomId });
  
  // Ensure we have valid parameters
  if (!hotelId || !roomId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg font-semibold">Invalid Room Access</p>
          <p className="text-gray-600">Please scan the QR code again</p>
        </div>
      </div>
    );
  }
  
  return <GuestPortal hotelId={hotelId!} roomId={roomId!} />;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing token
        const token = localStorage.getItem('authToken');
        if (token) {
          apiClient.setToken(token);
          
          // Try to get stored user and hotel data
          const storedUser = localStorage.getItem('userData');
          const storedHotel = localStorage.getItem('hotelData');
          
          if (storedUser && storedHotel) {
            // Restore from localStorage
            setUser(JSON.parse(storedUser));
            setHotel(JSON.parse(storedHotel));
          }
          
          // Optional: Verify token with backend (if you have a verify endpoint)
          // const response = await apiClient.verifyToken();
          // if (!response.valid) {
          //   handleLogout();
          // }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        handleLogout(); // Clear invalid data
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleAuthSuccess = (userData: User, hotelData: Hotel) => {
    // Store in state
    setUser(userData);
    setHotel(hotelData);
    
    // Store in localStorage
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('hotelData', JSON.stringify(hotelData));
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('hotelData');
    
    // Clear API client token
    apiClient.setToken(null);
    
    // Clear state
    setUser(null);
    setHotel(null);
  };

  if (isLoading) {
    //Loading Animation
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

return (
  <AuthProvider>
    <Router>
      <Routes>
        {/* Authentication Routes */}
        <Route 
          path="/auth" 
          element={
            user && hotel ? (
              <Navigate to="/admin" replace />
            ) : (
              <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
                <div className="w-full max-w-md">
                  <Toaster position="top-right" />
                  {authMode === 'login' ? (
                    <LoginForm 
                      onSuccess={handleAuthSuccess}
                      onSwitchToRegister={() => setAuthMode('register')}
                    />
                  ) : (
                    <RegisterForm 
                      onSuccess={handleAuthSuccess}
                      onSwitchToLogin={() => setAuthMode('login')}
                    />
                  )}
                </div>
              </div>
            )
          } 
        />
        
        {/* Admin Dashboard */}
        <Route 
          path="/admin" 
          element={
            user && hotel ? (
              <AdminDashboard 
                user={user} 
                hotel={hotel} 
                onLogout={handleLogout} 
              />
            ) : (
              <Navigate to="/auth" replace />
            )
          } 
        />
        
        {/* Guest Portal */}
        <Route path="/guest/:hotelId/:roomId" element={<GuestPortalWrapper />} />
        
        {/* Google OAuth Callback */}
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        
        {/* Pricing Page */}
        <Route path="/pricing" element={<PricingPage />} />
        
        {/* Legal Pages */}
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        
        {/* Root redirect */}
        <Route 
          path="/" 
          element={
            user && hotel ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/auth" replace />
            )
          } 
        />
        
        {/* 404 Page */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
              <div className="text-center">
                <div className="relative mb-8">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                    <svg
                      className="w-16 h-16 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-400 rounded-full animate-pulse delay-300"></div>
                </div>

                <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
                  404
                </h1>

                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Page Not Found
                </h2>

                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  The page you're looking for doesn't exist or has been moved to a different location.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => window.history.back()}
                    className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Go Back
                  </button>

                  <a
                    href="/"
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    Go Home
                  </a>
                </div>

                <div className="mt-12 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl max-w-md mx-auto">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Need Help?</h3>
                  <p className="text-gray-600 text-sm">
                    Contact our support team at{' '}
                    <a href="mailto:support@profitlabs.com" className="text-blue-600 hover:underline">
                      support@profitlabs.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          }
        />
      </Routes>
      <Toaster position="top-right" />
    </Router>
  </AuthProvider>
);

}

export default App;
