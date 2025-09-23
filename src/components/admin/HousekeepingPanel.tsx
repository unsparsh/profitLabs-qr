import React, { useState } from 'react';
import { Bed, CheckCircle, Clock, AlertCircle, User } from 'lucide-react';

interface HousekeepingPanelProps {
  hotelId: string;
}

export const HousekeepingPanel: React.FC<HousekeepingPanelProps> = ({ hotelId }) => {
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  // Mock housekeeping data
  const rooms = [
    {
      id: '101',
      number: '101',
      status: 'dirty',
      guestStatus: 'occupied',
      assignedTo: 'Maria Garcia',
      priority: 'high',
      lastCleaned: '2024-01-14',
      checkOutTime: '11:00 AM',
      nextCheckIn: '3:00 PM'
    },
    {
      id: '102',
      number: '102',
      status: 'clean',
      guestStatus: 'vacant',
      assignedTo: 'John Smith',
      priority: 'medium',
      lastCleaned: '2024-01-15',
      checkOutTime: null,
      nextCheckIn: '2:00 PM'
    },
    {
      id: '103',
      number: '103',
      status: 'in-progress',
      guestStatus: 'vacant',
      assignedTo: 'Sarah Johnson',
      priority: 'high',
      lastCleaned: '2024-01-13',
      checkOutTime: '10:30 AM',
      nextCheckIn: '4:00 PM'
    },
    {
      id: '104',
      number: '104',
      status: 'maintenance',
      guestStatus: 'out-of-order',
      assignedTo: 'Mike Wilson',
      priority: 'high',
      lastCleaned: '2024-01-12',
      checkOutTime: null,
      nextCheckIn: null
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clean':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'dirty':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'clean':
        return <CheckCircle className="h-4 w-4" />;
      case 'dirty':
        return <AlertCircle className="h-4 w-4" />;
      case 'in-progress':
        return <Clock className="h-4 w-4" />;
      case 'maintenance':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const updateRoomStatus = (roomId: string, newStatus: string) => {
    // Handle status update
    console.log('Updating room', roomId, 'to status', newStatus);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bed className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Housekeeping</h2>
          <p className="text-gray-600 dark:text-gray-300">Manage room cleaning and maintenance status</p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Clean</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {rooms.filter(r => r.status === 'clean').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Dirty</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {rooms.filter(r => r.status === 'dirty').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">In Progress</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {rooms.filter(r => r.status === 'in-progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Maintenance</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {rooms.filter(r => r.status === 'maintenance').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border-2 cursor-pointer transition-all ${
              selectedRoom?.id === room.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => setSelectedRoom(room)}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Room {room.number}</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                {getStatusIcon(room.status)}
                {room.status}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Guest Status:</span>
                <span className="font-medium text-gray-900 dark:text-white">{room.guestStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Assigned to:</span>
                <span className="font-medium text-gray-900 dark:text-white">{room.assignedTo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Last Cleaned:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(room.lastCleaned).toLocaleDateString()}
                </span>
              </div>
              {room.checkOutTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Check-out:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{room.checkOutTime}</span>
                </div>
              )}
              {room.nextCheckIn && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Next Check-in:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{room.nextCheckIn}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              {room.status === 'dirty' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateRoomStatus(room.id, 'in-progress');
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  Start Cleaning
                </button>
              )}
              {room.status === 'in-progress' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateRoomStatus(room.id, 'clean');
                  }}
                  className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                >
                  Mark Clean
                </button>
              )}
              {room.status === 'clean' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateRoomStatus(room.id, 'dirty');
                  }}
                  className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                >
                  Mark Dirty
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};