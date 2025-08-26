import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Settings, Clock } from 'lucide-react';
import { apiClient } from '../../utils/api';
import toast from 'react-hot-toast';

interface RoomServiceItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  estimatedTime: string;
  isAvailable: boolean;
}

interface RoomServiceMenuPanelProps {
  hotelId: string;
}

export const RoomServiceMenuPanel: React.FC<RoomServiceMenuPanelProps> = ({ hotelId }) => {
  const [serviceItems, setServiceItems] = useState<RoomServiceItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<RoomServiceItem | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    category: 'housekeeping',
    estimatedTime: '15 minutes'
  });
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    { value: 'housekeeping', label: 'Housekeeping' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'amenities', label: 'Amenities' },
    { value: 'concierge', label: 'Concierge' },
    { value: 'other', label: 'Other' }
  ];

  const timeOptions = [
    '5 minutes',
    '10 minutes',
    '15 minutes',
    '30 minutes',
    '1 hour',
    '2 hours',
    'Same day',
    'Next day'
  ];

  useEffect(() => {
    fetchServiceItems();
  }, [hotelId]);

  const fetchServiceItems = async () => {
    try {
      const data = await apiClient.getRoomServiceMenu(hotelId);
      setServiceItems(data);
    } catch (error) {
      toast.error('Failed to load room service menu');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.category.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.createRoomServiceItem(hotelId, newItem);
      setNewItem({ name: '', description: '', category: 'housekeeping', estimatedTime: '15 minutes' });
      setIsAddingItem(false);
      fetchServiceItems();
      toast.success('Room service item added successfully');
    } catch (error) {
      toast.error('Failed to add room service item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsLoading(true);
    try {
      await apiClient.updateRoomServiceItem(hotelId, editingItem._id, editingItem);
      setEditingItem(null);
      fetchServiceItems();
      toast.success('Room service item updated successfully');
    } catch (error) {
      toast.error('Failed to update room service item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await apiClient.deleteRoomServiceItem(hotelId, itemId);
      fetchServiceItems();
      toast.success('Room service item deleted successfully');
    } catch (error) {
      toast.error('Failed to delete room service item');
    }
  };

  const handleToggleAvailability = async (item: RoomServiceItem) => {
    try {
      await apiClient.updateRoomServiceItem(hotelId, item._id, { 
        ...item, 
        isAvailable: !item.isAvailable 
      });
      fetchServiceItems();
      toast.success(`Item ${item.isAvailable ? 'disabled' : 'enabled'} successfully`);
    } catch (error) {
      toast.error('Failed to update item availability');
    }
  };

  const categorizedItems = categories.map(category => ({
    ...category,
    items: serviceItems.filter(item => item.category === category.value)
  })).filter(category => category.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-3">
          <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Room Service Menu</h2>
            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300 hidden sm:block">Manage available room service options</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddingItem(true)}
          className="bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-purple-700 transition-colors flex items-center gap-1 sm:gap-2"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Add Service</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Add/Edit Item Form */}
      {(isAddingItem || editingItem) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-4">
            {editingItem ? 'Edit Room Service Item' : 'Add New Room Service Item'}
          </h3>
          <form onSubmit={editingItem ? handleEditItem : handleAddItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={editingItem ? editingItem.name : newItem.name}
                  onChange={(e) => editingItem 
                    ? setEditingItem({ ...editingItem, name: e.target.value })
                    : setNewItem({ ...newItem, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Clean Room"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <label key={category.value} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={category.value}
                        checked={editingItem ? editingItem.category === category.value : newItem.category === category.value}
                        onChange={(e) => editingItem 
                          ? setEditingItem({ ...editingItem, category: e.target.value })
                          : setNewItem({ ...newItem, category: e.target.value })
                        }
                        className="mr-2"
                      />
                      <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-300">{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={editingItem ? editingItem.description : newItem.description}
                onChange={(e) => editingItem 
                  ? setEditingItem({ ...editingItem, description: e.target.value })
                  : setNewItem({ ...newItem, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe the service..."
                rows={3}
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estimated Time *
              </label>
              <select
                value={editingItem ? editingItem.estimatedTime : newItem.estimatedTime}
                onChange={(e) => editingItem 
                  ? setEditingItem({ ...editingItem, estimatedTime: e.target.value })
                  : setNewItem({ ...newItem, estimatedTime: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAddingItem(false);
                  setEditingItem(null);
                }}
                className="px-4 py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm sm:text-base bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Service Items by Category */}
      {categorizedItems.length > 0 ? (
        categorizedItems.map(category => (
          <div key={category.value} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">{category.label}</h3>
            </div>
            <div className="p-3 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {category.items.map(item => (
                  <div key={item._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate mr-2">{item.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs sm:text-sm text-purple-600 flex items-center">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        {item.estimatedTime}
                      </span>
                    </div>
                    <div className="flex gap-1 sm:gap-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                          item.isAvailable
                            ? 'text-yellow-600 hover:bg-yellow-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        <span className="text-sm">{item.isAvailable ? '⏸️' : '▶️'}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item._id)}
                        className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No room service items added yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Add your first service item to get started</p>
        </div>
      )}
    </div>
  );
};