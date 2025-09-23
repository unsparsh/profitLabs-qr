import React, { useState } from 'react';
import { Utensils, Calendar, Users, DollarSign, Plus } from 'lucide-react';

interface BanquetPanelProps {
  hotelId: string;
  activeView: string;
}

export const BanquetPanel: React.FC<BanquetPanelProps> = ({ hotelId, activeView }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Mock banquet data
  const banquetBookings = [
    {
      id: 'BQ001',
      eventName: 'Wedding Reception',
      clientName: 'John & Sarah',
      date: '2024-01-20',
      time: '7:00 PM',
      guests: 150,
      hall: 'Grand Ballroom',
      amount: 75000,
      status: 'confirmed',
      menu: 'Premium Wedding Package'
    },
    {
      id: 'BQ002',
      eventName: 'Corporate Meeting',
      clientName: 'Tech Corp Ltd',
      date: '2024-01-22',
      time: '10:00 AM',
      guests: 50,
      hall: 'Conference Hall A',
      amount: 25000,
      status: 'pending',
      menu: 'Business Lunch Package'
    }
  ];

  const banquetMenus = [
    {
      id: 'BM001',
      name: 'Premium Wedding Package',
      type: 'Wedding',
      pricePerPerson: 500,
      items: ['Welcome Drink', 'Starter Platter', 'Main Course Buffet', 'Dessert Counter'],
      description: 'Complete wedding package with premium items'
    },
    {
      id: 'BM002',
      name: 'Business Lunch Package',
      type: 'Corporate',
      pricePerPerson: 300,
      items: ['Tea/Coffee', 'Snacks', 'Lunch Buffet', 'Fresh Juice'],
      description: 'Perfect for corporate events and meetings'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const renderBookingsView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Events</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{banquetBookings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Guests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {banquetBookings.reduce((sum, booking) => sum + booking.guests, 0)}
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
              <p className="text-sm text-gray-600 dark:text-gray-300">Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{banquetBookings.reduce((sum, booking) => sum + booking.amount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <Utensils className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Avg per Guest</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹450</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Banquet Bookings</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4" />
              New Booking
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {banquetBookings.map((booking) => (
            <div key={booking.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{booking.eventName}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <div>
                      <span className="font-medium">Client:</span> {booking.clientName}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {new Date(booking.date).toLocaleDateString()} at {booking.time}
                    </div>
                    <div>
                      <span className="font-medium">Guests:</span> {booking.guests}
                    </div>
                    <div>
                      <span className="font-medium">Hall:</span> {booking.hall}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Menu:</span> {booking.menu}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">₹{booking.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">₹{Math.round(booking.amount / booking.guests)} per guest</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMenuView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Banquet Menu Packages</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add Menu Package
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banquetMenus.map((menu) => (
          <div key={menu.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{menu.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{menu.type} Package</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">₹{menu.pricePerPerson}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">per person</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{menu.description}</p>
            
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Includes:</h5>
              <ul className="space-y-1">
                {menu.items.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReportsView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Revenue</h4>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹2,45,000</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">+15% from last month</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Events This Month</h4>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">12</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">8 confirmed, 4 pending</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Popular Package</h4>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">Wedding Premium</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">65% of bookings</p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'banquet-bookings':
        return renderBookingsView();
      case 'banquet-menu':
        return renderMenuView();
      case 'banquet-reports':
        return renderReportsView();
      default:
        return renderBookingsView();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Utensils className="h-8 w-8 text-orange-600 dark:text-orange-400" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {activeView === 'banquet-bookings' ? 'Banquet Bookings' :
             activeView === 'banquet-menu' ? 'Banquet Menu' :
             activeView === 'banquet-reports' ? 'Banquet Reports' : 'Banquet Management'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">Manage banquet halls and events</p>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};