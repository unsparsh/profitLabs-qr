import React, { useState, useEffect } from 'react';
import { Bell, Settings, Users, BarChart3, QrCode, LogOut } from 'lucide-react';
import { RequestsPanel } from './RequestsPanel';
import { RoomsPanel } from './RoomsPanel';
import { AnalyticsPanel } from './AnalyticsPanel';
import { SettingsPanel } from './SettingsPanel';
import { FoodMenuPanel } from './FoodMenuPanel';
import { apiClient } from '../../utils/api';
import { socketManager } from '../../utils/socket';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
interface AdminDashboardProps {
  user: any;
  hotel: any;
  onLogout: () => void;
}

type Request = {
  _id: string;
  type: string;
  roomNumber: string;
  // Add other fields as needed
};

type Room = {
  _id: string;
  // Add other fields as needed
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, hotel, onLogout }) => {
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState<Request[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken') ?? undefined;
    const socket = socketManager.connect(token);

    socket.on('connect', () => {
      socketManager.joinHotelRoom(hotel._id);
    });

    socket.on('newRequest', (request) => {
      setRequests(prev => [request, ...prev]);
      setUnreadCount(prev => prev + 1);

      // ✅ Play sound if enabled in settings
      if (hotel?.settings?.notifications?.sound) {
        const audio = new Audio('/sounds/bell.wav');
        audio.play().catch(() => {
          toast.success('🔔 New request received!');
        });
      } else {
        toast.success('🔔 New request received!');
      }

      toast.success(`📩 ${request.type.replace('-', ' ')} from Room ${request.roomNumber}`);
    });

    socket.on('requestUpdated', (updatedRequest) => {
      setRequests(prev =>
        prev.map(req => req._id === updatedRequest._id ? updatedRequest : req)
      );
    });

    fetchRequests();
    fetchRooms();

    return () => {
      socketManager.disconnect();
    };
  }, [hotel._id]);

  const fetchRequests = async () => {
    try {
      const data = await apiClient.getRequests(hotel._id);
      setRequests(data);
    } catch (error) {
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const data = await apiClient.getRooms(hotel._id);
      setRooms(data);
    } catch (error) {
      toast.error('Failed to load rooms');
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'requests') {
      setUnreadCount(0);
    }
  };

  const tabs = [
    { id: 'requests', label: 'Requests', icon: Bell, hasNotification: unreadCount > 0 },
    { id: 'rooms', label: 'Rooms', icon: QrCode, hasNotification: false },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, hasNotification: false },
    { id: 'food-menu', label: 'Food Menu', icon: Users, hasNotification: false },
    { id: 'settings', label: 'Settings', icon: Settings, hasNotification: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="bg-blue-600 text-white p-2 rounded-lg mr-3">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ProfitLabs</h1>
                <p className="text-sm text-gray-600">{hotel.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm relative
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.hasNotification && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'requests' && (
              <RequestsPanel
                requests={requests}
                onRequestUpdate={fetchRequests}
                hotelId={hotel._id}
              />
            )}
            {activeTab === 'rooms' && (
              <RoomsPanel
                rooms={rooms}
                onRoomsUpdate={fetchRooms}
                hotelId={hotel._id}
              />
            )}
            {activeTab === 'analytics' && (
              <AnalyticsPanel
                requests={requests}
                rooms={rooms}
                hotel={hotel}
              />
            )}
            {activeTab === 'food-menu' && (
              <FoodMenuPanel
                hotelId={hotel._id}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsPanel
                hotel={hotel}
                onHotelUpdate={(updatedHotel) => {
                  // Update hotel if needed
                }}
              />
            )}
          </>
        )}
      </div>
{/* <Link to="/pricing" className="text-indigo-600 hover:underline">View Plans</Link> */}
    </div>


  );
};
