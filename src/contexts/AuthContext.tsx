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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
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

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.login(email, password);
      setUser(res.user);
      setHotel('hotel' in res ? (res.hotel as Hotel) : null);
      localStorage.setItem('authToken', res.token);
      apiClient.setToken(res.token);
      toast.success('Login successful');
    } catch (error: any) {
      toast.error(error?.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setHotel(null);
    localStorage.removeItem('authToken');
    apiClient.setToken(null);
    toast.success('Logged out');
  };

  // Register function
  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await apiClient.register(data);
      setUser(res.user);
      setHotel(res.hotel);
      localStorage.setItem('authToken', res.token);
      apiClient.setToken(res.token);
      toast.success('Registration successful');
    } catch (error: any) {
      toast.error(error?.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Check auth status on mount
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
      // You may want to fetch user/hotel info here
      // For example, fetch hotel by user.hotelId
      // If you have an endpoint for this, use it here
      // Example:
      // const userInfo = await apiClient.getMe();
      // setUser(userInfo.user);
      // setHotel(userInfo.hotel);
      setIsLoading(false);
    } catch {
      setUser(null);
      setHotel(null);
      setIsLoading(false);
    }
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
