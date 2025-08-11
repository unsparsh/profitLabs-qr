import { useTheme } from '../../contexts/ThemeContext';
import React, { useState } from 'react';
import { Plus, QrCode, Settings, Trash2, Download } from 'lucide-react';
import { apiClient } from '../../utils/api';
import toast from 'react-hot-toast';

interface RoomsPanelProps {
  rooms: any[];
  onRoomsUpdate: () => void;
  hotelId: string;
}

export const RoomsPanel: React.FC<RoomsPanelProps> = ({ 
  rooms, 
  onRoomsUpdate, 
  hotelId 
}) => {
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({ number: '', name: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.number.trim()) {
      toast.error('Room number is required');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.createRoom(hotelId, {
        number: newRoom.number,
        name: newRoom.name || `Room ${newRoom.number}`,
      });
      setNewRoom({ number: '', name: '' });
      setIsAddingRoom(false);
      onRoomsUpdate();
      toast.success('Room added successfully');
    } catch (error) {
      toast.error('Failed to add room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      await apiClient.deleteRoom(hotelId, roomId);
      onRoomsUpdate();
      toast.success('Room deleted successfully');
    } catch (error) {
      toast.error('Failed to delete room');
    }
  };

  const handleToggleRoom = async (roomId: string, isActive: boolean) => {
    try {
      await apiClient.updateRoom(hotelId, roomId, { isActive: !isActive });
      onRoomsUpdate();
      toast.success(`Room ${isActive ? 'disabled' : 'enabled'} successfully`);
    } catch (error) {
      toast.error('Failed to update room status');
    }
  };

  const downloadQRCode = (room: any) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const qrSize = 300;
    
    canvas.width = qrSize;
    canvas.height = qrSize + 80;
    
    // Create QR code data URL
    const qrDataUrl = room.qrCode;
    const img = new Image();
    img.onload = () => {
      // Draw QR code
      ctx?.drawImage(img, 0, 0, qrSize, qrSize);
      
      // Add room info
      if (ctx) {
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Room ${room.number}`, qrSize / 2, qrSize + 30);
        ctx.font = '12px Arial';
        ctx.fillText('Scan for room service', qrSize / 2, qrSize + 50);
      }
      
      // Download
      const link = document.createElement('a');
      link.download = `room-${room.number}-qr.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    img.src = qrDataUrl;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Rooms & QR Codes</h2>
        <button
          onClick={() => setIsAddingRoom(true)}
          className="bg-blue-600 dark:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center gap-1 sm:gap-2"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Add Room</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Add Room Form */}
      {isAddingRoom && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-colors">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Room</h3>
          <form onSubmit={handleAddRoom} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="roomNumber" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Room Number *
                </label>
                <input
                  id="roomNumber"
                  type="text"
                  value={newRoom.number}
                  onChange={(e) => setNewRoom({ ...newRoom, number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="e.g., 101"
                  required
                />
              </div>
              <div>
                <label htmlFor="roomName" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Room Name (Optional)
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="e.g., Deluxe Suite"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsAddingRoom(false)}
                className="px-4 py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm sm:text-base bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Adding...' : 'Add Room'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {rooms.map((room) => (
          <div key={room._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="p-3 sm:p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    Room {room.number}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">{room.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    room.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {room.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-2 sm:p-4 rounded-lg">
                  <img 
                    src={room.qrCode} 
                    alt={`QR Code for Room ${room.number}`}
                    className="w-24 h-24 sm:w-32 sm:h-32"
                  />
                </div>
              </div>
              
              <div className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-4">
                <p>Scan to access room services</p>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => downloadQRCode(room)}
                  className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-2 px-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center justify-center gap-1 sm:gap-2"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  Download
                </button>
                <div className="flex gap-2">
                  <button
                  onClick={() => handleToggleRoom(room._id, room.isActive)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1 sm:gap-2 ${
                    room.isActive
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-800'
                  }`}
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{room.isActive ? 'Disable' : 'Enable'}</span>
                  <span className="sm:hidden">{room.isActive ? 'Off' : 'On'}</span>
                </button>
                <button
                  onClick={() => handleDeleteRoom(room._id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {rooms.length === 0 && (
        <div className="text-center py-12">
          <QrCode className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No rooms added yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Add your first room to get started</p>
        </div>
      )}
    </div>
  );
};