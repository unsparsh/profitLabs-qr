import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../utils/api';

interface GoogleAccount {
  name: string;
  email: string;
  picture: string;
  businessName: string;
  businessId: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  googleAccount: GoogleAccount | null;
  isLoading: boolean;
  signInWithGoogle: (hotelId: string) => Promise<void>;
  signOut: () => void;
  checkAuthStatus: (hotelId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [googleAccount, setGoogleAccount] = useState<GoogleAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkAuthStatus = async (hotelId: string) => {
    try {
      setIsLoading(true);
      const authStatus = await apiClient.request(`/google-auth/status/${hotelId}`, {
        method: 'GET'
      }) as { authenticated: boolean; account?: GoogleAccount };
      
      if (authStatus.authenticated && authStatus.account) {
        setIsAuthenticated(true);
        setGoogleAccount(authStatus.account);
        // Store in localStorage for persistence
        localStorage.setItem('googleAuth', JSON.stringify({
          isAuthenticated: true,
          account: authStatus.account
        }));
      } else {
        setIsAuthenticated(false);
        setGoogleAccount(null);
        localStorage.removeItem('googleAuth');
      }
    } catch (error) {
      console.log('Not authenticated with Google');
      setIsAuthenticated(false);
      setGoogleAccount(null);
      localStorage.removeItem('googleAuth');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (hotelId: string) => {
    try {
      setIsLoading(true);
      
      // Get Google OAuth URL from backend
      const authUrl = await apiClient.request(`/google-auth/url/${hotelId}`, {
        method: 'GET',
      }) as { url: string };

      // Store the current location to return to after auth
      localStorage.setItem('authReturnUrl', window.location.pathname);
      
      // Redirect to Google OAuth in the same window
      window.location.href = authUrl.url;
      
    } catch (error: any) {
      console.error('Failed to initiate Google sign-in:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = () => {
    setIsAuthenticated(false);
    setGoogleAccount(null);
    localStorage.removeItem('googleAuth');
  };

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('googleAuth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.isAuthenticated && authData.account) {
          setIsAuthenticated(true);
          setGoogleAccount(authData.account);
        }
      } catch (error) {
        console.error('Failed to parse stored auth data:', error);
        localStorage.removeItem('googleAuth');
      }
    }
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    googleAccount,
    isLoading,
    signInWithGoogle,
    signOut,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};