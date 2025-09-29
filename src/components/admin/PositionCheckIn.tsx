import React, { useState, useEffect } from 'react';
import { MapPin, Users, Calendar, Phone, Mail, CreditCard, Plus, CreditCard as Edit, Wrench, UserCheck, Bed, DollarSign, Save, X, CheckCircle, AlertTriangle, User, Clock, LogOut, Settings, Trash2, Eye } from 'lucide-react';
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
  additionalCharges?: number;
  specialRequests?: string;
  status: 'checked-in' | 'checked-out';
  hotelId: string;
  createdAt?: string;
  updatedAt?: string;
}

export const PositionCheckIn: React.FC<PositionCheckInProps> = ({ hotel }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'checkin' | 'checkout' | 'edit-room' | 'add-room'>('checkin');
  const [isLoading, setIsLoading] = useState(false);
  
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

  const [editingRoom, setEditingRoom] = useState<Room>({
    _id: '',
    number: '',
    name: '',
    type: 'Standard',
    status: 'available',
    rate: 2500,
    maxOccupancy: 2,
    amenities: [],
    isActive: true
  });

  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [finalPayment, setFinalPayment] = useState(0);

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
  }, [selectedRoom, guestDetails.checkInDate, guestDetails.checkOutDate, guestDetails.advancePayment]);

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
    if (!selectedRoom || !guestDetails.checkInDate || !guestDetails.checkOutDate) return;

    const checkIn = new Date(guestDetails.checkInDate);
    const checkOut = new Date(guestDetails.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = nights > 0 ? nights * selectedRoom.rate : 0;
    const pendingAmount = totalAmount - guestDetails.advancePayment;

    setGuestDetails(prev => ({
      ...prev,
      roomId: selectedRoom._id,
      roomNumber: selectedRoom.number,
      roomType: selectedRoom.type,
      ratePerNight: selectedRoom.rate,
      totalNights: nights,
      totalAmount,
      pendingAmount,
      paidAmount: prev.advancePayment
    }));
  };

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    
    if (room.status === 'available') {
      // Show check-in modal
      setModalType('checkin');
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
        roomId: room._id,
        roomNumber: room.number,
        roomType: room.type,
        ratePerNight: room.rate,
        totalNights: 0,
        totalAmount: 0,
        advancePayment: 0,
        pendingAmount: 0,
        paidAmount: 0,
        specialRequests: '',
        status: 'checked-in',
        hotelId: hotel._id
      });
    } else if (room.status === 'occupied') {
      // Show checkout modal
      const currentGuest = guests.find(g => g.roomId === room._id && g.status === 'checked-in');
      if (currentGuest) {
        setGuestDetails(currentGuest);
        setModalType('checkout');
        setAdditionalCharges(currentGuest.additionalCharges || 0);
        setFinalPayment(0);
      }
    }
    
    setShowModal(true);
  };

  const handleEditRoom = (room: Room, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRoom(room);
    setEditingRoom({ ...room });
    setModalType('edit-room');
    setShowModal(true);
  };

  const handleRoomStatusChange = async (room: Room, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await apiClient.updateRoom(hotel._id, room._id, { status: newStatus });
      await fetchRooms();
      toast.success(`Room ${room.number} marked as ${newStatus}`);
    } catch (error) {
      console.error('Failed to update room status:', error);
      toast.error('Failed to update room status');
    }
  };

  const handleAddRoom = () => {
    setEditingRoom({
      _id: '',
      number: '',
      name: '',
      type: 'Standard',
      status: 'available',
      rate: 2500,
      maxOccupancy: 2,
      amenities: [],
      isActive: true
    });
    setModalType('add-room');
    setShowModal(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingRoom.number.trim()) {
      toast.error('Room number is required');
      return;
    }

    setIsLoading(true);
    try {
      if (modalType === 'add-room') {
        await apiClient.createRoom(hotel._id, {
          ...editingRoom,
          name: editingRoom.name || `${editingRoom.type} Room ${editingRoom.number}`,
          isActive: true
        });
        toast.success('Room added successfully');
      } else {
        await apiClient.updateRoom(hotel._id, editingRoom._id, editingRoom);
        toast.success('Room updated successfully');
      }
      
      setShowModal(false);
      await fetchRooms();
    } catch (error: any) {
      console.error('Failed to save room:', error);
      toast.error(error.message || 'Failed to save room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoom || !guestDetails.name || !guestDetails.phone || !guestDetails.idNumber || !guestDetails.checkOutDate) {
      toast.error('Please fill all required fields');
      return;
    }

    if (guestDetails.totalAmount <= 0) {
      toast.error('Invalid stay duration or room rate');
      return;
    }

    setIsLoading(true);
    try {
      // Create guest record
      const guestData = {
        ...guestDetails,
        roomId: selectedRoom._id,
        hotelId: hotel._id
      };

      const createdGuest = await apiClient.createGuest(hotel._id, guestData);
      
      // Update room status to occupied with guest info
      await apiClient.updateRoom(hotel._id, selectedRoom._id, { 
        status: 'occupied',
        currentGuest: {
          name: guestDetails.name,
          checkInDate: guestDetails.checkInDate,
          checkOutDate: guestDetails.checkOutDate,
          guestId: createdGuest._id
        }
      });

      setShowModal(false);
      await fetchRooms();
      await fetchGuests();
      toast.success('Guest checked in successfully!');
    } catch (error: any) {
      console.error('Check-in error:', error);
      toast.error(error.message || 'Failed to check in guest');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFinalBill = () => {
    if (!guestDetails) return 0;
    return guestDetails.totalAmount + additionalCharges;
  };

  const calculateFinalPending = () => {
    if (!guestDetails) return 0;
    const finalBill = calculateFinalBill();
    const totalPaid = guestDetails.paidAmount + finalPayment;
    return Math.max(0, finalBill - totalPaid);
  };

  const handleCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guestDetails._id) {
      toast.error('Guest information not found');
      return;
    }

    const finalBill = calculateFinalBill();
    const totalPaid = guestDetails.paidAmount + finalPayment;
    const finalPending = calculateFinalPending();

    if (finalPending > 0 && !confirm(`Guest has pending amount of ₹${finalPending.toLocaleString()}. Continue with check-out?`)) {
      return;
    }

    setIsLoading(true);
    try {
      // Update guest status and billing
      await apiClient.updateGuest(hotel._id, guestDetails._id, {
        status: 'checked-out',
        totalAmount: finalBill,
        paidAmount: totalPaid,
        pendingAmount: finalPending,
        additionalCharges,
        checkOutDate: new Date().toISOString()
      });

      // Update room status to available
      await apiClient.updateRoom(hotel._id, guestDetails.roomId, { 
        status: 'available',
        currentGuest: null
      });

      setShowModal(false);
      setAdditionalCharges(0);
      setFinalPayment(0);
      await fetchRooms();
      await fetchGuests();
      toast.success('Guest checked out successfully!');
    } catch (error: any) {
      console.error('Check-out error:', error);
      toast.error(error.message || 'Failed to check out guest');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoom = async (room: Room, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (room.status === 'occupied') {
      toast.error('Cannot delete occupied room');
      return;
    }

    if (!confirm(`Are you sure you want to delete Room ${room.number}?`)) return;

    try {
      await apiClient.deleteRoom(hotel._id, room._id);
      await fetchRooms();
      toast.success('Room deleted successfully');
    } catch (error) {
      console.error('Failed to delete room:', error);
      toast.error('Failed to delete room');
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

  const closeModal = () => {
    setShowModal(false);
    setSelectedRoom(null);
    setAdditionalCharges(0);
    setFinalPayment(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Room Management</h2>
            <p className="text-gray-600 dark:text-gray-300">Click on rooms to check-in/check-out guests</p>
          </div>
        </div>
        <button
          onClick={handleAddRoom}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Room
        </button>
      </div>

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
          <div
            key={room._id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border-2 cursor-pointer transition-all hover:shadow-md ${getRoomStatusColor(room.status)}`}
            onClick={() => handleRoomClick(room)}
          >
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

            {/* Room Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={(e) => handleEditRoom(room, e)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
              >
                <Edit className="h-3 w-3" />
                Edit
              </button>
              
              {room.status !== 'occupied' && (
                <button
                  onClick={(e) => handleRoomStatusChange(room, room.status === 'maintenance' ? 'available' : 'maintenance', e)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                    room.status === 'maintenance'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-yellow-600 text-white hover:bg-yellow-700'
                  }`}
                >
                  <Wrench className="h-3 w-3" />
                  {room.status === 'maintenance' ? 'Fix Done' : 'Maintenance'}
                </button>
              )}

              <button
                onClick={(e) => handleDeleteRoom(room, e)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>

            {/* Click Action Hint */}
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {room.status === 'available' ? 'Click to Check In' : 
                 room.status === 'occupied' ? 'Click to Check Out' : 
                 'Click for Details'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-12">
          <Bed className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No rooms added yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Add your first room to get started</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {modalType === 'checkin' ? `Check In - Room ${selectedRoom?.number}` :
                   modalType === 'checkout' ? `Check Out - Room ${selectedRoom?.number}` :
                   modalType === 'edit-room' ? `Edit Room ${selectedRoom?.number}` :
                   'Add New Room'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Check-in Form */}
              {modalType === 'checkin' && (
                <form onSubmit={handleCheckIn} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {guestDetails.totalAmount > 0 && (
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

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !guestDetails.name || !guestDetails.phone || !guestDetails.idNumber || !guestDetails.checkOutDate}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4" />
                          Check In Guest
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Check-out Form */}
              {modalType === 'checkout' && (
                <form onSubmit={handleCheckOut} className="space-y-4">
                  {/* Guest Information Display */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{guestDetails.name}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-300">Room</p>
                        <p className="font-medium text-gray-900 dark:text-white">{guestDetails.roomNumber} ({guestDetails.roomType})</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-300">Stay Duration</p>
                        <p className="font-medium text-gray-900 dark:text-white">{guestDetails.totalNights} nights</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-300">Guests</p>
                        <p className="font-medium text-gray-900 dark:text-white">{guestDetails.adults + guestDetails.children}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-300">Phone</p>
                        <p className="font-medium text-gray-900 dark:text-white">{guestDetails.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Billing Details */}
                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-900 dark:text-white">Final Billing</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Room Charges ({guestDetails.totalNights} nights × ₹{guestDetails.ratePerNight})</span>
                        <span className="text-gray-900 dark:text-white">₹{guestDetails.totalAmount.toLocaleString()}</span>
                      </div>
                      
                      <div>
                        <label className="block text-gray-600 dark:text-gray-300 mb-1">Additional Charges</label>
                        <input
                          type="number"
                          min="0"
                          value={additionalCharges}
                          onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Food, services, etc."
                        />
                      </div>
                      
                      <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
                        <span className="font-medium text-gray-900 dark:text-white">Subtotal</span>
                        <span className="font-medium text-gray-900 dark:text-white">₹{calculateFinalBill().toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Already Paid</span>
                        <span className="text-green-600 dark:text-green-400">₹{guestDetails.paidAmount.toLocaleString()}</span>
                      </div>

                      <div>
                        <label className="block text-gray-600 dark:text-gray-300 mb-1">Additional Payment</label>
                        <input
                          type="number"
                          min="0"
                          value={finalPayment}
                          onChange={(e) => setFinalPayment(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Final payment amount"
                        />
                      </div>

                      <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
                        <span className="font-medium text-gray-900 dark:text-white">Final Pending</span>
                        <span className={`font-medium ${calculateFinalPending() > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          ₹{calculateFinalPending().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <LogOut className="h-4 w-4" />
                          Complete Check-out
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Room Edit/Add Form */}
              {(modalType === 'edit-room' || modalType === 'add-room') && (
                <form onSubmit={handleSaveRoom} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Room Number *
                      </label>
                      <input
                        type="text"
                        value={editingRoom.number}
                        onChange={(e) => setEditingRoom({ ...editingRoom, number: e.target.value })}
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
                        value={editingRoom.type}
                        onChange={(e) => setEditingRoom({ ...editingRoom, type: e.target.value })}
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
                        value={editingRoom.rate}
                        onChange={(e) => setEditingRoom({ ...editingRoom, rate: parseFloat(e.target.value) || 0 })}
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
                        value={editingRoom.name}
                        onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
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
                        value={editingRoom.maxOccupancy}
                        onChange={(e) => setEditingRoom({ ...editingRoom, maxOccupancy: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Room Status
                    </label>
                    <select
                      value={editingRoom.status}
                      onChange={(e) => setEditingRoom({ ...editingRoom, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="available">Available</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="out-of-order">Out of Order</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amenities
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                      {amenitiesList.map((amenity) => (
                        <label key={amenity} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingRoom.amenities.includes(amenity)}
                            onChange={(e) => {
                              const updatedAmenities = e.target.checked
                                ? [...editingRoom.amenities, amenity]
                                : editingRoom.amenities.filter(a => a !== amenity);
                              setEditingRoom({ ...editingRoom, amenities: updatedAmenities });
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
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          {modalType === 'add-room' ? 'Add Room' : 'Update Room'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};