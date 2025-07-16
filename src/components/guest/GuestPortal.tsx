import React, { useState, useEffect } from 'react';
import { Phone, UtensilsCrossed, Wrench, MessageSquare, ShoppingCart, X, Plus, Minus, Star, Clock, Users, AlertCircle } from 'lucide-react';
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
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

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
      setActiveService(null);
      setPhoneNumber('');
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

  if (activeService === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
              Welcome to Room {roomData?.number || 'Loading...'}
            </h1>
            {hotelData && (
              <p className="text-gray-600 text-center mb-2">
                {hotelData.name}
              </p>
            )}
            <p className="text-gray-600 text-center mb-6">
              How can we assist you today?
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setActiveService('food')}
              className="w-full bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <div className="bg-orange-100 p-3 rounded-full">
                <UtensilsCrossed className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-800">Order Food</h3>
                <p className="text-sm text-gray-600">Browse our delicious menu</p>
              </div>
            </button>

            <button
              onClick={() => setActiveService('room-service')}
              className="w-full bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <div className="bg-blue-100 p-3 rounded-full">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-800">Room Service</h3>
                <p className="text-sm text-gray-600">Request housekeeping & maintenance</p>
              </div>
            </button>

            <button
              onClick={() => setActiveService('custom-message')}
              className="w-full bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <div className="bg-purple-100 p-3 rounded-full">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-800">Send Message</h3>
                <p className="text-sm text-gray-600">Send a custom message to hotel staff</p>
              </div>
            </button>

            <button
              onClick={() => setActiveService('complaint')}
              className="w-full bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <div className="bg-red-100 p-3 rounded-full">
                <MessageSquare className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-800">Lodge Complaint</h3>
                <p className="text-sm text-gray-600">Report issues or concerns</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeService === 'custom-message') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setActiveService(null)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
                <span>Back</span>
              </button>
              <h1 className="text-xl font-bold text-gray-800">Send Message</h1>
              <div></div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message *
                </label>
                <textarea
                  placeholder="Type your message here..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={6}
                  required
                />
              </div>

              <button
                onClick={handleCustomMessageSubmission}
                disabled={loading || !phoneNumber.trim() || !customMessage.trim()}
                className="w-full bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending Message...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeService === 'food') {
    const categories = getUniqueCategories(foodItems);
    const filteredItems = filterItemsByCategory(foodItems);

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Layout */}
        <div className="lg:hidden">
          {/* Header */}
          <div className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-50">
            <button
              onClick={() => setActiveService(null)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
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
                      ? 'bg-blue-500 text-white'
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map(item => (
                  <div key={item._id} className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <span className="font-bold text-green-600">₹{item.price}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
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

              {/* Phone Input & Checkout */}
              <div className="p-4 border-t bg-gray-50">
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-lg">Total: ₹{getTotalPrice()}</span>
                </div>
                <button
                  onClick={handleFoodOrder}
                  disabled={loading || !phoneNumber.trim()}
                  className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="flex h-screen">
            {/* Menu Section */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setActiveService(null)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                  >
                    <X className="w-5 h-5" />
                    <span>Back</span>
                  </button>
                  <h1 className="text-2xl font-bold text-gray-800">Food Menu</h1>
                  <div></div>
                </div>

                {/* Categories */}
                <div className="flex space-x-2 mb-6 overflow-x-auto">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                        selectedCategory === category
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Menu Items Grid */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredItems.map(item => (
                      <div key={item._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-gray-800 text-lg">{item.name}</h3>
                          <span className="font-bold text-green-600 text-lg">₹{item.price}</span>
                        </div>
                        <p className="text-gray-600 mb-4">{item.description}</p>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cart Sidebar */}
            <div className="w-96 bg-white border-l shadow-lg flex flex-col">
              <div className="p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Your Order ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item._id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{item.name}</h4>
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-green-600 font-semibold">₹{item.price}</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item._id, -1)}
                              className="w-8 h-8 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item._id, 1)}
                              className="w-8 h-8 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t bg-gray-50">
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-semibold">Total: ₹{getTotalPrice()}</span>
                  </div>
                  <button
                    onClick={handleFoodOrder}
                    disabled={loading || !phoneNumber.trim()}
                    className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeService === 'room-service') {
    const categories = getUniqueCategories(roomServiceItems);
    const filteredItems = filterItemsByCategory(roomServiceItems);

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setActiveService(null)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
                <span>Back</span>
              </button>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Room Service</h1>
              <div></div>
            </div>

            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Categories */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
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
                <div key={service._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
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
                      disabled={loading || !phoneNumber.trim()}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
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

  if (activeService === 'complaint') {
    const categories = getUniqueCategories(complaintItems);
    const filteredItems = filterItemsByCategory(complaintItems);

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setActiveService(null)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
                <span>Back</span>
              </button>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Lodge Complaint</h1>
              <div></div>
            </div>

            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Categories */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
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
                <div key={complaint._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
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
                      disabled={loading || !phoneNumber.trim()}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
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

  return null;
}