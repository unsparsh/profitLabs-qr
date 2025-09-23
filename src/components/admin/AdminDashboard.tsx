import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Settings, 
  Users, 
  BarChart3, 
  QrCode, 
  LogOut,
  Home,
  MapPin,
  CreditCard,
  DoorOpen,
  Bed,
  FileText,
  Wrench,
  Calendar,
  Utensils,
  ShoppingCart,
  TrendingUp,
  Package,
  Wifi,
  ChevronRight,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { RequestsPanel } from './RequestsPanel';
import { RoomsPanel } from './RoomsPanel';
import { AnalyticsPanel } from './AnalyticsPanel';
import { SettingsPanel } from './SettingsPanel';
import { FoodMenuPanel } from './FoodMenuPanel';
import { RoomServiceMenuPanel } from './RoomServiceMenuPanel';
import { ComplaintMenuPanel } from './ComplaintMenuPanel';
import { AIAssistantPanel } from './AIAssistantPanel';
import { CredentialTestPanel } from './CredentialTestPanel';
import { DashboardOverview } from './DashboardOverview';
import { PositionCheckIn } from './PositionCheckIn';
import { TransactionPanel } from './TransactionPanel';
import { CheckOutPanel } from './CheckOutPanel';
import { HousekeepingPanel } from './HousekeepingPanel';
import { ReportsPanel } from './ReportsPanel';
import { UtilityPanel } from './UtilityPanel';
import { AdvanceBookingPanel } from './AdvanceBookingPanel';
import { BanquetPanel } from './BanquetPanel';
import { POSPanel } from './POSPanel';
import { POSReportsPanel } from './POSReportsPanel';
import { MaterialManagementPanel } from './MaterialManagementPanel';
import { ChannelManagerPanel } from './ChannelManagerPanel';
import { apiClient } from '../../utils/api';
import { socketManager } from '../../utils/socket';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';

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

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  hasSubmenu?: boolean;
  submenu?: SidebarItem[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, hotel, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [requests, setRequests] = useState<Request[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { theme } = useTheme();

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
    },
    {
      id: 'position-check-in',
      label: 'Position/Check In',
      icon: MapPin,
    },
    {
      id: 'transaction',
      label: 'Transaction',
      icon: CreditCard,
      hasSubmenu: true,
      submenu: [
        { id: 'all-transactions', label: 'All Transactions', icon: CreditCard },
        { id: 'pending-payments', label: 'Pending Payments', icon: CreditCard },
        { id: 'completed-payments', label: 'Completed Payments', icon: CreditCard },
      ]
    },
    {
      id: 'check-out',
      label: 'Check Out',
      icon: DoorOpen,
    },
    {
      id: 'housekeeping',
      label: 'Housekeeping',
      icon: Bed,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      hasSubmenu: true,
      submenu: [
        { id: 'occupancy-reports', label: 'Occupancy Reports', icon: FileText },
        { id: 'revenue-reports', label: 'Revenue Reports', icon: FileText },
        { id: 'guest-reports', label: 'Guest Reports', icon: FileText },
      ]
    },
    {
      id: 'utility',
      label: 'Utility',
      icon: Wrench,
      hasSubmenu: true,
      submenu: [
        { id: 'maintenance', label: 'Maintenance', icon: Wrench },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'utilities', label: 'Utilities', icon: Wrench },
      ]
    },
    {
      id: 'advance-booking',
      label: 'Advance Booking',
      icon: Calendar,
    },
    {
      id: 'banquet',
      label: 'Banquet',
      icon: Utensils,
      hasSubmenu: true,
      submenu: [
        { id: 'banquet-bookings', label: 'Banquet Bookings', icon: Utensils },
        { id: 'banquet-menu', label: 'Banquet Menu', icon: Utensils },
        { id: 'banquet-reports', label: 'Banquet Reports', icon: FileText },
      ]
    },
    {
      id: 'pos',
      label: 'POS',
      icon: ShoppingCart,
    },
    {
      id: 'pos-reports',
      label: 'POS Reports',
      icon: TrendingUp,
      hasSubmenu: true,
      submenu: [
        { id: 'daily-sales', label: 'Daily Sales', icon: TrendingUp },
        { id: 'monthly-sales', label: 'Monthly Sales', icon: TrendingUp },
        { id: 'product-reports', label: 'Product Reports', icon: TrendingUp },
      ]
    },
    {
      id: 'material-management',
      label: 'Material Management',
      icon: Package,
      hasSubmenu: true,
      submenu: [
        { id: 'inventory-management', label: 'Inventory Management', icon: Package },
        { id: 'purchase-orders', label: 'Purchase Orders', icon: Package },
        { id: 'suppliers', label: 'Suppliers', icon: Package },
      ]
    },
    {
      id: 'channel-manager',
      label: 'Channel Manager',
      icon: Wifi,
      hasSubmenu: true,
      submenu: [
        { id: 'booking-channels', label: 'Booking Channels', icon: Wifi },
        { id: 'rate-management', label: 'Rate Management', icon: Wifi },
        { id: 'availability', label: 'Availability', icon: Wifi },
      ]
    },
    // Original tabs as submenu items
    {
      id: 'requests',
      label: 'Guest Requests',
      icon: Bell,
    },
    {
      id: 'rooms',
      label: 'Rooms & QR',
      icon: QrCode,
    },
    {
      id: 'ai-assistant',
      label: 'AI Assistant',
      icon: Users,
    },
    {
      id: 'food-menu',
      label: 'Food Menu',
      icon: Utensils,
    },
    {
      id: 'room-service-menu',
      label: 'Room Service',
      icon: Settings,
    },
    {
      id: 'complaint-menu',
      label: 'Complaints',
      icon: Users,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  useEffect(() => {
    const token = localStorage.getItem('authToken') ?? undefined;
    const socket = socketManager.connect(token);

    socket.on('connect', () => {
      socketManager.joinHotelRoom(hotel._id);
    });

    socket.on('newRequest', (request) => {
      setRequests(prev => [request, ...prev]);
      setUnreadCount(prev => prev + 1);

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
    
    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
    });
    
    socket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket.IO disconnected:', reason);
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
    setIsMobileSidebarOpen(false);
  };

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const renderSidebarItem = (item: SidebarItem, level: number = 0) => {
    const isActive = activeTab === item.id;
    const isExpanded = expandedMenus.includes(item.id);
    const hasNotification = item.id === 'requests' && unreadCount > 0;

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (item.hasSubmenu) {
              toggleSubmenu(item.id);
            } else {
              handleTabChange(item.id);
            }
          }}
          className={`
            w-full flex items-center justify-between px-3 py-2.5 text-left rounded-lg transition-all duration-200 group
            ${level > 0 ? 'ml-4 text-sm' : 'text-sm'}
            ${isActive
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
        >
          <div className="flex items-center space-x-3">
            <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
            {!sidebarCollapsed && (
              <span className="font-medium truncate">{item.label}</span>
            )}
            {hasNotification && !sidebarCollapsed && (
              <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          {item.hasSubmenu && !sidebarCollapsed && (
            <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
        </button>
        
        {item.hasSubmenu && isExpanded && !sidebarCollapsed && item.submenu && (
          <div className="mt-1 space-y-1">
            {item.submenu.map(subItem => renderSidebarItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview requests={requests} rooms={rooms} hotel={hotel} />;
      case 'position-check-in':
        return <PositionCheckIn hotel={hotel} />;
      case 'transaction':
      case 'all-transactions':
      case 'pending-payments':
      case 'completed-payments':
        return <TransactionPanel hotelId={hotel._id} activeView={activeTab} />;
      case 'check-out':
        return <CheckOutPanel hotel={hotel} />;
      case 'housekeeping':
        return <HousekeepingPanel hotelId={hotel._id} />;
      case 'reports':
      case 'occupancy-reports':
      case 'revenue-reports':
      case 'guest-reports':
        return <ReportsPanel hotelId={hotel._id} activeView={activeTab} />;
      case 'utility':
      case 'maintenance':
      case 'inventory':
      case 'utilities':
        return <UtilityPanel hotelId={hotel._id} activeView={activeTab} />;
      case 'advance-booking':
        return <AdvanceBookingPanel hotel={hotel} />;
      case 'banquet':
      case 'banquet-bookings':
      case 'banquet-menu':
      case 'banquet-reports':
        return <BanquetPanel hotelId={hotel._id} activeView={activeTab} />;
      case 'pos':
        return <POSPanel hotelId={hotel._id} />;
      case 'pos-reports':
      case 'daily-sales':
      case 'monthly-sales':
      case 'product-reports':
        return <POSReportsPanel hotelId={hotel._id} activeView={activeTab} />;
      case 'material-management':
      case 'inventory-management':
      case 'purchase-orders':
      case 'suppliers':
        return <MaterialManagementPanel hotelId={hotel._id} activeView={activeTab} />;
      case 'channel-manager':
      case 'booking-channels':
      case 'rate-management':
      case 'availability':
        return <ChannelManagerPanel hotelId={hotel._id} activeView={activeTab} />;
      case 'requests':
        return (
          <RequestsPanel
            requests={requests}
            onRequestUpdate={fetchRequests}
            hotelId={hotel._id}
          />
        );
      case 'rooms':
        return (
          <RoomsPanel
            rooms={rooms}
            onRoomsUpdate={fetchRooms}
            hotelId={hotel._id}
          />
        );
      case 'analytics':
        return (
          <AnalyticsPanel
            requests={requests}
            rooms={rooms}
            hotel={hotel}
          />
        );
      case 'ai-assistant':
        return <AIAssistantPanel hotelId={hotel._id} />;
      case 'food-menu':
        return <FoodMenuPanel hotelId={hotel._id} />;
      case 'room-service-menu':
        return <RoomServiceMenuPanel hotelId={hotel._id} />;
      case 'complaint-menu':
        return <ComplaintMenuPanel hotelId={hotel._id} />;
      case 'settings':
        return (
          <SettingsPanel
            hotel={hotel}
            onHotelUpdate={(updatedHotel) => {
              // Update hotel if needed
            }}
          />
        );
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {sidebarItems.find(item => item.id === activeTab)?.label || 'Coming Soon'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              This feature is under development and will be available soon.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 dark:bg-blue-700 text-white p-2 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">ProfitLabs</h1>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{hotel.name}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden lg:block"
          >
            <Menu className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
          >
            <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {sidebarItems.map(item => renderSidebarItem(item))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && (
            <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              <p className="font-medium">{user.name}</p>
              <p>{user.role}</p>
            </div>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {!sidebarCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
          <div className="px-4 lg:px-6">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
                >
                  <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {sidebarItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Hotel Demo Indore • {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <ThemeToggle size="sm" />
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};