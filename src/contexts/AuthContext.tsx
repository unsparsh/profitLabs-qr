import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../utils/api';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  hotelId: string;
  subscriptionActive: 'Active' | 'Inactive';
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
  login: (email: string, password: string) => Promise<{ subscriptionActive: string }>;
  logout: () => void;
  register: (data: any) => Promise<{ subscriptionActive: string }>;
  checkAuthStatus: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = !!user && !!hotel;

  // Login — returns subscriptionActive so caller can redirect properly
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.login(email, password);
      setUser(res.user);
      setHotel('hotel' in res ? (res.hotel as Hotel) : null);
      localStorage.setItem('authToken', res.token);
      localStorage.setItem('userData', JSON.stringify(res.user));
      localStorage.setItem('hotelData', JSON.stringify(res.hotel));
      apiClient.setToken(res.token);
      toast.success('Login successful');
      return { subscriptionActive: res.user.subscriptionActive as string };
    } catch (error: any) {
      toast.error(error?.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    setHotel(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('hotelData');
    apiClient.setToken(null);
    toast.success('Logged out');
  };

  // Register — returns subscriptionActive so caller can redirect properly
  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await apiClient.register(data);
      setUser(res.user);
      setHotel(res.hotel);
      localStorage.setItem('authToken', res.token);
      localStorage.setItem('userData', JSON.stringify(res.user));
      localStorage.setItem('hotelData', JSON.stringify(res.hotel));
      apiClient.setToken(res.token);
      toast.success('Registration successful');
      return { subscriptionActive: res.user.subscriptionActive as string };
    } catch (error: any) {
      toast.error(error?.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh user state from localStorage (called after successful payment)
  const refreshUser = async () => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    const hotelData = localStorage.getItem('hotelData');
    if (token && userData && hotelData) {
      try {
        apiClient.setToken(token);
        setUser(JSON.parse(userData));
        setHotel(JSON.parse(hotelData));
      } catch {
        // ignore parse errors
      }
    }
  };

  // Rehydrate on page load from localStorage and API
  const checkAuthStatus = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUser(null);
      setHotel(null);
      setIsLoading(false);
      return;
    }
    
    apiClient.setToken(token);
    
    try {
      // Fetch fresh data from backend
      const res = await apiClient.getMe();
      setUser(res.user);
      setHotel(res.hotel);
      
      // Update local storage with fresh data
      localStorage.setItem('userData', JSON.stringify(res.user));
      localStorage.setItem('hotelData', JSON.stringify(res.hotel));
    } catch {
      // If API call fails (e.g., token expired), clear everything
      setUser(null);
      setHotel(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('hotelData');
      apiClient.setToken(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line
  }, []);

  const value: AuthContextType = {
    user,
    hotel,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    checkAuthStatus,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
