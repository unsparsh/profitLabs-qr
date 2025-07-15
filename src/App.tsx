import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { AdminDashboard } from './components/admin/AdminDashboard';
import GuestPortal from './components/guest/GuestPortal';
import PricingPage from './components/auth/PricingPage';
import { apiClient } from './utils/api';

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
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <Routes>
          {/* Guest Portal */}
          <Route path="/guest/:hotelId/:roomId" element={<GuestPortalWrapper />} />

          {/* Admin Portal */}
          <Route
            path="/admin"
            element={
              user && hotel ? (
                <AdminDashboard user={user} hotel={hotel} onLogout={handleLogout} />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />

          {/* Pricing Page */}
          <Route path="/pricing" element={<PricingPage />} />

          {/* Auth */}
          <Route
            path="/auth"
            element={
              user ? (
                <Navigate to="/admin" replace />
              ) : (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
              )
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/auth" replace />} />

          {/* Not Found */}
          <Route path="*" element={<div className="p-8 text-center text-red-500">404 | Page Not Found</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
