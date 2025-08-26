import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, UtensilsCrossed, DollarSign } from 'lucide-react';
import { apiClient } from '../../utils/api';
import toast from 'react-hot-toast';

interface FoodItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  image?: string;
}

interface FoodMenuPanelProps {
  hotelId: string;
}

export const FoodMenuPanel: React.FC<FoodMenuPanelProps> = ({ hotelId }) => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchFoodItems();
  }, [hotelId]);

  const fetchFoodItems = async () => {
    try {
      const data = await apiClient.getFoodMenu(hotelId);
      setFoodItems(data);
    } catch (error) {
      toast.error('Failed to load food menu');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.category.trim() || newItem.price <= 0) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.createFoodItem(hotelId, newItem);
      setNewItem({ name: '', description: '', price: 0, category: '', image: '' });
      setIsAddingItem(false);
      fetchFoodItems();
      toast.success('Food item added successfully');
    } catch (error) {
      toast.error('Failed to add food item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsLoading(true);
    try {
      await apiClient.updateFoodItem(hotelId, editingItem._id, editingItem);
      setEditingItem(null);
      fetchFoodItems();
      toast.success('Food item updated successfully');
    } catch (error) {
      toast.error('Failed to update food item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await apiClient.deleteFoodItem(hotelId, itemId);
      fetchFoodItems();
      toast.success('Food item deleted successfully');
    } catch (error) {
      toast.error('Failed to delete food item');
    }
  };

  const handleToggleAvailability = async (item: FoodItem) => {
    try {
      await apiClient.updateFoodItem(hotelId, item._id, { 
        ...item, 
        isAvailable: !item.isAvailable 
      });
      fetchFoodItems();
      toast.success(`Item ${item.isAvailable ? 'disabled' : 'enabled'} successfully`);
    } catch (error) {
      toast.error('Failed to update item availability');
    }
  };

  const categories = [...new Set(foodItems.map(item => item.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-3">
          <UtensilsCrossed className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Food Menu</h2>
            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300 hidden sm:block">Manage your hotel's food menu and pricing</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddingItem(true)}
          className="bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-orange-700 transition-colors flex items-center gap-1 sm:gap-2"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Add Food Item</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Add/Edit Item Form */}
      {(isAddingItem || editingItem) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-4">
            {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
          </h3>
          <form onSubmit={editingItem ? handleEditItem : handleAddItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={editingItem ? editingItem.name : newItem.name}
                  onChange={(e) => editingItem 
                    ? setEditingItem({ ...editingItem, name: e.target.value })
                    : setNewItem({ ...newItem, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Chicken Biryani"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  value={editingItem ? editingItem.category : newItem.category}
                  onChange={(e) => editingItem 
                    ? setEditingItem({ ...editingItem, category: e.target.value })
                    : setNewItem({ ...newItem, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Main Course"
                  required
                />
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Describe the dish..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingItem ? editingItem.price : newItem.price}
                  onChange={(e) => editingItem 
                    ? setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })
                    : setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={editingItem ? editingItem.image || '' : newItem.image}
                  onChange={(e) => editingItem 
                    ? setEditingItem({ ...editingItem, image: e.target.value })
                    : setNewItem({ ...newItem, image: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
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
                className="px-4 py-2 text-sm sm:text-base bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Food Items by Category */}
      {categories.length > 0 ? (
        categories.map(category => (
          <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">{category}</h3>
            </div>
            <div className="p-3 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {foodItems
                  .filter(item => item.category === category)
                  .map(item => (
                    <div key={item._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-24 sm:h-32 object-cover rounded-lg mb-3"
                        />
                      )}
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
                      <div className="flex items-center justify-between">
                        <span className="text-base sm:text-lg font-bold text-orange-600 flex items-center">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                          ₹{item.price}
                        </span>
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
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12">
          <UtensilsCrossed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No food items added yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Add your first food item to get started</p>
        </div>
      )}
    </div>
  );
};