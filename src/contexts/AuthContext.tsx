import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../utils/api';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  hotelId: string;
}

interface Hotel {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalRooms: number;
  subscription: {
    plan: 'trial' | 'basic' | 'premium';
    status: 'active' | 'inactive' | 'canceled';
    expiresAt: Date;
  };
  settings: any;
}

interface AuthContextType {
  user: User | null;
  hotel: Hotel | null;
  isAuthenticated: boolean;
  isLoading: boolean;
<<<<<<< HEAD
  signInWithGoogle: (hotelId: string) => Promise<void>;
  signOut: () => void;
  checkAuthStatus: (hotelId: string) => Promise<void>;
  login: (user: any, token: string) => void; // <-- Add this line
=======
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<void>;
>>>>>>> 376a3be38d55843edc381e388a07a55d32d808ac
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

<<<<<<< HEAD
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [googleAccount, setGoogleAccount] = useState<GoogleAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
=======
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
>>>>>>> 376a3be38d55843edc381e388a07a55d32d808ac

  const isAuthenticated = !!user && !!hotel;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      apiClient.setToken(token);
      
      // Try to get current user info
      const response = await apiClient.request('/auth/me', { method: 'GET' });
      
      if (response.user && response.hotel) {
        setUser(response.user);
        setHotel(response.hotel);
      } else {
        // Invalid token, clear it
        localStorage.removeItem('authToken');
        apiClient.setToken(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
      apiClient.setToken(null);
    } finally {
      setIsLoading(false);
    }
<<<<<<< HEAD
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
=======
>>>>>>> 376a3be38d55843edc381e388a07a55d32d808ac
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.login(email, password);
      
      if (response.token && response.user) {
        apiClient.setToken(response.token);
        setUser(response.user);
        
        // Fetch hotel data
        if (response.user.hotelId) {
          const hotelData = await apiClient.getHotel(response.user.hotelId);
          setHotel(hotelData);
        }
        
        toast.success('Login successful!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    try {
      setIsLoading(true);
      const response = await apiClient.register(data);
      
      if (response.token && response.user && response.hotel) {
        apiClient.setToken(response.token);
        setUser(response.user);
        setHotel(response.hotel);
        toast.success('Registration successful! Welcome to ProfitLabs!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    apiClient.setToken(null);
    setUser(null);
    setHotel(null);
    toast.success('Logged out successfully');
  };

  const value: AuthContextType = {
    user,
    hotel,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};