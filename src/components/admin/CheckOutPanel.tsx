import React, { useState } from 'react';
import { DoorOpen, Search, Calculator, CreditCard, FileText } from 'lucide-react';

interface CheckOutPanelProps {
  hotel: any;
}

export const CheckOutPanel: React.FC<CheckOutPanelProps> = ({ hotel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<any>(null);

  // Mock guest data
  const guests = [
    {
      id: '1',
      name: 'John Doe',
      roomNumber: '101',
      checkInDate: '2024-01-10',
      checkOutDate: '2024-01-15',
      totalAmount: 12500,
      paidAmount: 10000,
      pendingAmount: 2500,
      status: 'checked-in'
    },
    {
      id: '2',
      name: 'Jane Smith',
      roomNumber: '102',
      checkInDate: '2024-01-12',
      checkOutDate: '2024-01-16',
      totalAmount: 8000,
      paidAmount: 8000,
      pendingAmount: 0,
      status: 'checked-in'
    }
  ];

  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.roomNumber.includes(searchTerm)
  );

  const handleCheckOut = (guest: any) => {
    // Handle check-out logic
    console.log('Checking out guest:', guest);
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

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by guest name or room number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Guest List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Guests Ready for Check-out</h3>
          <div className="space-y-4">
            {filteredGuests.map((guest) => (
              <div
                key={guest.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedGuest?.id === guest.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                onClick={() => setSelectedGuest(guest)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{guest.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Room {guest.roomNumber}</p>
                  </div>
                  <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                    {guest.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <p>Check-in: {new Date(guest.checkInDate).toLocaleDateString()}</p>
                  <p>Check-out: {new Date(guest.checkOutDate).toLocaleDateString()}</p>
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
          </div>
        </div>

        {/* Check-out Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Check-out Details</h3>
          {selectedGuest ? (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{selectedGuest.name}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300">Room Number</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedGuest.roomNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-300">Stay Duration</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {Math.ceil((new Date(selectedGuest.checkOutDate).getTime() - new Date(selectedGuest.checkInDate).getTime()) / (1000 * 60 * 60 * 24))} nights
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-gray-900 dark:text-white">Billing Summary</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Room Charges</span>
                    <span className="text-gray-900 dark:text-white">₹10,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Food & Beverage</span>
                    <span className="text-gray-900 dark:text-white">₹2,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Services</span>
                    <span className="text-gray-900 dark:text-white">₹500</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
                    <span className="font-medium text-gray-900 dark:text-white">Total Amount</span>
                    <span className="font-medium text-gray-900 dark:text-white">₹{selectedGuest.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Paid Amount</span>
                    <span className="text-green-600 dark:text-green-400">₹{selectedGuest.paidAmount.toLocaleString()}</span>
                  </div>
                  {selectedGuest.pendingAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Pending Amount</span>
                      <span className="text-red-600 dark:text-red-400 font-medium">₹{selectedGuest.pendingAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  <FileText className="h-4 w-4" />
                  Generate Final Bill
                </button>
                
                {selectedGuest.pendingAmount > 0 && (
                  <button className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                    <CreditCard className="h-4 w-4" />
                    Collect Payment
                  </button>
                )}
                
                <button
                  onClick={() => handleCheckOut(selectedGuest)}
                  disabled={selectedGuest.pendingAmount > 0}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <DoorOpen className="h-4 w-4" />
                  Complete Check-out
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <DoorOpen className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Select a guest to process check-out</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};