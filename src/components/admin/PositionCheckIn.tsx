import React, { useState, useEffect } from 'react';
import { MapPin, Users, Calendar, Phone, Mail, CreditCard, Plus, CreditCard as Edit, Wrench, UserCheck, Bed, DollarSign, Save, X, CheckCircle, AlertTriangle, User } from 'lucide-react';
import { apiClient } from '../../utils/api';
import toast from 'react-hot-toast';

interface PositionCheckInProps {
  hotel: any;
}

interface Room {
  _id: string;
  number: string;
  name: string;
  type: string;
  status: 'available' | 'occupied' | 'maintenance' | 'out-of-order';
  rate: number;
  maxOccupancy: number;
  amenities: string[];
  isActive: boolean;
  currentGuest?: {
    name: string;
    checkInDate: string;
    checkOutDate: string;
    guestId: string;
  };
}

interface Guest {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  idType: string;
  idNumber: string;
  address: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  roomId: string;
  roomNumber: string;
  roomType: string;
  ratePerNight: number;
  totalNights: number;
  totalAmount: number;
  advancePayment: number;
  pendingAmount: number;
  paidAmount: number;
  specialRequests?: string;
  status: 'checked-in' | 'checked-out';
  hotelId: string;
  createdAt?: string;
  updatedAt?: string;
}

export const PositionCheckIn: React.FC<PositionCheckInProps> = ({ hotel }) => {
  const [activeTab, setActiveTab] = useState<'checkin' | 'rooms' | 'guests'>('checkin');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  
  const [guestDetails, setGuestDetails] = useState<Guest>({
    name: '',
    email: '',
    phone: '',
    idType: 'passport',
    idNumber: '',
    address: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: '',
    adults: 1,
    children: 0,
    roomId: '',
    roomNumber: '',
    roomType: '',
    ratePerNight: 0,
    totalNights: 0,
    totalAmount: 0,
    advancePayment: 0,
    pendingAmount: 0,
    paidAmount: 0,
    specialRequests: '',
    status: 'checked-in',
    hotelId: hotel._id
  });

  const [newRoom, setNewRoom] = useState({
    number: '',
    name: '',
    type: 'Standard',
    rate: 2500,
    maxOccupancy: 2,
    amenities: [] as string[],
  });

  const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Premium', 'Executive'];
  const idTypes = [
    { value: 'passport', label: 'Passport' },
    { value: 'aadhar', label: 'Aadhar Card' },
    { value: 'driving', label: 'Driving License' },
    { value: 'voter', label: 'Voter ID' },
    { value: 'pan', label: 'PAN Card' }
  ];

  const amenitiesList = [
    'AC', 'WiFi', 'TV', 'Mini Bar', 'Balcony', 'Sea View', 'City View', 
    'Bathtub', 'Shower', 'Room Service', 'Laundry', 'Safe'
  ];

  useEffect(() => {
    fetchRooms();
    fetchGuests();
  }, [hotel._id]);

  useEffect(() => {
    if (selectedRoom && guestDetails.checkInDate && guestDetails.checkOutDate) {
      calculateBilling();
    }
  }, [selectedRoom, guestDetails.checkInDate, guestDetails.checkOutDate]);

  const fetchRooms = async () => {
    try {
      const data = await apiClient.getRooms(hotel._id);
      setRooms(data.map((room: any) => ({
        ...room,
        status: room.status || 'available',
        type: room.type || 'Standard',
        rate: room.rate || 2500,
        maxOccupancy: room.maxOccupancy || 2,
        amenities: room.amenities || []
      })));
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      toast.error('Failed to load rooms');
    }
  };

  const fetchGuests = async () => {
    try {
      const data = await apiClient.getGuests(hotel._id);
      setGuests(data);
    } catch (error) {
      console.error('Failed to fetch guests:', error);
      toast.error('Failed to load guests');
    }
  };

  const calculateBilling = () => {
    const selectedRoomData = rooms.find(r => r._id === selectedRoom);
    if (!selectedRoomData || !guestDetails.checkInDate || !guestDetails.checkOutDate) return;

    const checkIn = new Date(guestDetails.checkInDate);
    const checkOut = new Date(guestDetails.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = nights > 0 ? nights * selectedRoomData.rate : 0;
    const pendingAmount = totalAmount - guestDetails.advancePayment;

    setGuestDetails(prev => ({
      ...prev,
      roomNumber: selectedRoomData.number,
      roomType: selectedRoomData.type,
      ratePerNight: selectedRoomData.rate,
      totalNights: nights,
      totalAmount,
      pendingAmount,
      paidAmount: prev.advancePayment
    }));
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.number.trim()) {
      toast.error('Room number is required');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.createRoom(hotel._id, {
        ...newRoom,
        name: newRoom.name || `${newRoom.type} Room ${newRoom.number}`,
        status: 'available',
        isActive: true
      });
      
      setNewRoom({
        number: '',
        name: '',
        type: 'Standard',
        rate: 2500,
        maxOccupancy: 2,
        amenities: [],
      });
      setIsAddingRoom(false);
      fetchRooms();
      toast.success('Room added successfully');
    } catch (error) {
      toast.error('Failed to add room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    setIsLoading(true);
    try {
      await apiClient.updateRoom(hotel._id, editingRoom._id, {
        number: editingRoom.number,
        name: editingRoom.name,
        type: editingRoom.type,
        rate: editingRoom.rate,
        maxOccupancy: editingRoom.maxOccupancy,
        amenities: editingRoom.amenities
      });
      setEditingRoom(null);
      fetchRooms();
      toast.success('Room updated successfully');
    } catch (error) {
      toast.error('Failed to update room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoomStatusChange = async (roomId: string, newStatus: string) => {
    try {
      await apiClient.updateRoom(hotel._id, roomId, { status: newStatus });
      fetchRooms();
      toast.success(`Room status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update room status');
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoom || !guestDetails.name || !guestDetails.phone || !guestDetails.idNumber || !guestDetails.checkOutDate) {
      toast.error('Please fill all required fields and select a room');
      return;
    }

    const selectedRoomData = rooms.find(r => r._id === selectedRoom);
    if (!selectedRoomData) {
      toast.error('Selected room not found');
      return;
    }

    if (guestDetails.totalAmount <= 0) {
      toast.error('Invalid stay duration or room rate');
      return;
    }

    setIsCheckingIn(true);
    try {
      // Create guest record
      const guestData = {
        ...guestDetails,
        roomId: selectedRoom,
        hotelId: hotel._id
      };

      const createdGuest = await apiClient.createGuest(hotel._id, guestData);
      
      // Update room status to occupied with guest info
      await apiClient.updateRoom(hotel._id, selectedRoom, { 
        status: 'occupied',
        currentGuest: {
          name: guestDetails.name,
          checkInDate: guestDetails.checkInDate,
          checkOutDate: guestDetails.checkOutDate,
          guestId: createdGuest._id
        }
      });

      // Reset form
      setGuestDetails({
        name: '',
        email: '',
        phone: '',
        idType: 'passport',
        idNumber: '',
        address: '',
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: '',
        adults: 1,
        children: 0,
        roomId: '',
        roomNumber: '',
        roomType: '',
        ratePerNight: 0,
        totalNights: 0,
        totalAmount: 0,
        advancePayment: 0,
        pendingAmount: 0,
        paidAmount: 0,
        specialRequests: '',
        status: 'checked-in',
        hotelId: hotel._id
      });
      setSelectedRoom('');
      
      fetchRooms();
      fetchGuests();
      toast.success('Guest checked in successfully!');
    } catch (error: any) {
      console.error('Check-in error:', error);
      toast.error(error.message || 'Failed to check in guest');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async (guestId: string) => {
    if (!confirm('Are you sure you want to check out this guest?')) return;

    try {
      await apiClient.checkOutGuest(hotel._id, guestId);
      fetchRooms();
      fetchGuests();
      toast.success('Guest checked out successfully');
    } catch (error) {
      toast.error('Failed to check out guest');
    }
  };

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-700';
      case 'occupied':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700';
      case 'out-of-order':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-700';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600';
    }
  };

  const getRoomStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4" />;
      case 'occupied':
        return <Users className="h-4 w-4" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4" />;
      case 'out-of-order':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bed className="h-4 w-4" />;
    }
  };

  const renderCheckInTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Room Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Available Room</h3>
        <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {rooms.filter(room => room.status === 'available').map((room) => (
            <button
              key={room._id}
              onClick={() => setSelectedRoom(room._id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedRoom === room._id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">Room {room.number}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoomStatusColor(room.status)}`}>
                  {room.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{room.type}</p>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">₹{room.rate}/night</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Max: {room.maxOccupancy} guests</p>
            </button>
          ))}
        </div>
        
        {rooms.filter(room => room.status === 'available').length === 0 && (
          <div className="text-center py-8">
            <Bed className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No available rooms</p>
          </div>
        )}
      </div>

      {/* Guest Details Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Guest Details</h3>
        <form onSubmit={handleCheckIn} className="space-y-4">
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
              required
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
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ID Type *
              </label>
              <select
                value={guestDetails.idType}
                onChange={(e) => setGuestDetails({ ...guestDetails, idType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                {idTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
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
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <textarea
              value={guestDetails.address}
              onChange={(e) => setGuestDetails({ ...guestDetails, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter guest address"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Check-in Date *
              </label>
              <input
                type="date"
                value={guestDetails.checkInDate}
                onChange={(e) => setGuestDetails({ ...guestDetails, checkInDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Check-out Date *
              </label>
              <input
                type="date"
                value={guestDetails.checkOutDate}
                onChange={(e) => setGuestDetails({ ...guestDetails, checkOutDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min={guestDetails.checkInDate}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adults *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={guestDetails.adults}
                onChange={(e) => setGuestDetails({ ...guestDetails, adults: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Children
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={guestDetails.children}
                onChange={(e) => setGuestDetails({ ...guestDetails, children: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Advance Payment
            </label>
            <input
              type="number"
              min="0"
              value={guestDetails.advancePayment}
              onChange={(e) => {
                const advance = parseFloat(e.target.value) || 0;
                setGuestDetails({ 
                  ...guestDetails, 
                  advancePayment: advance,
                  paidAmount: advance,
                  pendingAmount: guestDetails.totalAmount - advance
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter advance payment amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Special Requests
            </label>
            <textarea
              value={guestDetails.specialRequests}
              onChange={(e) => setGuestDetails({ ...guestDetails, specialRequests: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Any special requests or notes..."
              rows={2}
            />
          </div>

          {/* Billing Summary */}
          {selectedRoom && guestDetails.checkInDate && guestDetails.checkOutDate && guestDetails.totalAmount > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Billing Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">Room Rate:</span>
                  <span className="text-blue-900 dark:text-blue-200">₹{guestDetails.ratePerNight}/night</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">Nights:</span>
                  <span className="text-blue-900 dark:text-blue-200">{guestDetails.totalNights}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">Advance Payment:</span>
                  <span className="text-blue-900 dark:text-blue-200">₹{guestDetails.advancePayment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium border-t border-blue-200 dark:border-blue-600 pt-2">
                  <span className="text-blue-900 dark:text-blue-200">Total Amount:</span>
                  <span className="text-blue-900 dark:text-blue-200">₹{guestDetails.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">Pending Amount:</span>
                  <span className="text-red-600 dark:text-red-400 font-medium">₹{guestDetails.pendingAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isCheckingIn || !selectedRoom || !guestDetails.name || !guestDetails.phone || !guestDetails.idNumber || !guestDetails.checkOutDate}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isCheckingIn ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing Check-in...
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4" />
                Check In Guest
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  const renderRoomsTab = () => (
    <div className="space-y-6">
      {/* Room Management Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Room Management</h3>
        <button
          onClick={() => setIsAddingRoom(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Room
        </button>
      </div>

      {/* Add/Edit Room Form */}
      {(isAddingRoom || editingRoom) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              {editingRoom ? 'Edit Room' : 'Add New Room'}
            </h4>
            <button
              onClick={() => {
                setIsAddingRoom(false);
                setEditingRoom(null);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={editingRoom ? handleEditRoom : handleAddRoom} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Room Number *
                </label>
                <input
                  type="text"
                  value={editingRoom ? editingRoom.number : newRoom.number}
                  onChange={(e) => editingRoom 
                    ? setEditingRoom({ ...editingRoom, number: e.target.value })
                    : setNewRoom({ ...newRoom, number: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 101"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Room Type *
                </label>
                <select
                  value={editingRoom ? editingRoom.type : newRoom.type}
                  onChange={(e) => editingRoom 
                    ? setEditingRoom({ ...editingRoom, type: e.target.value })
                    : setNewRoom({ ...newRoom, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  {roomTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rate per Night (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingRoom ? editingRoom.rate : newRoom.rate}
                  onChange={(e) => editingRoom 
                    ? setEditingRoom({ ...editingRoom, rate: parseFloat(e.target.value) || 0 })
                    : setNewRoom({ ...newRoom, rate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="2500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={editingRoom ? editingRoom.name : newRoom.name}
                  onChange={(e) => editingRoom 
                    ? setEditingRoom({ ...editingRoom, name: e.target.value })
                    : setNewRoom({ ...newRoom, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Deluxe Suite"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Occupancy *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={editingRoom ? editingRoom.maxOccupancy : newRoom.maxOccupancy}
                  onChange={(e) => editingRoom 
                    ? setEditingRoom({ ...editingRoom, maxOccupancy: parseInt(e.target.value) || 1 })
                    : setNewRoom({ ...newRoom, maxOccupancy: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amenities
              </label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {amenitiesList.map((amenity) => (
                  <label key={amenity} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingRoom ? editingRoom.amenities.includes(amenity) : newRoom.amenities.includes(amenity)}
                      onChange={(e) => {
                        const amenities = editingRoom ? editingRoom.amenities : newRoom.amenities;
                        const updatedAmenities = e.target.checked
                          ? [...amenities, amenity]
                          : amenities.filter(a => a !== amenity);
                        
                        if (editingRoom) {
                          setEditingRoom({ ...editingRoom, amenities: updatedAmenities });
                        } else {
                          setNewRoom({ ...newRoom, amenities: updatedAmenities });
                        }
                      }}
                      className="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAddingRoom(false);
                  setEditingRoom(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Saving...' : editingRoom ? 'Update Room' : 'Add Room'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Room Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Available</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {rooms.filter(r => r.status === 'available').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Occupied</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {rooms.filter(r => r.status === 'occupied').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Wrench className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Maintenance</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {rooms.filter(r => r.status === 'maintenance').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Out of Order</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {rooms.filter(r => r.status === 'out-of-order').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rooms.map((room) => (
          <div key={room._id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border-2 transition-all ${getRoomStatusColor(room.status)}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Room {room.number}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{room.name || room.type}</p>
              </div>
              <div className="flex items-center gap-1">
                {getRoomStatusIcon(room.status)}
                <span className="text-sm font-medium capitalize">{room.status.replace('-', ' ')}</span>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Type:</span>
                <span className="font-medium text-gray-900 dark:text-white">{room.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Rate:</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{room.rate}/night</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Max Guests:</span>
                <span className="font-medium text-gray-900 dark:text-white">{room.maxOccupancy}</span>
              </div>
              {room.amenities && room.amenities.length > 0 && (
                <div>
                  <span className="text-gray-600 dark:text-gray-300">Amenities:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {room.amenities.slice(0, 3).map((amenity) => (
                      <span key={amenity} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                        {amenity}
                      </span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                        +{room.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current Guest Info */}
            {room.status === 'occupied' && room.currentGuest && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
                <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-1">Current Guest</h5>
                <p className="text-sm text-blue-700 dark:text-blue-300">{room.currentGuest.name}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {new Date(room.currentGuest.checkInDate).toLocaleDateString()} - {new Date(room.currentGuest.checkOutDate).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Room Actions */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingRoom(room);
                  }}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newStatus = room.status === 'maintenance' ? 'available' : 'maintenance';
                    handleRoomStatusChange(room._id, newStatus);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                    room.status === 'maintenance'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-yellow-600 text-white hover:bg-yellow-700'
                  }`}
                >
                  <Wrench className="h-3 w-3" />
                  {room.status === 'maintenance' ? 'Fix Done' : 'Maintenance'}
                </button>
              </div>
              
              {room.status === 'available' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRoomStatusChange(room._id, 'occupied');
                  }}
                  className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Users className="h-3 w-3" />
                  Mark Occupied
                </button>
              )}
              
              {room.status === 'occupied' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to mark this room as available? This will not check out the guest.')) {
                      handleRoomStatusChange(room._id, 'available');
                    }
                  }}
                  className="w-full bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  Mark Available
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGuestsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Guests</h3>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Total: {guests.filter(g => g.status === 'checked-in').length} guests
        </div>
      </div>
      
      {guests.filter(g => g.status === 'checked-in').length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 border border-gray-200 dark:border-gray-700 text-center">
          <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No guests currently checked in</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Guests will appear here after check-in</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guests.filter(g => g.status === 'checked-in').map((guest) => (
            <div key={guest._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{guest.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Room {guest.roomNumber}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{guest.roomType}</p>
                </div>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                  Checked In
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Check-in:</span>
                  <span className="text-gray-900 dark:text-white">{new Date(guest.checkInDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Check-out:</span>
                  <span className="text-gray-900 dark:text-white">{new Date(guest.checkOutDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Guests:</span>
                  <span className="text-gray-900 dark:text-white">{guest.adults + guest.children}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Phone:</span>
                  <span className="text-gray-900 dark:text-white">{guest.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total:</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{guest.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Paid:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">₹{guest.paidAmount.toLocaleString()}</span>
                </div>
                {guest.pendingAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Pending:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">₹{guest.pendingAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleCheckOut(guest._id!)}
                className="w-full mt-4 bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
              >
                <User className="h-3 w-3" />
                Check Out
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Position/Check In</h2>
          <p className="text-gray-600 dark:text-gray-300">Manage guest check-ins and room assignments</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('checkin')}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
              activeTab === 'checkin'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <UserCheck className="h-4 w-4 inline mr-2" />
            Check In Guest
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
              activeTab === 'rooms'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Bed className="h-4 w-4 inline mr-2" />
            Manage Rooms ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab('guests')}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
              activeTab === 'guests'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Current Guests ({guests.filter(g => g.status === 'checked-in').length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'checkin' && renderCheckInTab()}
          {activeTab === 'rooms' && renderRoomsTab()}
          {activeTab === 'guests' && renderGuestsTab()}
        </div>
      </div>
    </div>
  );
};