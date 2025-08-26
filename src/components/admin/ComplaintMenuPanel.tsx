import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MessageCircle, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../utils/api';
import toast from 'react-hot-toast';

interface ComplaintItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  priority: string;
  isAvailable: boolean;
}

interface ComplaintMenuPanelProps {
  hotelId: string;
}

export const ComplaintMenuPanel: React.FC<ComplaintMenuPanelProps> = ({ hotelId }) => {
  const [complaintItems, setComplaintItems] = useState<ComplaintItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ComplaintItem | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    category: 'service',
    priority: 'medium'
  });
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    { value: 'service', label: 'Service' },
    { value: 'facility', label: 'Facility' },
    { value: 'cleanliness', label: 'Cleanliness' },
    { value: 'noise', label: 'Noise' },
    { value: 'billing', label: 'Billing' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-red-600' }
  ];

  useEffect(() => {
    fetchComplaintItems();
  }, [hotelId]);

  const fetchComplaintItems = async () => {
    try {
      const data = await apiClient.getComplaintMenu(hotelId);
      setComplaintItems(data);
    } catch (error) {
      toast.error('Failed to load complaint menu');
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
      await apiClient.createComplaintItem(hotelId, newItem);
      setNewItem({ name: '', description: '', category: 'service', priority: 'medium' });
      setIsAddingItem(false);
      fetchComplaintItems();
      toast.success('Complaint item added successfully');
    } catch (error) {
      toast.error('Failed to add complaint item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsLoading(true);
    try {
      await apiClient.updateComplaintItem(hotelId, editingItem._id, editingItem);
      setEditingItem(null);
      fetchComplaintItems();
      toast.success('Complaint item updated successfully');
    } catch (error) {
      toast.error('Failed to update complaint item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await apiClient.deleteComplaintItem(hotelId, itemId);
      fetchComplaintItems();
      toast.success('Complaint item deleted successfully');
    } catch (error) {
      toast.error('Failed to delete complaint item');
    }
  };

  const handleToggleAvailability = async (item: ComplaintItem) => {
    try {
      await apiClient.updateComplaintItem(hotelId, item._id, { 
        ...item, 
        isAvailable: !item.isAvailable 
      });
      fetchComplaintItems();
      toast.success(`Item ${item.isAvailable ? 'disabled' : 'enabled'} successfully`);
    } catch (error) {
      toast.error('Failed to update item availability');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const categorizedItems = categories.map(category => ({
    ...category,
    items: complaintItems.filter(item => item.category === category.value)
  })).filter(category => category.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-3">
          <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Complaint Menu</h2>
            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300 hidden sm:block">Manage complaint categories and types</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddingItem(true)}
          className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-red-700 transition-colors flex items-center gap-1 sm:gap-2"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Add Complaint Type</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Add/Edit Item Form */}
      {(isAddingItem || editingItem) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-4">
            {editingItem ? 'Edit Complaint Type' : 'Add New Complaint Type'}
          </h3>
          <form onSubmit={editingItem ? handleEditItem : handleAddItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Complaint Name *
                </label>
                <input
                  type="text"
                  value={editingItem ? editingItem.name : newItem.name}
                  onChange={(e) => editingItem 
                    ? setEditingItem({ ...editingItem, name: e.target.value })
                    : setNewItem({ ...newItem, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Room not clean"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority *
                </label>
                <div className="flex gap-4">
                  {priorities.map((priority) => (
                    <label key={priority.value} className="flex items-center">
                      <input
                        type="radio"
                        name="priority"
                        value={priority.value}
                        checked={editingItem ? editingItem.priority === priority.value : newItem.priority === priority.value}
                        onChange={(e) => editingItem 
                          ? setEditingItem({ ...editingItem, priority: e.target.value })
                          : setNewItem({ ...newItem, priority: e.target.value })
                        }
                        className="mr-2"
                      />
                      <span className={`text-xs sm:text-sm font-medium ${priority.color}`}>{priority.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Describe the complaint type..."
                rows={3}
              />
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
                className="px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Complaint Items by Category */}
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
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
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No complaint types added yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Add your first complaint type to get started</p>
        </div>
      )}
    </div>
  );
};