import React, { useState, useEffect } from 'react';
import { DoorOpen, Search, Calculator, CreditCard, FileText, User, Phone, Calendar, Users } from 'lucide-react';
import { apiClient } from '../../utils/api';
import toast from 'react-hot-toast';

interface CheckOutPanelProps {
  hotel: any;
}

interface Guest {
  _id: string;
  name: string;
  email: string;
  phone: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  advancePayment: number;
  ratePerNight: number;
  totalNights: number;
  additionalCharges?: number;
  status: 'checked-in' | 'checked-out';
  specialRequests?: string;
  roomId: string;
}

export const CheckOutPanel: React.FC<CheckOutPanelProps> = ({ hotel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [finalPayment, setFinalPayment] = useState(0);

  useEffect(() => {
    fetchGuests();
  }, [hotel._id]);

  const fetchGuests = async () => {
    try {
      const data = await apiClient.getGuests(hotel._id);
      setGuests(data.filter((guest: Guest) => guest.status === 'checked-in'));
    } catch (error) {
      console.error('Failed to fetch guests:', error);
      toast.error('Failed to load guests');
    }
  };

  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.roomNumber.includes(searchTerm) ||
    guest.phone.includes(searchTerm)
  );

  const handleGuestSelect = (guest: Guest) => {
    setSelectedGuest(guest);
    setAdditionalCharges(guest.additionalCharges || 0);
    setFinalPayment(0);
  };

  const calculateFinalBill = () => {
    if (!selectedGuest) return 0;
    return selectedGuest.totalAmount + additionalCharges;
  };

  const calculateFinalPending = () => {
    if (!selectedGuest) return 0;
    const finalBill = calculateFinalBill();
    const totalPaid = selectedGuest.paidAmount + finalPayment;
    return Math.max(0, finalBill - totalPaid);
  };

  const handleCheckOut = async () => {
    if (!selectedGuest) return;

    const finalBill = calculateFinalBill();
    const totalPaid = selectedGuest.paidAmount + finalPayment;
    const finalPending = calculateFinalPending();

    if (finalPending > 0 && !confirm(`Guest has pending amount of ₹${finalPending.toLocaleString()}. Continue with check-out?`)) {
      return;
    }

    setIsLoading(true);
    try {
      // Update guest with final billing details
      await apiClient.updateGuest(hotel._id, selectedGuest._id, {
        status: 'checked-out',
        totalAmount: finalBill,
        paidAmount: totalPaid,
        pendingAmount: finalPending,
        additionalCharges,
        checkOutDate: new Date().toISOString()
      });

      // Update room status to available
      await apiClient.updateRoom(hotel._id, selectedGuest.roomId, { 
        status: 'available',
        currentGuest: null
      });

      setSelectedGuest(null);
      setAdditionalCharges(0);
      setFinalPayment(0);
      fetchGuests();
      toast.success('Guest checked out successfully!');
    } catch (error) {
      console.error('Check-out error:', error);
      toast.error('Failed to check out guest');
    } finally {
      setIsLoading(false);
    }
  };

  const generateBill = () => {
    if (!selectedGuest) return;
    
    const billData = {
      guest: selectedGuest,
      finalBill: calculateFinalBill(),
      additionalCharges,
      finalPending: calculateFinalPending()
    };
    
    console.log('Generating bill:', billData);
    toast.success('Bill generated successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DoorOpen className="h-8 w-8 text-red-600 dark:text-red-400" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Check Out</h2>
          <p className="text-gray-600 dark:text-gray-300">Process guest check-outs and final billing</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Checked In</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{guests.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{guests.reduce((sum, guest) => sum + guest.totalAmount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <CreditCard className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{guests.reduce((sum, guest) => sum + guest.pendingAmount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Avg Stay</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {guests.length > 0 ? Math.round(guests.reduce((sum, guest) => sum + guest.totalNights, 0) / guests.length) : 0} nights
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by guest name, room number, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Guest List and Check-out Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guest List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Guests Ready for Check-out ({filteredGuests.length})
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredGuests.map((guest) => (
              <div
                key={guest._id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedGuest?._id === guest._id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                onClick={() => handleGuestSelect(guest)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{guest.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Room {guest.roomNumber} • {guest.roomType}</p>
                  </div>
                  <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                    {guest.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(guest.checkInDate).toLocaleDateString()} - {new Date(guest.checkOutDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{guest.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    <span>{guest.adults + guest.children} guests • {guest.totalNights} nights</span>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Total: ₹{guest.totalAmount.toLocaleString()}
                  </span>
                  {guest.pendingAmount > 0 && (
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      Pending: ₹{guest.pendingAmount.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {filteredGuests.length === 0 && (
              <div className="text-center py-8">
                <DoorOpen className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No guests found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {searchTerm ? 'Try a different search term' : 'No guests ready for check-out'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Check-out Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Check-out Details</h3>
          {selectedGuest ? (
            <div className="space-y-6">
              {/* Guest Information */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{selectedGuest.name}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300">Room</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedGuest.roomNumber} ({selectedGuest.roomType})</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-300">Stay Duration</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedGuest.totalNights} nights</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-300">Guests</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedGuest.adults + selectedGuest.children}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-300">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedGuest.phone}</p>
                  </div>
                </div>
              </div>

              {/* Billing Details */}
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900 dark:text-white">Billing Summary</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Room Charges ({selectedGuest.totalNights} nights × ₹{selectedGuest.ratePerNight})</span>
                    <span className="text-gray-900 dark:text-white">₹{selectedGuest.totalAmount.toLocaleString()}</span>
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
                    <span className="text-green-600 dark:text-green-400">₹{selectedGuest.paidAmount.toLocaleString()}</span>
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

              {/* Special Requests */}
              {selectedGuest.specialRequests && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                  <h5 className="font-medium text-yellow-900 dark:text-yellow-300 mb-1">Special Requests</h5>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">{selectedGuest.specialRequests}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={generateBill}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Generate Final Bill
                </button>
                
                {calculateFinalPending() > 0 && (
                  <button
                    onClick={() => {
                      const pending = calculateFinalPending();
                      setFinalPayment(finalPayment + pending);
                      toast.success('Payment collected successfully!');
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    <CreditCard className="h-4 w-4" />
                    Collect Pending Payment (₹{calculateFinalPending().toLocaleString()})
                  </button>
                )}
                
                <button
                  onClick={handleCheckOut}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <DoorOpen className="h-4 w-4" />
                      Complete Check-out
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <DoorOpen className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Select a guest to process check-out</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Choose from the list on the left</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};