import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { GuestPortal } from './components/guest/GuestPortal';
import { apiClient } from './utils/api';

function App() {
  const [user, setUser] = useState<any>(null);
  const [hotel, setHotel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      apiClient.setToken(token);
      // Verify token and get user data
      // This would typically be done with a /auth/verify endpoint
    }
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = (userData: any, hotelData: any) => {
    setUser(userData);
    setHotel(hotelData);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    apiClient.setToken(null);
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
          {/* Guest Portal Route */}
          <Route 
            path="/guest/:hotelId/:roomId" 
            element={
              <GuestPortal 
                hotelId={window.location.pathname.split('/')[2]} 
                roomId={window.location.pathname.split('/')[3]} 
              />
            } 
          />
          
          {/* Admin Routes */}
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
          
          {/* Auth Routes */}
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;