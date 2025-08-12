import { useTheme } from '../../contexts/ThemeContext';
import React, { useState } from 'react';
import { Save, Bell, CreditCard, Users, Phone } from 'lucide-react';
import { apiClient } from '../../utils/api';
import toast from 'react-hot-toast';

interface SettingsPanelProps {
  hotel: any;
  onHotelUpdate: (hotel: any) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ hotel, onHotelUpdate }) => {
  const [settings, setSettings] = useState(hotel?.settings || {
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
    },
    emergencyContact: {
      phone: '+91 9876543210',
      description: 'Available 24/7 for any assistance',
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();

  const handleServiceToggle = (service: string) => {
    setSettings((prev: any) => ({
      ...prev,
      servicesEnabled: {
        ...prev.servicesEnabled,
        [service]: !prev.servicesEnabled[service]
      }
    }));
  };

  const handleNotificationToggle = (type: string) => {
    setSettings((prev: any) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  };

  const handleEmergencyContactChange = (field: string, value: string) => {
    setSettings((prev: any) => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
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

  // Debug logging
  console.log('Settings state:', settings);
  console.log('Hotel data:', hotel);
  return (
    <div className="space-y-6">
      {/* Hotel Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-colors">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-4">Hotel Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hotel Name</label>
            <input
              type="text"
              value={hotel?.name || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={hotel?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
            <input
              type="tel"
              value={hotel?.phone || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Rooms</label>
            <input
              type="number"
              value={hotel?.totalRooms || 0}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Services Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-colors">
        <div className="flex items-center mb-4">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 mr-2" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Guest Services</h3>
        </div>
        <div className="space-y-4">
          {services.map((service) => (
            <div key={service.key} className="flex items-start sm:items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 gap-3">
              <div className="flex-1">
                <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{service.label}</h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">{service.description}</p>
              </div>
              <button
                onClick={() => handleServiceToggle(service.key)}
                type="button"
                className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                  settings?.servicesEnabled?.[service.key] ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings?.servicesEnabled?.[service.key] ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-colors">
        <div className="flex items-center mb-4">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 mr-2" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Notifications</h3>
        </div>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification.key} className="flex items-start sm:items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 gap-3">
              <div className="flex-1">
                <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{notification.label}</h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">{notification.description}</p>
              </div>
              <button
                onClick={() => handleNotificationToggle(notification.key)}
                type="button"
                className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                  settings?.notifications?.[notification.key] ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings?.notifications?.[notification.key] ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Contact Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-colors">
        <div className="flex items-center mb-4">
          <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 mr-2" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Emergency Contact</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
            <input
              type="tel"
              value={settings?.emergencyContact?.phone || ''}
              onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
              placeholder="+91 9876543210"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <input
              type="text"
              value={settings?.emergencyContact?.description || ''}
              onChange={(e) => handleEmergencyContactChange('description', e.target.value)}
              placeholder="Available 24/7 for any assistance"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Subscription Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-colors">
        <div className="flex items-center mb-4">
          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 mr-2" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Subscription</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Current Plan</p>
            <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white capitalize">{hotel?.subscription?.plan || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Status</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              hotel?.subscription?.status === 'active' 
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {hotel?.subscription?.status || 'inactive'}
            </span>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Expires</p>
            <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
              {hotel?.subscription?.expiresAt ? new Date(hotel.subscription.expiresAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-blue-600 dark:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Save className="h-3 w-3 sm:h-4 sm:w-4" />
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};
