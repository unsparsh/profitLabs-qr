import React, { createContext, useContext, useState, useEffect, ReactNode , useCallback} from 'react';
import { apiClient } from '../utils/api';
import toast from 'react-hot-toast';

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
  login: (user: any, token: string) => void; // <-- Add this line
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// interface AuthProviderProps {
//   children: ReactNode;
// }

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [googleAccount, setGoogleAccount] = useState<GoogleAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

const checkAuthStatus = useCallback(async (hotelId: string) => {
    if (!hotelId) return;
    
    setIsLoading(true);
    try {
      const response = await apiClient.request(`/google-auth/status/${hotelId}`, {
        method: 'GET'
      }) as { authenticated: boolean; account?: GoogleAccount };
      
      if (response.authenticated && response.account) {
        setIsAuthenticated(true);
        setGoogleAccount(response.account);
      } else {
        setIsAuthenticated(false);
        setGoogleAccount(null);
      }
    } catch (error: any) {
      console.error('Auth status check failed:', error);
      setIsAuthenticated(false);
      setGoogleAccount(null);
      
      // Only show error toast for non-404 errors (404 means not connected)
      if (!error.message?.includes('404') && !error.message?.includes('not connected')) {
        toast.error('Failed to check Google authentication status');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

 const signInWithGoogle = useCallback(async (hotelId: string) => {
    if (!hotelId) {
      throw new Error('Hotel ID is required');
    }

    setIsLoading(true);
    try {
      console.log('Getting Google auth URL for hotel:', hotelId);
      
      // Get Google OAuth URL
      const response = await apiClient.request(`/google-auth/url/${hotelId}`, {
        method: 'GET'
      }) as { url: string };
      
      if (!response.url) {
        throw new Error('Failed to get Google authentication URL');
      }
      
      console.log('Redirecting to Google OAuth:', response.url);
      
      // Redirect to Google OAuth
      window.location.href = response.url;
      
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setIsLoading(false);
      
      if (error.message?.includes('not configured')) {
        toast.error('Google OAuth is not configured on the server');
      } else {
        toast.error(error.message || 'Failed to initiate Google sign-in');
      }
      
      throw error;
    }
  }, []);

  const signOut = useCallback(() => {
    setIsAuthenticated(false);
    setGoogleAccount(null);
  }, []);

  // Add the login function
  const login = useCallback((user: any, token: string) => {
    setUser(user);
    setToken(token);
    setIsAuthenticated(true);
    localStorage.setItem('authToken', token);
    // Optionally, store user info if needed
  }, []);

  // // Load auth state from localStorage on mount
  // useEffect(() => {
  //   const storedAuth = localStorage.getItem('googleAuth');
  //   if (storedAuth) {
  //     try {
  //       const authData = JSON.parse(storedAuth);
  //       if (authData.isAuthenticated && authData.account) {
  //         setIsAuthenticated(true);
  //         setGoogleAccount(authData.account);
  //       }
  //     } catch (error) {
  //       console.error('Failed to parse stored auth data:', error);
  //       localStorage.removeItem('googleAuth');
  //     }
  //   }
  // }, []);

 const value: AuthContextType = {
    isAuthenticated,
    googleAccount,
    isLoading,
    signInWithGoogle,
    signOut,
    checkAuthStatus,
    login, // <-- Add this to the context value
  };
return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};