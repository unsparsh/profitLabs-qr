import React, { useState, useEffect } from 'react';
import { Phone, UtensilsCrossed, Wrench, MessageSquare, ShoppingCart, X, Plus, Minus, ArrowLeft, Wifi, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../utils/api';

interface GuestPortalProps {
  hotelId: string;
  roomId: string;
}

interface FoodItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

interface RoomServiceItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  estimatedTime: string;
  isAvailable: boolean;
}

interface ComplaintItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  priority: string;
  isAvailable: boolean;
}

interface CartItem extends FoodItem {
  quantity: number;
}

export default function GuestPortal({ hotelId, roomId }: GuestPortalProps) {
  const [step, setStep] = useState<'phone' | 'services' | 'service-detail'>('phone');
  const [activeService, setActiveService] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [hotelData, setHotelData] = useState<any>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [roomServiceItems, setRoomServiceItems] = useState<RoomServiceItem[]>([]);
  const [complaintItems, setComplaintItems] = useState<ComplaintItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    fetchGuestPortalData();
  }, [hotelId, roomId]);

  useEffect(() => {
    if (activeService === 'food') {
      fetchFoodItems();
    } else if (activeService === 'room-service') {
      fetchRoomServiceItems();
    } else if (activeService === 'complaint') {
      fetchComplaintItems();
    }
  }, [activeService]);

  const fetchGuestPortalData = async () => {
    try {
      const data = await apiClient.getGuestPortalData(hotelId, roomId);
      setHotelData(data.hotel);
      setRoomData(data.room);
    } catch (error) {
      console.error('Failed to load guest portal data:', error);
      toast.error('Failed to load room information');
    }
  };

  const fetchFoodItems = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getGuestFoodMenu(hotelId);
      setFoodItems(data.filter((item: FoodItem) => item.isAvailable));
    } catch (error) {
      console.error('Failed to load food menu:', error);
      toast.error('Failed to load food menu');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomServiceItems = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getRoomServiceMenu(hotelId);
      setRoomServiceItems(data.filter((item: RoomServiceItem) => item.isAvailable));
    } catch (error) {
      console.error('Failed to load room service menu:', error);
      toast.error('Failed to load room service menu');
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaintItems = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getComplaintMenu(hotelId);
      setComplaintItems(data.filter((item: ComplaintItem) => item.isAvailable));
    } catch (error) {
      console.error('Failed to load complaint options:', error);
      toast.error('Failed to load complaint options');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: FoodItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem._id === item._id);
      if (existing) {
        return prev.map(cartItem =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item._id === id) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const submitRequest = async (type: string, details: any) => {
    try {
      setLoading(true);
      await apiClient.submitGuestRequest(hotelId, roomId, {
        type,
        guestPhone: phoneNumber.trim(),
        orderDetails: type === 'order-food' ? details : undefined,
        serviceDetails: type === 'room-service' ? details : undefined,
        complaintDetails: type === 'complaint' ? details : undefined,
        customMessageDetails: type === 'custom-message' ? details : undefined,
        priority: 'medium'
      });
      
      toast.success('Request submitted successfully!');
      setStep('services');
      setActiveService(null);
      setCustomMessage('');
      setCart([]);
    } catch (error) {
      console.error('Failed to submit request:', error);
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleFoodOrder = () => {
    if (cart.length === 0) {
      toast.error('Please add items to cart');
      return;
    }
    
    const orderDetails = {
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      total: getTotalPrice()
    };
    
    submitRequest('order-food', orderDetails);
  };

  const handleRoomServiceRequest = (service: RoomServiceItem) => {
    const serviceDetails = {
      serviceName: service.name,
      description: service.description,
      category: service.category,
      estimatedTime: service.estimatedTime
    };
    submitRequest('room-service', serviceDetails);
  };

  const handleComplaintSubmission = (complaint: ComplaintItem) => {
    const complaintDetails = {
      complaintName: complaint.name,
      description: complaint.description,
      category: complaint.category,
      priority: complaint.priority
    };
    submitRequest('complaint', complaintDetails);
  };

  const handleCustomMessageSubmission = () => {
    if (!customMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    const customMessageDetails = {
      message: customMessage.trim()
    };
    submitRequest('custom-message', customMessageDetails);
  };

  const handleWifiIssueSubmission = () => {
    const wifiDetails = {
      message: 'WiFi connection issue reported from room'
    };
    submitRequest('complaint', wifiDetails);
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    if (phoneNumber.trim().length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setStep('services');
  };

  const getUniqueCategories = (items: any[]) => {
    const categories = items.map(item => item.category);
    return ['All', ...Array.from(new Set(categories))];
  };

  const filterItemsByCategory = (items: any[]) => {
    return selectedCategory === 'All' 
      ? items 
      : items.filter(item => item.category === selectedCategory);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Phone Number Step
  if (step === 'phone') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Hotel Info */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Room {roomData?.number || 'Loading...'}
            </h1>
            {hotelData && (
              <p className="text-gray-600">
                {hotelData.name}
              </p>
            )}
          </div>

          {/* Phone Input Form */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Enter Your Phone Number
            </h2>
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Services Selection Step
  if (step === 'services') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-4 py-4">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Room {roomData?.number}
              </h1>
              <p className="text-sm text-gray-600">{hotelData?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium text-blue-600">{phoneNumber}</p>
            </div>
          </div>
        </div>

        {/* Service Options */}
        <div className="max-w-md mx-auto p-4 space-y-3">
          {/* Food Order */}
          <button
            onClick={() => {
              setActiveService('food');
              setStep('service-detail');
            }}
            className="w-full bg-white rounded-lg border p-4 flex items-center space-x-4 hover:bg-green-50 hover:border-green-200 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <UtensilsCrossed className="w-6 h-6 text-orange-600 group-hover:text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-gray-900 group-hover:text-green-700">Order Food</h3>
              <p className="text-sm text-gray-500 group-hover:text-green-600">Browse our menu</p>
            </div>
            <div className="text-gray-400 group-hover:text-green-500">
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </div>
          </button>

          {/* Room Service */}
          <button
            onClick={() => {
              setActiveService('room-service');
              setStep('service-detail');
            }}
            className="w-full bg-white rounded-lg border p-4 flex items-center space-x-4 hover:bg-green-50 hover:border-green-200 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <Wrench className="w-6 h-6 text-blue-600 group-hover:text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-gray-900 group-hover:text-green-700">Room Service</h3>
              <p className="text-sm text-gray-500 group-hover:text-green-600">Housekeeping & maintenance</p>
            </div>
            <div className="text-gray-400 group-hover:text-green-500">
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </div>
          </button>

          {/* WiFi Issue */}
          <button
            onClick={handleWifiIssueSubmission}
            disabled={loading}
            className="w-full bg-white rounded-lg border p-4 flex items-center space-x-4 hover:bg-green-50 hover:border-green-200 transition-all duration-200 group disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <Wifi className="w-6 h-6 text-purple-600 group-hover:text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-gray-900 group-hover:text-green-700">WiFi Issue</h3>
              <p className="text-sm text-gray-500 group-hover:text-green-600">Report connectivity problems</p>
            </div>
            <div className="text-gray-400 group-hover:text-green-500">
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </div>
          </button>

          {/* Custom Message */}
          <button
            onClick={() => {
              setActiveService('custom-message');
              setStep('service-detail');
            }}
            className="w-full bg-white rounded-lg border p-4 flex items-center space-x-4 hover:bg-green-50 hover:border-green-200 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <MessageSquare className="w-6 h-6 text-green-600 group-hover:text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-gray-900 group-hover:text-green-700">Send Message</h3>
              <p className="text-sm text-gray-500 group-hover:text-green-600">Custom message to staff</p>
            </div>
            <div className="text-gray-400 group-hover:text-green-500">
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </div>
          </button>

          {/* Lodge Complaint */}
          <button
            onClick={() => {
              setActiveService('complaint');
              setStep('service-detail');
            }}
            className="w-full bg-white rounded-lg border p-4 flex items-center space-x-4 hover:bg-green-50 hover:border-green-200 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <AlertCircle className="w-6 h-6 text-red-600 group-hover:text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-gray-900 group-hover:text-green-700">Lodge Complaint</h3>
              <p className="text-sm text-gray-500 group-hover:text-green-600">Report issues or concerns</p>
            </div>
            <div className="text-gray-400 group-hover:text-green-500">
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Service Detail Step
  if (step === 'service-detail') {
    // Custom Message Interface
    if (activeService === 'custom-message') {
      return (
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b px-4 py-4">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <button
                onClick={() => setStep('services')}
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Send Message</h1>
              <div className="w-10 h-10"></div>
            </div>
          </div>

          {/* Message Form */}
          <div className="max-w-md mx-auto p-4">
            <div className="bg-white rounded-lg border p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Your Message
                </label>
                <textarea
                  placeholder="Type your message here..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={6}
                  required
                />
              </div>

              <button
                onClick={handleCustomMessageSubmission}
                disabled={loading || !customMessage.trim()}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending Message...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Food Order Interface
    if (activeService === 'food') {
      const categories = getUniqueCategories(foodItems);
      const filteredItems = filterItemsByCategory(foodItems);

      return (
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b px-4 py-4 sticky top-0 z-50">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <button
                onClick={() => setStep('services')}
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Food Menu</h1>
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white border-b px-4 py-3">
            <div className="max-w-md mx-auto">
              <div className="flex space-x-2 overflow-x-auto">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="max-w-md mx-auto p-4 pb-80">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map(item => (
                  <div key={item._id} className="bg-white rounded-lg border p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <span className="font-semibold text-green-600">₹{item.price}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fixed Cart Bottom Sheet */}
          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg max-h-80 flex flex-col">
              {/* Cart Header */}
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Your Order</h3>
              </div>

              {/* Cart Items - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.map(item => (
                  <div key={item._id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-green-600 font-semibold">₹{item.price}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item._id, -1)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item._id, 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center ml-2"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-lg">Total: ₹{getTotalPrice()}</span>
                </div>
                <button
                  onClick={handleFoodOrder}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Room Service Interface
    if (activeService === 'room-service') {
      const categories = getUniqueCategories(roomServiceItems);
      const filteredItems = filterItemsByCategory(roomServiceItems);

      return (
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b px-4 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button
                onClick={() => setStep('services')}
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Room Service</h1>
              <div className="w-10 h-10"></div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white border-b px-4 py-3">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto p-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(service => (
                  <div key={service._id} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg">{service.name}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {service.estimatedTime}
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {service.category}
                      </span>
                      <button
                        onClick={() => handleRoomServiceRequest(service)}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Requesting...' : 'Request'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Complaint Interface
    if (activeService === 'complaint') {
      const categories = getUniqueCategories(complaintItems);
      const filteredItems = filterItemsByCategory(complaintItems);

      return (
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b px-4 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button
                onClick={() => setStep('services')}
                className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Lodge Complaint</h1>
              <div className="w-10 h-10"></div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white border-b px-4 py-3">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto p-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(complaint => (
                  <div key={complaint._id} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg">{complaint.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority} Priority
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{complaint.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                        {complaint.category}
                      </span>
                      <button
                        onClick={() => handleComplaintSubmission(complaint)}
                        disabled={loading}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Submitting...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  return null;
}