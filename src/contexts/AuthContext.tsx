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
  const [isLoading, setIsLoading] = useState(true);

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