import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Clock, CheckCircle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface AnalyticsPanelProps {
  requests: any[];
  rooms: any[];
  hotel: any;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ 
  requests, 
  rooms, 
  hotel 
}) => {
  // Calculate statistics
  const totalRequests = requests.length;
  const completedRequests = requests.filter(r => r.status === 'completed').length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const activeRooms = rooms.filter(r => r.isActive).length;
  
  const completionRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;
  const avgResponseTime = '15 min'; // This would be calculated from actual data

  // Prepare data for charts
  const requestsByType = requests.reduce((acc, req) => {
    acc[req.type] = (acc[req.type] || 0) + 1;
    return acc;
  }, {});

  const typeData = Object.entries(requestsByType).map(([type, count]) => ({
    name: type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    value: count as number
  }));

  // Weekly requests data
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const weeklyData = weekDays.map(day => {
    const dayRequests = requests.filter(req => 
      format(new Date(req.createdAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    ).length;
    
    return {
      day: format(day, 'EEE'),
      requests: dayRequests
    };
  });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const stats = [
    {
      title: 'Total Requests',
      value: totalRequests,
      icon: TrendingUp,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Active Rooms',
      value: activeRooms,
      icon: Users,
      color: 'bg-green-500',
      change: `${activeRooms}/${rooms.length}`
    },
    {
      title: 'Avg Response Time',
      value: avgResponseTime,
      icon: Clock,
      color: 'bg-yellow-500',
      change: '-8%'
    },
    {
      title: 'Completion Rate',
      value: `${completionRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'bg-purple-500',
      change: '+5%'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{stat.title}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">{stat.change}</p>
              </div>
              <div className={`p-2 sm:p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Weekly Requests Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-4">Weekly Requests</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="requests" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Request Types Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-4">Request Types</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {requests.slice(0, 5).map((request) => (
            <div key={request._id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 gap-2 sm:gap-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    {request.type.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')} - Room {request.roomNumber}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(request.createdAt), 'MMM d, HH:mm')}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                request.status === 'completed' 
                  ? 'bg-green-100 text-green-800'
                  : request.status === 'in-progress'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};