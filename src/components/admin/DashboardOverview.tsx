import React from 'react';
import { 
  Users, 
  Bed, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface DashboardOverviewProps {
  requests: any[];
  rooms: any[];
  hotel: any;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ 
  requests, 
  rooms, 
  hotel 
}) => {
  const totalRooms = rooms.length;
  const occupiedRooms = Math.floor(totalRooms * 0.7); // Mock data
  const availableRooms = totalRooms - occupiedRooms;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const completedRequests = requests.filter(r => r.status === 'completed').length;

  const stats = [
    {
      title: 'Total Rooms',
      value: totalRooms,
      icon: Bed,
      color: 'bg-blue-500',
      change: '+2%'
    },
    {
      title: 'Occupied Rooms',
      value: occupiedRooms,
      icon: Users,
      color: 'bg-green-500',
      change: '+12%'
    },
    {
      title: 'Available Rooms',
      value: availableRooms,
      icon: Bed,
      color: 'bg-yellow-500',
      change: '-8%'
    },
    {
      title: 'Pending Requests',
      value: pendingRequests,
      icon: Clock,
      color: 'bg-orange-500',
      change: '+5%'
    },
    {
      title: 'Completed Today',
      value: completedRequests,
      icon: CheckCircle,
      color: 'bg-purple-500',
      change: '+15%'
    },
    {
      title: 'Revenue Today',
      value: '₹45,230',
      icon: DollarSign,
      color: 'bg-indigo-500',
      change: '+8%'
    }
  ];

  const roomStatusData = [
    { status: 'Occupied', count: occupiedRooms, color: 'bg-blue-500' },
    { status: 'Available', count: availableRooms, color: 'bg-green-500' },
    { status: 'Maintenance', count: 1, color: 'bg-yellow-500' },
    { status: 'Out of Order', count: 0, color: 'bg-red-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
            <p className="text-blue-100">
              Here's what's happening at {hotel.name} today
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{new Date().getDate()}</p>
            <p className="text-blue-100">
              {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Room Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Room Status Overview</h3>
          <div className="space-y-4">
            {roomStatusData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-gray-700 dark:text-gray-300">{item.status}</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {requests.slice(0, 5).map((request, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Room {request.roomNumber} - {request.type.replace('-', ' ')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(request.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  request.status === 'completed' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : request.status === 'in-progress'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Check In Guest</p>
          </button>
          <button className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
            <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-600 dark:text-green-400">Process Payment</p>
          </button>
          <button className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
            <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">New Booking</p>
          </button>
          <button className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
            <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">View Reports</p>
          </button>
        </div>
      </div>
    </div>
  );
};