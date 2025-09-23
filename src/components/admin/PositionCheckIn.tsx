import React, { useState } from 'react';
import { MapPin, Users, Calendar, Phone, Mail, CreditCard } from 'lucide-react';

interface PositionCheckInProps {
  hotel: any;
}

export const PositionCheckIn: React.FC<PositionCheckInProps> = ({ hotel }) => {
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [guestDetails, setGuestDetails] = useState({
    name: '',
    email: '',
    phone: '',
    idType: 'passport',
    idNumber: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: '',
    adults: 1,
    children: 0
  });

  const rooms = [
    { id: '101', number: '101', type: 'Standard', status: 'available', rate: 2500 },
    { id: '102', number: '102', type: 'Deluxe', status: 'available', rate: 3500 },
    { id: '103', number: '103', type: 'Suite', status: 'occupied', rate: 5000 },
    { id: '104', number: '104', type: 'Standard', status: 'maintenance', rate: 2500 },
    { id: '105', number: '105', type: 'Deluxe', status: 'available', rate: 3500 },
  ];

  const handleCheckIn = () => {
    // Handle check-in logic
    console.log('Check-in details:', { selectedRoom, guestDetails });
  };

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'occupied':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Position/Check In</h2>
          <p className="text-gray-600 dark:text-gray-300">Manage guest check-ins and room assignments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Room</h3>
          <div className="grid grid-cols-2 gap-3">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => room.status === 'available' && setSelectedRoom(room.id)}
                disabled={room.status !== 'available'}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedRoom === room.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : room.status === 'available'
                    ? 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    : 'border-gray-200 dark:border-gray-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="text-left">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">Room {room.number}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoomStatusColor(room.status)}`}>
                      {room.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{room.type}</p>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">₹{room.rate}/night</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Guest Details Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Guest Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Guest Name *
              </label>
              <input
                type="text"
                value={guestDetails.name}
                onChange={(e) => setGuestDetails({ ...guestDetails, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter guest name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={guestDetails.email}
                  onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="guest@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={guestDetails.phone}
                  onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID Type
                </label>
                <select
                  value={guestDetails.idType}
                  onChange={(e) => setGuestDetails({ ...guestDetails, idType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="passport">Passport</option>
                  <option value="aadhar">Aadhar Card</option>
                  <option value="driving">Driving License</option>
                  <option value="voter">Voter ID</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID Number *
                </label>
                <input
                  type="text"
                  value={guestDetails.idNumber}
                  onChange={(e) => setGuestDetails({ ...guestDetails, idNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter ID number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={guestDetails.checkInDate}
                  onChange={(e) => setGuestDetails({ ...guestDetails, checkInDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Check-out Date
                </label>
                <input
                  type="date"
                  value={guestDetails.checkOutDate}
                  onChange={(e) => setGuestDetails({ ...guestDetails, checkOutDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adults
                </label>
                <input
                  type="number"
                  min="1"
                  value={guestDetails.adults}
                  onChange={(e) => setGuestDetails({ ...guestDetails, adults: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Children
                </label>
                <input
                  type="number"
                  min="0"
                  value={guestDetails.children}
                  onChange={(e) => setGuestDetails({ ...guestDetails, children: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={handleCheckIn}
              disabled={!selectedRoom || !guestDetails.name || !guestDetails.phone || !guestDetails.idNumber}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Check In Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};