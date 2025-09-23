import React, { useState } from 'react';
import { Wifi, Globe, DollarSign, Calendar, TrendingUp, Settings } from 'lucide-react';

interface ChannelManagerPanelProps {
  hotelId: string;
  activeView: string;
}

export const ChannelManagerPanel: React.FC<ChannelManagerPanelProps> = ({ hotelId, activeView }) => {
  const [selectedChannel, setSelectedChannel] = useState<string>('');

  // Mock data for channel management
  const bookingChannels = [
    {
      id: '1',
      name: 'Booking.com',
      logo: '🏨',
      status: 'connected',
      commission: 15,
      bookings: 45,
      revenue: 125000,
      lastSync: '2024-01-15 10:30 AM'
    },
    {
      id: '2',
      name: 'Expedia',
      logo: '✈️',
      status: 'connected',
      commission: 18,
      bookings: 32,
      revenue: 98000,
      lastSync: '2024-01-15 09:45 AM'
    },
    {
      id: '3',
      name: 'Agoda',
      logo: '🌐',
      status: 'disconnected',
      commission: 12,
      bookings: 0,
      revenue: 0,
      lastSync: 'Never'
    },
    {
      id: '4',
      name: 'MakeMyTrip',
      logo: '🇮🇳',
      status: 'connected',
      commission: 20,
      bookings: 28,
      revenue: 75000,
      lastSync: '2024-01-15 11:15 AM'
    }
  ];

  const roomTypes = [
    {
      id: '1',
      name: 'Standard Room',
      baseRate: 2500,
      channels: {
        'booking': { rate: 2750, availability: 5 },
        'expedia': { rate: 2800, availability: 5 },
        'agoda': { rate: 2700, availability: 0 },
        'mmt': { rate: 2900, availability: 3 }
      }
    },
    {
      id: '2',
      name: 'Deluxe Room',
      baseRate: 3500,
      channels: {
        'booking': { rate: 3850, availability: 3 },
        'expedia': { rate: 3900, availability: 3 },
        'agoda': { rate: 3750, availability: 0 },
        'mmt': { rate: 4000, availability: 2 }
      }
    },
    {
      id: '3',
      name: 'Suite',
      baseRate: 5000,
      channels: {
        'booking': { rate: 5500, availability: 2 },
        'expedia': { rate: 5600, availability: 2 },
        'agoda': { rate: 5400, availability: 0 },
        'mmt': { rate: 5800, availability: 1 }
      }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'disconnected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'syncing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const renderChannelsView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Connected Channels</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {bookingChannels.filter(c => c.status === 'connected').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {bookingChannels.reduce((sum, channel) => sum + channel.bookings, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Channel Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{(bookingChannels.reduce((sum, channel) => sum + channel.revenue, 0) / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Avg Commission</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(bookingChannels.reduce((sum, channel) => sum + channel.commission, 0) / bookingChannels.length)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bookingChannels.map((channel) => (
          <div key={channel.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{channel.logo}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{channel.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Commission: {channel.commission}%</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(channel.status)}`}>
                {channel.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Bookings</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{channel.bookings}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Revenue</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">₹{(channel.revenue / 1000).toFixed(0)}K</p>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
              <span>Last Sync: {channel.lastSync}</span>
              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRateManagementView = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rate Management</h3>
          <p className="text-gray-600 dark:text-gray-300">Manage rates across all booking channels</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Room Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Base Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Booking.com</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Expedia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Agoda</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">MakeMyTrip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {roomTypes.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{room.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">₹{room.baseRate}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">₹{room.channels.booking.rate}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">₹{room.channels.expedia.rate}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">₹{room.channels.agoda.rate} (Offline)</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">₹{room.channels.mmt.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAvailabilityView = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Availability Management</h3>
          <p className="text-gray-600 dark:text-gray-300">Manage room availability across all channels</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Room Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Rooms</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Booking.com</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Expedia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Agoda</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">MakeMyTrip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {roomTypes.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{room.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">10</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      room.channels.booking.availability > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {room.channels.booking.availability} available
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      room.channels.expedia.availability > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {room.channels.expedia.availability} available
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Offline
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      room.channels.mmt.availability > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {room.channels.mmt.availability} available
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'booking-channels':
        return renderChannelsView();
      case 'rate-management':
        return renderRateManagementView();
      case 'availability':
        return renderAvailabilityView();
      default:
        return renderChannelsView();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wifi className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {activeView === 'booking-channels' ? 'Booking Channels' :
             activeView === 'rate-management' ? 'Rate Management' :
             activeView === 'availability' ? 'Availability Management' : 'Channel Manager'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">Manage online booking channels and distribution</p>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};