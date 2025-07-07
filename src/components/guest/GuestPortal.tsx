import React, { useState, useEffect } from 'react';
import { Phone, UtensilsCrossed, ZoomIn as Room, MessageCircle, Send, CheckCircle } from 'lucide-react';
import { apiClient } from '../../utils/api';
import toast from 'react-hot-toast';

interface GuestPortalProps {
  hotelId: string;
  roomId: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  type: 'call-service' | 'order-food' | 'room-service' | 'complaint';
}

export const GuestPortal: React.FC<GuestPortalProps> = ({ hotelId, roomId }) => {
  const [hotelData, setHotelData] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        const data = await apiClient.getGuestPortalData(hotelId, roomId);
        setHotelData(data);
      } catch (error) {
        toast.error('Unable to load hotel information');
      }
    };

    fetchHotelData();
  }, [hotelId, roomId]);

  const services: Service[] = [
    {
      id: 'call-service',
      title: 'Call Service Boy',
      description: 'Request immediate assistance',
      icon: <Phone className="h-8 w-8" />,
      color: 'bg-blue-500',
      type: 'call-service'
    },
    {
      id: 'order-food',
      title: 'Order Food',
      description: 'Browse menu and place orders',
      icon: <UtensilsCrossed className="h-8 w-8" />,
      color: 'bg-green-500',
      type: 'order-food'
    },
    {
      id: 'room-service',
      title: 'Room Service',
      description: 'Housekeeping and maintenance',
      icon: <Room className="h-8 w-8" />,
      color: 'bg-purple-500',
      type: 'room-service'
    },
    {
      id: 'complaint',
      title: 'Lodge Complaint',
      description: 'Report issues or concerns',
      icon: <MessageCircle className="h-8 w-8" />,
      color: 'bg-red-500',
      type: 'complaint'
    }
  ];

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setIsSubmitted(false);
  };

  const handleSubmit = async (type: string, message: string = '') => {
    if (!hotelData) return;

    setIsLoading(true);
    try {
      await apiClient.submitGuestRequest(hotelId, roomId, {
        type,
        message: message || `${services.find(s => s.type === type)?.title} request`,
        priority: type === 'complaint' ? 'high' : 'medium'
      });
      
      setIsSubmitted(true);
      setSelectedService(null);
      setCustomMessage('');
      toast.success('Request submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomMessageSubmit = async () => {
    if (!customMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    await handleSubmit('custom-message', customMessage);
  };

  if (!hotelData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
            <p className="text-gray-600">
              Your request has been sent to the hotel staff. They will respond shortly.
            </p>
          </div>
          <button
            onClick={() => setIsSubmitted(false)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{hotelData.hotel.name}</h1>
            <p className="text-gray-600">Room {hotelData.room.number}</p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => handleServiceSelect(service.id)}
              disabled={!hotelData.hotel.settings.servicesEnabled[service.id.replace('-', '')]}
              className={`
                p-6 rounded-2xl shadow-sm border-2 transition-all duration-200 text-left
                ${selectedService === service.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
                ${!hotelData.hotel.settings.servicesEnabled[service.id.replace('-', '')]
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer'
                }
              `}
            >
              <div className={`${service.color} text-white p-3 rounded-xl mb-3 inline-block`}>
                {service.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{service.title}</h3>
              <p className="text-sm text-gray-600">{service.description}</p>
            </button>
          ))}
        </div>

        {/* Custom Message */}
        {hotelData.hotel.settings.servicesEnabled.customMessage && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Custom Message</h3>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
            <button
              onClick={handleCustomMessageSubmit}
              disabled={isLoading || !customMessage.trim()}
              className="mt-3 w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Message
                </>
              )}
            </button>
          </div>
        )}

        {/* Selected Service Action */}
        {selectedService && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-3">
                {services.find(s => s.id === selectedService)?.title}
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to request this service?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedService(null)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit(selectedService)}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Submitting...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};