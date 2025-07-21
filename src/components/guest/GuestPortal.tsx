import React, { useState, useEffect } from 'react';
import { Phone, UtensilsCrossed, Wrench, MessageSquare, ShoppingCart, X, Plus, Minus, Star, Clock, Users, AlertCircle, ArrowLeft } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Hotel Info Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Phone className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome to Room {roomData?.number || 'Loading...'}
            </h1>
            {hotelData && (
              <p className="text-gray-600 mb-6">
                {hotelData.name}
              </p>
            )}
            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto"></div>
          </div>

          {/* Phone Input Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              Enter Your Phone Number
            </h2>
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 transition-colors text-lg"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Continue
              </button>
            </form>
            <p className="text-sm text-gray-500 text-center mt-4">
              We'll use this to contact you about your requests
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Services Selection Step
  if (step === 'services') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Room {roomData?.number}
                </h1>
                <p className="text-gray-600 text-sm">{hotelData?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-sm font-medium text-blue-600">{phoneNumber}</p>
              </div>
            </div>
            <div className="w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
          </div>

          {/* Service Options */}
          <div className="space-y-4">
            <button
              onClick={() => {
                setActiveService('food');
                setStep('service-detail');
              }}
              className="w-full bg-white rounded-2xl shadow-lg p-6 flex items-center space-x-4 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <div className="w-14 h-14 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl flex items-center justify-center">
                <UtensilsCrossed className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-800 text-lg">Order Food</h3>
                <p className="text-gray-600 text-sm">Browse our delicious menu</p>
              </div>
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-400">→</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveService('room-service');
                setStep('service-detail');
              }}
              className="w-full bg-white rounded-2xl shadow-lg p-6 flex items-center space-x-4 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <div className="w-14 h-14 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center">
                <Wrench className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-800 text-lg">Room Service</h3>
                <p className="text-gray-600 text-sm">Housekeeping & maintenance</p>
              </div>
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-400">→</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveService('custom-message');
                setStep('service-detail');
              }}
              className="w-full bg-white rounded-2xl shadow-lg p-6 flex items-center space-x-4 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <div className="w-14 h-14 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-800 text-lg">Send Message</h3>
                <p className="text-gray-600 text-sm">Custom message to staff</p>
              </div>
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-400">→</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveService('complaint');
                setStep('service-detail');
              }}
              className="w-full bg-white rounded-2xl shadow-lg p-6 flex items-center space-x-4 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <div className="w-14 h-14 bg-gradient-to-r from-red-400 to-pink-500 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-800 text-lg">Lodge Complaint</h3>
                <p className="text-gray-600 text-sm">Report issues or concerns</p>
              </div>
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-400">→</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Service Detail Step
  if (step === 'service-detail') {
    // Custom Message Interface
    if (activeService === 'custom-message') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setStep('services')}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-800">Send Message</h1>
                <div className="w-10 h-10"></div>
              </div>
              <div className="w-full h-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
            </div>

            {/* Message Form */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Your Message
                  </label>
                  <textarea
                    placeholder="Type your message here..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-0 transition-colors resize-none"
                    rows={6}
                    required
                  />
                </div>

                <button
                  onClick={handleCustomMessageSubmission}
                  disabled={loading || !customMessage.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 rounded-2xl font-semibold text-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? 'Sending Message...' : 'Send Message'}
                </button>
              </div>
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
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
          {/* Mobile Layout */}
          <div className="lg:hidden">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-50">
              <button
                onClick={() => setStep('services')}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="font-semibold text-gray-800">Food Menu</h1>
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white p-4 border-b">
              <div className="flex space-x-2 overflow-x-auto">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-4 pb-80">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map(item => (
                    <div key={item._id} className="bg-white rounded-2xl shadow-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800">{item.name}</h3>
                        <span className="font-bold text-green-600">₹{item.price}</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105"
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
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg max-h-80 flex flex-col rounded-t-3xl">
                {/* Cart Header */}
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-800">Your Order</h3>
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
                <div className="p-4 border-t bg-gray-50 rounded-t-3xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-lg">Total: ₹{getTotalPrice()}</span>
                  </div>
                  <button
                    onClick={handleFoodOrder}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-2xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                  >
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Room Service Interface
    if (activeService === 'room-service') {
      const categories = getUniqueCategories(roomServiceItems);
      const filteredItems = filterItemsByCategory(roomServiceItems);

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setStep('services')}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-800">Room Service</h1>
                <div className="w-10 h-10"></div>
              </div>
              <div className="w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-3xl shadow-xl p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(service => (
                  <div key={service._id} className="bg-white rounded-3xl shadow-xl p-6 hover:shadow-2xl transition-all duration-200 transform hover:scale-105">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 text-lg">{service.name}</h3>
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
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
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
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setStep('services')}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-800">Lodge Complaint</h1>
                <div className="w-10 h-10"></div>
              </div>
              <div className="w-full h-1 bg-gradient-to-r from-red-500 to-pink-600 rounded-full"></div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-3xl shadow-xl p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(complaint => (
                  <div key={complaint._id} className="bg-white rounded-3xl shadow-xl p-6 hover:shadow-2xl transition-all duration-200 transform hover:scale-105">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 text-lg">{complaint.name}</h3>
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
                        className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-xl font-medium hover:from-red-600 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
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