import React, { useState } from 'react';
import { Save, Bell, Mail, CreditCard, Users } from 'lucide-react';
import { apiClient } from '../../utils/api';
import toast from 'react-hot-toast';

interface SettingsPanelProps {
  hotel: any;
  onHotelUpdate: (hotel: any) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ hotel, onHotelUpdate }) => {
  const [settings, setSettings] = useState(hotel.settings || {
    servicesEnabled: {
      callServiceBoy: true,
      orderFood: true,
      requestRoomService: true,
      lodgeComplaint: true,
      customMessage: true,
    },
    notifications: {
      sound: true,
      email: true,
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleServiceToggle = (service: string) => {
    setSettings(prev => ({
      ...prev,
      servicesEnabled: {
        ...prev.servicesEnabled,
        [service]: !prev.servicesEnabled[service]
      }
    }));
  };

  const handleNotificationToggle = (type: string) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await apiClient.updateHotel(hotel._id, { settings });
      onHotelUpdate({ ...hotel, settings });
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  const services = [
    { key: 'callServiceBoy', label: 'Call Service Boy', description: 'Allow guests to call for immediate assistance' },
    { key: 'orderFood', label: 'Order Food', description: 'Enable food ordering from guest rooms' },
    { key: 'requestRoomService', label: 'Request Room Service', description: 'Allow housekeeping and maintenance requests' },
    { key: 'lodgeComplaint', label: 'Lodge Complaint', description: 'Enable complaint submission system' },
    { key: 'customMessage', label: 'Custom Message', description: 'Allow guests to send custom messages' },
  ];

  const notifications = [
    { key: 'sound', label: 'Sound Notifications', description: 'Play sound when new requests arrive' },
    { key: 'email', label: 'Email Notifications', description: 'Send email alerts for new requests' },
  ];

  return (
    <div className="space-y-6">
      {/* Hotel Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Hotel Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Name</label>
            <input
              type="text"
              value={hotel.name}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={hotel.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={hotel.phone}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Rooms</label>
            <input
              type="number"
              value={hotel.totalRooms}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Services Configuration */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Users className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Guest Services</h3>
        </div>
        <div className="space-y-4">
          {services.map((service) => (
            <div key={service.key} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{service.label}</h4>
                <p className="text-sm text-gray-600">{service.description}</p>
              </div>
              <button
                onClick={() => handleServiceToggle(service.key)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.servicesEnabled[service.key] ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.servicesEnabled[service.key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Bell className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
        </div>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification.key} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{notification.label}</h4>
                <p className="text-sm text-gray-600">{notification.description}</p>
              </div>
              <button
                onClick={() => handleNotificationToggle(notification.key)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.notifications[notification.key] ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.notifications[notification.key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Subscription</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Current Plan</p>
            <p className="font-medium text-gray-900 capitalize">{hotel.subscription.plan}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              hotel.subscription.status === 'active' 
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {hotel.subscription.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Expires</p>
            <p className="font-medium text-gray-900">
              {new Date(hotel.subscription.expiresAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};